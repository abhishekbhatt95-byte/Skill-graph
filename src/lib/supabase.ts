import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Centralized Supabase Client Module for SkillGraph AI
 *
 * Reads client-side configuration using import.meta.env:
 * - VITE_SUPABASE_URL: Project URL (e.g. https://<project-ref>.supabase.co)
 * - VITE_SUPABASE_PUBLISHABLE_KEY: Publishable anon key (or VITE_SUPABASE_ANON_KEY as fallback)
 *
 * Security Note:
 * Only publishable/anon client keys are accepted.
 * Service-role keys (which bypass Row Level Security) and database passwords
 * must NEVER be bundled or accessed in browser client code.
 */

const env: Record<string, any> =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? process.env
    : {};

const rawUrl = env.VITE_SUPABASE_URL;
const rawKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
export const supabasePublishableKey = typeof rawKey === 'string' ? rawKey.trim() : '';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingVariables: string[];
  url: string | null;
  errorMessage: string | null;
}

function validateConfiguration(): SupabaseConfigStatus {
  const missing: string[] = [];

  if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
    missing.push('VITE_SUPABASE_URL');
  }

  if (
    !supabasePublishableKey ||
    supabasePublishableKey.includes('your-supabase-publishable-key') ||
    supabasePublishableKey.includes('your-supabase-anon-key')
  ) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  if (missing.length > 0) {
    const errorMsg = `[Supabase Setup Required] Missing or unconfigured environment variable(s): ${missing.join(', ')}. Please define these in your .env file or project environment settings.`;
    return {
      isConfigured: false,
      missingVariables: missing,
      url: supabaseUrl || null,
      errorMessage: errorMsg,
    };
  }

  // Validate URL protocol
  try {
    const parsed = new URL(supabaseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL must use http or https protocol');
    }
  } catch {
    return {
      isConfigured: false,
      missingVariables: [],
      url: supabaseUrl,
      errorMessage: `[Supabase Setup Error] Invalid VITE_SUPABASE_URL: "${supabaseUrl}". It must be a valid HTTP/HTTPS URL.`,
    };
  }

  return {
    isConfigured: true,
    missingVariables: [],
    url: supabaseUrl,
    errorMessage: null,
  };
}

export const supabaseConfigStatus = validateConfiguration();
export const isSupabaseConfigured = supabaseConfigStatus.isConfigured;
export const supabaseConfigError = supabaseConfigStatus.errorMessage;

if (!isSupabaseConfigured) {
  console.warn(supabaseConfigError);
}

/**
 * Initialized Supabase client instance
 * Returns the active client if configured, or a fallback client to prevent runtime crash
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabasePublishableKey || 'placeholder-anon-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      supabaseConfigError ||
        'Supabase is not properly configured. Check your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  return supabase;
}
