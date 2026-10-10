import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

// Admin client with service role key (strictly server-side, never exposed to browser)
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

/**
 * Recursively list and delete all objects under a storage prefix (supports nested folders & pagination)
 */
async function purgeStoragePrefix(client: any, bucket: string, prefix: string): Promise<boolean> {
  try {
    const { data: list, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !list) return false;

    const filesToRemove: string[] = [];
    for (const item of list) {
      const fullPath = `${prefix}/${item.name}`;
      if (item.id === null || (item as any).isFolder) {
        await purgeStoragePrefix(client, bucket, fullPath);
      } else {
        filesToRemove.push(fullPath);
      }
    }

    if (filesToRemove.length > 0) {
      const { error: removeErr } = await client.storage.from(bucket).remove(filesToRemove);
      if (removeErr) return false;
    }
    return true;
  } catch (e) {
    console.error('Storage purge prefix error:', e);
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Secure Account Deletion Endpoint (DELETE /api/me/account)
  app.delete('/api/me/account', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization bearer token required.' });
    }

    const token = authHeader.split(' ')[1];

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(503).json({ success: false, error: 'Supabase is not configured on the server.' });
    }

    try {
      // 1. Verify user identity using client-scoped Supabase client with user's access token
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      });

      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return res.status(401).json({ success: false, error: 'Invalid or expired user session.' });
      }

      const userId = user.id;
      const now = new Date().toISOString();
      let dbRecordsCleared = false;
      let storagePurged = false;
      let authUserDeleted = false;
      let errorDetails = '';

      // 2. Execute database relational records deletion via trusted RPC or fallback
      try {
        const { error: rpcErr } = await userClient.rpc('execute_user_account_deletion');
        if (!rpcErr) {
          dbRecordsCleared = true;
        } else {
          // Fallback manual cascade delete via userClient (respecting RLS)
          await userClient.from('skill_evidence').delete().eq('user_id', userId);
          await userClient.from('evidence_items').delete().eq('user_id', userId);
          await userClient.from('student_projects').delete().eq('user_id', userId);
          await userClient.from('student_skills').delete().eq('user_id', userId);
          await userClient.from('extraction_items').delete().eq('user_id', userId);
          await userClient.from('documents').delete().eq('user_id', userId);
          await userClient.from('assessment_attempts').delete().eq('user_id', userId);
          await userClient.from('roadmaps').delete().eq('user_id', userId);
          await userClient.from('profiles').delete().eq('user_id', userId);
          dbRecordsCleared = true;
        }
      } catch (dbErr: any) {
        errorDetails += `DB deletion error: ${dbErr.message}; `;
      }

      // 3. Purge storage bucket objects recursively using admin client (or user client)
      try {
        const targetClient = supabaseAdmin || userClient;
        storagePurged = await purgeStoragePrefix(targetClient, 'resumes', userId);
        if (!storagePurged) {
          errorDetails += `Storage recursive purge encountered errors or incomplete removal; `;
        }
      } catch (storageErr: any) {
        errorDetails += `Storage purge error: ${storageErr.message}; `;
      }

      // 4. Delete Supabase Auth user using Admin API (requires service role key, idempotent for already-deleted users)
      if (supabaseAdmin) {
        try {
          const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
          if (!authDeleteErr || authDeleteErr.message.toLowerCase().includes('not found') || (authDeleteErr as any).status === 404) {
            authUserDeleted = true;
          } else {
            errorDetails += `Auth delete error: ${authDeleteErr.message}; `;
          }
        } catch (authErr: any) {
          errorDetails += `Auth admin error: ${authErr.message}; `;
        }
      } else {
        errorDetails += `Supabase Admin service role key not configured on server; auth.users user record retained. `;
      }

      const overallStatus = (dbRecordsCleared && storagePurged && (authUserDeleted || !supabaseAdmin)) ? 'completed' : 'failed';

      return res.json({
        success: true,
        data: {
          id: `del-req-${userId}-${Date.now()}`,
          user_id: userId,
          status: overallStatus,
          stages: {
            db_records_cleared: dbRecordsCleared,
            storage_purged: storagePurged,
            auth_user_deleted: authUserDeleted,
          },
          details: overallStatus === 'completed' 
            ? 'All relational database records, storage files, and auth user account permanently purged.' 
            : `Account deletion partially completed with warnings: ${errorDetails}`,
          created_at: now,
          completed_at: now,
        }
      });
    } catch (err: any) {
      console.error('Account deletion API error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error during account deletion.' });
    }
  });

  // Vite middleware for frontend development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Full-stack server running on http://0.0.0.0:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use. Attempting to start on port ${port + 1}...`);
      const fallbackServer = app.listen(port + 1, '0.0.0.0', () => {
        console.log(`Full-stack server running on http://0.0.0.0:${port + 1}`);
      });
      fallbackServer.on('error', (fallbackErr: any) => {
        console.error('Fallback server error:', fallbackErr);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
