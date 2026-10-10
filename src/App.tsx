import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { SkillsEvidenceView } from './components/SkillsEvidenceView';
import { ResumeReviewView } from './components/ResumeReviewView';
import { GapAnalysisView } from './components/GapAnalysisView';
import { SkillGraphView } from './components/SkillGraphView';
import { AssessmentTakingView } from './components/AssessmentTakingView';
import { RoadmapView } from './components/RoadmapView';
import { QualityGatesView } from './components/QualityGatesView';
import { FacultyDemoView } from './components/FacultyDemoView';
import { SettingsExportView } from './components/SettingsExportView';
import { DocumentationView } from './components/DocumentationView';
import { storage } from './services/storageService';
import { supabaseAuth, AuthState } from './services/supabaseAuth';
import { isSupabaseConfigured } from './lib/supabase';

import { LoginView } from './components/auth/LoginView';
import { SignupView } from './components/auth/SignupView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { OtpVerificationView } from './components/auth/OtpVerificationView';
import { OnboardingView } from './components/auth/OnboardingView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [, setRenderTrigger] = useState(0);

  const [authState, setAuthState] = useState<AuthState>(supabaseAuth.getAuthState());
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname);
  const [pendingPhone, setPendingPhone] = useState('');

  // Handle browser popstate / navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setRenderTrigger((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Subscribe to Supabase Auth changes
  useEffect(() => {
    const unsubscribe = supabaseAuth.subscribe((state) => {
      setAuthState(state);
      if (state.user && (currentRoute === '/login' || currentRoute === '/signup' || currentRoute === '/forgot-password' || currentRoute === '/otp')) {
        window.history.pushState({}, '', '/');
        setCurrentRoute('/');
      }
    });
    return unsubscribe;
  }, [currentRoute]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
  };

  const currentUser = storage.getCurrentUser();
  const mySkills = storage.getMySkills();
  const myProjects = storage.getMyProjects();
  const myEvidence = storage.getMyEvidence();
  const latestAnalysis = storage.getLatestAnalysis();
  const activeRoadmap = storage.getActiveRoadmap();

  // Route: Signup
  if (currentRoute === '/signup') {
    return (
      <SignupView
        onSwitchToLogin={() => navigateTo('/login')}
        onOtpRequested={(phone) => {
          setPendingPhone(phone);
          navigateTo('/otp');
        }}
      />
    );
  }

  // Route: Forgot Password
  if (currentRoute === '/forgot-password') {
    return (
      <ForgotPasswordView
        onBackToLogin={() => navigateTo('/login')}
      />
    );
  }

  // Route: OTP Verification
  if (currentRoute === '/otp') {
    return (
      <OtpVerificationView
        phoneNumber={pendingPhone}
        onBack={() => navigateTo('/login')}
      />
    );
  }

  // Route: Login (or unauthenticated default when visiting root without session)
  if (currentRoute === '/login' || (isSupabaseConfigured && !authState.user && currentRoute !== '/')) {
    return (
      <LoginView
        onSwitchToSignup={() => navigateTo('/signup')}
        onForgotPassword={() => navigateTo('/forgot-password')}
        onOtpRequested={(phone) => {
          setPendingPhone(phone);
          navigateTo('/otp');
        }}
      />
    );
  }

  // If Supabase is configured and user is NOT authenticated on root, show Landing / Login CTA
  if (isSupabaseConfigured && !authState.user) {
    return (
      <LoginView
        onSwitchToSignup={() => navigateTo('/signup')}
        onForgotPassword={() => navigateTo('/forgot-password')}
        onOtpRequested={(phone) => {
          setPendingPhone(phone);
          navigateTo('/otp');
        }}
      />
    );
  }

  // If authenticated but user needs onboarding profile setup
  if (isSupabaseConfigured && authState.user && currentUser && !currentUser.onboarding_completed) {
    return (
      <OnboardingView
        user={authState.user}
        onCompleted={() => {
          navigateTo('/');
          setRenderTrigger((p) => p + 1);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onNavigateRoute={navigateTo}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && (
          <OverviewView
            currentUser={currentUser}
            analysis={latestAnalysis}
            roadmap={activeRoadmap}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'skills' && (
          <SkillsEvidenceView
            skills={mySkills}
            projects={myProjects}
            evidenceItems={myEvidence}
          />
        )}

        {currentTab === 'resume' && (
          <ResumeReviewView onNavigate={setCurrentTab} />
        )}

        {currentTab === 'gap-analysis' && (
          <GapAnalysisView
            analysis={latestAnalysis}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'graph' && (
          <SkillGraphView
            analysis={latestAnalysis}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'assessments' && (
          <AssessmentTakingView onNavigate={setCurrentTab} />
        )}

        {currentTab === 'roadmap' && (
          <RoadmapView
            roadmap={activeRoadmap}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'quality-gates' && (
          <QualityGatesView />
        )}

        {currentTab === 'faculty-demo' && (
          <FacultyDemoView onNavigate={setCurrentTab} />
        )}

        {currentTab === 'docs' && (
          <DocumentationView />
        )}

        {currentTab === 'settings' && (
          <SettingsExportView />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SkillGraph AI</span>
            <span>·</span>
            <span>From Skills to Careers (Data Analyst MVP)</span>
            <span>·</span>
            <span className="font-mono text-[11px]">v1.0-deterministic</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button onClick={() => setCurrentTab('faculty-demo')} className="hover:text-slate-900 transition-colors">
              Faculty Walkthrough
            </button>
            <button onClick={() => setCurrentTab('quality-gates')} className="hover:text-slate-900 transition-colors">
              Quality Gates
            </button>
            <button onClick={() => setCurrentTab('docs')} className="hover:text-slate-900 transition-colors">
              Documentation
            </button>
            <button onClick={() => setCurrentTab('settings')} className="hover:text-slate-900 transition-colors">
              GDPR Export & Deletion
            </button>
            {isSupabaseConfigured && authState.user && (
              <button
                onClick={() => supabaseAuth.signOut()}
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
