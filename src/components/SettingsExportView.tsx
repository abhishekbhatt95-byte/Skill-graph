import React, { useState } from 'react';
import {
  Download,
  Trash2,
  ShieldCheck,
  User,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  FileText,
  Lock,
} from 'lucide-react';
import { storage } from '../services/storageService';
import { AccountDeletionRequest } from '../types/canonical';
import { isSupabaseConfigured, supabaseConfigStatus, supabaseUrl } from '../lib/supabase';

export const SettingsExportView: React.FC = () => {
  const [deletionReceipt, setDeletionReceipt] = useState<AccountDeletionRequest | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const currentUser = storage.getCurrentUser();
  const allUsers = storage.getAllUsers();

  const handleExportJson = () => {
    const exportData = storage.exportMyData();
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `skillgraph-export-${currentUser.user_id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(
      `Successfully generated sanitized JSON export for ${currentUser.full_name} (${exportData.skills.length} skills, ${exportData.evidence.length} evidence artifacts, ${exportData.assessment_history.length} assessment attempts).`
    );
  };

  const handleExecuteDeletion = async () => {
    const receipt = await storage.executeAccountDeletion();
    setDeletionReceipt(receipt);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Data Export & Account Privacy Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          Full compliance with student data ownership standards. Download your complete evidence profile in structured JSON format or execute an irreversible two-stage deletion.
        </p>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Supabase Client Configuration</span>
          </div>
          {isSupabaseConfigured ? (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Configured</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Setup Required</span>
            </span>
          )}
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-500 font-medium">Project Endpoint:</span>
            <code className="font-mono text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
              {supabaseUrl || 'Not configured'}
            </code>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-500 font-medium">Client Key Type:</span>
            <span className="text-slate-700">Publishable / Anon Key (Row Level Security protected)</span>
          </div>
        </div>

        {!isSupabaseConfigured && supabaseConfigStatus.errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            {supabaseConfigStatus.errorMessage}
          </div>
        )}
      </div>

      {/* Tenant / User Switching Context for Testing */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Active Student Profile (Tenant Context)</span>
        </div>
        <p className="text-xs text-slate-600">
          Switch user profiles to evaluate that User A (Alex Chen, Econ Junior) cannot see or modify User B's (Jordan Taylor, CS Sophomore) skills, documents, evidence, or roadmaps.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {allUsers.map((u) => {
            const isSelected = u.user_id === currentUser.user_id;
            return (
              <button
                key={u.user_id}
                onClick={() => storage.switchUser(u.user_id)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{u.full_name}</span>
                  {isSelected && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">Active</span>}
                </div>
                <div className="text-[11px] opacity-80 mt-1 font-mono">{u.email}</div>
                <div className="text-[11px] opacity-75 mt-0.5">Role: {u.role_target_name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Export (GET /api/me/export) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Download className="w-4 h-4 text-slate-700" />
          <span>Structured Personal Data Export (GET /api/me/export)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Exports your profile data, canonical skill proficiencies, projects, evidence citations, assessment attempts, latest deterministic gap analysis, and current active roadmap in a machine-readable JSON archive. Excludes server secrets, authentication tokens, and private infrastructure paths.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            <span>Download skillgraph-export-{currentUser.user_id}.json</span>
          </button>
        </div>

        {exportNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Account Deletion (DELETE /api/me/account) */}
      <div className="bg-white border border-red-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-red-900">
          <Trash2 className="w-4 h-4 text-red-600" />
          <span>Two-Stage Durable Account Deletion (DELETE /api/me/account)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Executes a durable two-stage purge: (1) Purges all relational records (skills, evidence, projects, roadmaps, and quiz attempts) in the database transaction; (2) Unlinks stored resume files and metadata. An audit receipt confirms the completed operation.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            Request Account Data Deletion
          </button>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Are you certain you wish to delete all career intelligence data?</span>
            </div>
            <p className="text-xs text-red-700">
              This action cannot be undone. All verified assessment scores, resume evidence links, and roadmap progress will be erased immediately.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleExecuteDeletion}
                className="px-4 py-1.5 bg-red-700 text-white rounded text-xs font-semibold hover:bg-red-800"
              >
                Confirm Complete Deletion
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {deletionReceipt && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Account Deletion Audit Receipt</span>
            </div>
            <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
              <div>Receipt ID: {deletionReceipt.id}</div>
              <div>User Identifier: {deletionReceipt.user_id}</div>
              <div>Database Records Purged: {deletionReceipt.stages.db_records_cleared ? 'TRUE' : 'FALSE'}</div>
              <div>File Storage Cleaned: {deletionReceipt.stages.storage_purged ? 'TRUE' : 'FALSE'}</div>
              <div>Timestamp: {deletionReceipt.completed_at}</div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">{deletionReceipt.details}</p>
          </div>
        )}
      </div>
    </div>
  );
};
