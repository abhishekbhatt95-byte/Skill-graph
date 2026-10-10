import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';
import { supabaseAuth } from '../services/supabaseAuth';
import { supabaseUrl, isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (tab === 'signup' && !fullName) {
      setError('Please enter your full name for your student profile.');
      return;
    }

    setLoading(true);

    try {
      if (tab === 'signup') {
        const { user, error: signUpErr } = await supabaseAuth.signUp(email, password, fullName);
        if (signUpErr) {
          setError(signUpErr);
        } else if (user) {
          setSuccessMessage('Account created successfully! Session initialized.');
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 1200);
        }
      } else {
        const { user, error: signInErr } = await supabaseAuth.signIn(email, password);
        if (signInErr) {
          setError(signInErr);
        } else if (user) {
          setSuccessMessage('Signed in successfully! Loading your verified skills and roadmap...');
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'alex' | 'jordan') => {
    if (role === 'alex') {
      setEmail('alex.chen@student.university.edu');
      setPassword('SkillGraph2026!Demo');
      setFullName('Alex Chen');
    } else {
      setEmail('jordan.taylor@student.university.edu');
      setPassword('SkillGraph2026!Demo');
      setFullName('Jordan Taylor');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              SG
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Supabase Authentication
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white">
            {tab === 'signin' ? 'Sign in to SkillGraph' : 'Create Student Account'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Access your evidence-supported skills, assessments, and prerequisite roadmap.
          </p>

          {/* Cloud Instance Info */}
          <div className="mt-3 flex items-center gap-2 text-[11px] bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700 font-mono text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              Target: {supabaseUrl ? new URL(supabaseUrl).host : 'fktcdhtlwjfsypujkqkj.supabase.co'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setTab('signin');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${
              tab === 'signin'
                ? 'bg-white text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${
              tab === 'signup'
                ? 'bg-white text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Success</p>
                <p className="mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required={tab === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Must be at least 6 characters. Protected by Supabase Auth RS256/JWT.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Contacting Supabase Auth...</span>
                </>
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In' : 'Create Student Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Test Credentials
              </span>
              <span className="text-[11px] text-slate-400">1-click populate</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('alex')}
                className="py-1.5 px-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-left truncate transition-colors"
              >
                Alex Chen (Junior)
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('jordan')}
                className="py-1.5 px-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-left truncate transition-colors"
              >
                Jordan Taylor (Sophomore)
              </button>
            </div>
          </div>
        </div>

        {/* Security & RLS notice footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Row-Level Security (RLS) Enforced</span>
          </div>
          <span>PostgreSQL auth.uid()</span>
        </div>
      </div>
    </div>
  );
};
