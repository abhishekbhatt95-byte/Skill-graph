import React, { useState } from 'react';
import { UserProfile } from '../../types/canonical';
import { supabaseAuth } from '../../services/supabaseAuth';
import { storage } from '../../services/storageService';
import { Compass, Clock, Award, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingViewProps {
  user: any;
  onCompleted: () => void;
}

export function OnboardingView({ user, onCompleted }: OnboardingViewProps) {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [roleTargetId, setRoleTargetId] = useState('role-da-jr-v1');
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedProfile: UserProfile = {
        id: user.id,
        user_id: user.id,
        email: user.email || '',
        full_name: fullName.trim(),
        role_target_id: roleTargetId,
        role_target_name: 'Junior Data Analyst v1.0',
        weekly_study_hours: Number(weeklyHours),
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to Supabase profile table & local storage
      await supabaseAuth.syncProfileRecord(user, fullName.trim());
      storage.updateProfile({
        full_name: fullName.trim(),
        role_target_id: roleTargetId,
        weekly_study_hours: Number(weeklyHours),
        onboarding_completed: true,
      });

      setLoading(false);
      onCompleted();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to complete onboarding.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 text-white font-bold text-2xl shadow-lg shadow-indigo-500/30">
            <Compass className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Complete Your Profile</h2>
          <p className="text-sm text-slate-400">Let's tailor your SkillGraph AI roadmap and readiness benchmarks</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Chen"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" /> Target Career Role
            </label>
            <select
              value={roleTargetId}
              onChange={(e) => setRoleTargetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="role-da-jr-v1">Junior Data Analyst (Industry Benchmark v1.0)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Curated benchmark profile with 14 core skills and rigorous hiring standards.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Weekly Study / Practice Hours: <span className="text-white font-bold">{weeklyHours} hrs/week</span>
            </label>
            <input
              type="range"
              min={2}
              max={40}
              step={2}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-full accent-indigo-600 bg-slate-900 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>2 hrs (Casual)</span>
              <span>20 hrs (Intensive)</span>
              <span>40 hrs (Full-time)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Launch Dashboard <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

      </div>
    </div>
  );
}
