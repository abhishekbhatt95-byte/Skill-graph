import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, supabaseConfigError } from '../lib/supabase';
import { UserProfile } from '../types/canonical';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthListener = (state: AuthState) => void;

class SupabaseAuthService {
  private user: User | null = null;
  private session: Session | null = null;
  private isLoading = true;
  private error: string | null = null;
  private listeners: AuthListener[] = [];

  constructor() {
    this.initSession();
  }

  private async initSession() {
    if (!isSupabaseConfigured) {
      this.isLoading = false;
      this.error = supabaseConfigError;
      this.notify();
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Supabase getSession error:', error.message);
        this.error = error.message;
      } else {
        this.session = data.session;
        this.user = data.session?.user || null;
      }
    } catch (err: any) {
      console.warn('Supabase session initialization failed:', err);
      this.error = err.message || 'Session initialization error';
    } finally {
      this.isLoading = false;
      this.notify();
    }

    // Subscribe to auth state updates
    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      this.session = session;
      this.user = session?.user || null;
      this.isLoading = false;
      this.error = null;
      this.notify();
    });
  }

  public getAuthState(): AuthState {
    return {
      user: this.user,
      session: this.session,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  public isAuthenticated(): boolean {
    return !!this.user;
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    listener(this.getAuthState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = this.getAuthState();
    for (const l of this.listeners) {
      try {
        l(state);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    }
  }

  /**
   * Sign up with Email and Password
   */
  public async signUp(email: string, password: string, fullName: string): Promise<{ user: User | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { user: null, error: 'Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.' };
    }

    try {
      this.isLoading = true;
      this.notify();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        this.isLoading = false;
        this.error = error.message;
        this.notify();
        return { user: null, error: error.message };
      }

      this.user = data.user;
      this.session = data.session;
      this.isLoading = false;
      this.error = null;
      this.notify();

      // Ensure profile row exists in public.profiles table
      if (data.user) {
        await this.syncProfileRecord(data.user, fullName);
      }

      return { user: data.user, error: null };
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.message || 'Registration failed';
      this.notify();
      return { user: null, error: this.error };
    }
  }

  /**
   * Sign in with Email and Password
   */
  public async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { user: null, error: 'Supabase is not configured.' };
    }

    try {
      this.isLoading = true;
      this.notify();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        this.isLoading = false;
        this.error = error.message;
        this.notify();
        return { user: null, error: error.message };
      }

      this.user = data.user;
      this.session = data.session;
      this.isLoading = false;
      this.error = null;
      this.notify();

      return { user: data.user, error: null };
    } catch (err: any) {
      this.isLoading = false;
      this.error = err.message || 'Authentication failed';
      this.notify();
      return { user: null, error: this.error };
    }
  }

  /**
   * Sign out current user
   */
  public async signOut(): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured) {
      this.user = null;
      this.session = null;
      this.notify();
      return { error: null };
    }

    try {
      this.isLoading = true;
      this.notify();

      const { error } = await supabase.auth.signOut();
      this.user = null;
      this.session = null;
      this.isLoading = false;
      this.error = error ? error.message : null;
      this.notify();
      return { error: error ? error.message : null };
    } catch (err: any) {
      this.user = null;
      this.session = null;
      this.isLoading = false;
      this.error = err.message || 'Sign out failed';
      this.notify();
      return { error: this.error };
    }
  }

  /**
   * Continue with Google OAuth
   */
  public async signInWithGoogle(): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase is not configured.' };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err.message || 'Google OAuth failed' };
    }
  }

  /**
   * Sign in / Sign up with Phone Number (SMS OTP)
   */
  public async signInWithPhone(phoneNumber: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase is not configured.' };
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber.trim(),
      });
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err.message || 'Phone OTP request failed' };
    }
  }

  /**
   * Verify Phone OTP Token
   */
  public async verifyPhoneOtp(phoneNumber: string, token: string): Promise<{ user: User | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { user: null, error: 'Supabase is not configured.' };
    }
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber.trim(),
        token: token.trim(),
        type: 'sms',
      });
      if (error) {
        return { user: null, error: error.message };
      }
      this.user = data.user;
      this.session = data.session;
      this.notify();
      if (data.user) {
        await this.syncProfileRecord(data.user);
      }
      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'OTP verification failed' };
    }
  }

  /**
   * Reset Password for Email
   */
  public async resetPasswordForEmail(email: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase is not configured.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}`,
      });
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err.message || 'Password reset request failed' };
    }
  }

  /**
   * Ensures public.profiles row exists for user
   */
  public async syncProfileRecord(user: User, fallbackName?: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const name = user.user_metadata?.full_name || fallbackName || user.email?.split('@')[0] || 'Student';
      const now = new Date().toISOString();

      const profilePayload = {
        user_id: user.id,
        email: user.email || '',
        full_name: name,
        role_target_id: 'role-da-jr-v1',
        weekly_study_hours: 10,
        onboarding_completed: true,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.warn('Profile sync notice (table may need migrations):', error.message);
        return {
          id: user.id,
          user_id: user.id,
          email: user.email || '',
          full_name: name,
          role_target_id: 'role-da-jr-v1',
          role_target_name: 'Junior Data Analyst v1.0',
          weekly_study_hours: 10,
          onboarding_completed: true,
          created_at: now,
          updated_at: now,
        };
      }

      return {
        id: data.id || data.user_id,
        user_id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role_target_id: data.role_target_id || 'role-da-jr-v1',
        role_target_name: 'Junior Data Analyst v1.0',
        weekly_study_hours: data.weekly_study_hours || 10,
        onboarding_completed: data.onboarding_completed ?? true,
        created_at: data.created_at || now,
        updated_at: data.updated_at || now,
      };
    } catch (e) {
      console.warn('Profile sync exception:', e);
      return null;
    }
  }
}

export const supabaseAuth = new SupabaseAuthService();
