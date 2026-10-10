import React, { useState, useEffect } from 'react';
import {
  Compass,
  FileText,
  GitBranch,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  GraduationCap,
  Download,
  BookOpen,
  User,
  LogIn,
  LogOut,
  Database,
} from 'lucide-react';
import { storage } from '../services/storageService';
import { supabaseAuth, AuthState } from '../services/supabaseAuth';
import { isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types/canonical';
import { AuthModal } from './AuthModal';

export type NavTab =
  | 'overview'
  | 'skills'
  | 'resume'
  | 'gap-analysis'
  | 'graph'
  | 'assessments'
  | 'roadmap'
  | 'quality-gates'
  | 'faculty-demo'
  | 'docs'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, currentUser }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(supabaseAuth.getAuthState());
  const allUsers = storage.getAllUsers();
  const syncStatus = storage.getSyncStatus();

  useEffect(() => {
    const unsub = supabaseAuth.subscribe((state) => {
      setAuthState(state);
    });
    return unsub;
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    storage.switchUser(e.target.value);
  };

  const handleSignOut = async () => {
    await supabaseAuth.signOut();
  };

  const navLinks: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Compass className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills & Evidence', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'resume', label: 'Resume Review', icon: <FileText className="w-4 h-4" /> },
    { id: 'gap-analysis', label: 'Gap Analysis', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'graph', label: 'Skill Graph', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'assessments', label: 'Assessments', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <MapPin className="w-4 h-4" /> },
    { id: 'quality-gates', label: 'Quality Gates', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'faculty-demo', label: 'Faculty Demo', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'docs', label: 'Docs', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      {/* Top Bar Contract: Zone 1 (Brand) - Zone 2 (Nav Links) - Zone 3 (Action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('overview')}
              className="text-left group flex items-center gap-2 focus:outline-none"
            >
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight">
                SG
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                  SkillGraph AI
                </span>
                <span className="text-[11px] text-slate-500 font-normal block leading-tight">
                  From Skills to Careers
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (single line, clean typography) */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action & User Isolation Switcher */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Supabase Cloud Connection / Sandbox Status */}
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  authState.user
                    ? 'bg-emerald-500 animate-pulse'
                    : isSupabaseConfigured
                    ? 'bg-blue-500'
                    : 'bg-amber-400'
                }`}
              />
              <span className="truncate max-w-[120px]">
                {authState.user
                  ? 'Supabase Auth'
                  : isSupabaseConfigured
                  ? 'Supabase Ready'
                  : 'Sandbox Demo'}
              </span>
            </div>

            {/* If Supabase authenticated: display user chip & logout; else display tenant switcher & Sign In */}
            {authState.user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-md text-xs font-medium">
                  <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="max-w-[120px] truncate">
                    {authState.user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out of Supabase"
                  className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Sandbox User Tenant Switcher for Testing Isolation */}
                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={currentUser.user_id}
                    onChange={handleUserChange}
                    aria-label="Active student profile"
                    className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer pr-1 text-xs"
                  >
                    {allUsers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.full_name} ({u.email.split('@')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            <button
              onClick={() => onSelectTab('settings')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'settings'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Responsive Mobile / Tablet secondary nav bar */}
        <div className="xl:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};
