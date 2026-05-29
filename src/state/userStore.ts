import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import type { FuelType, UserProfile } from '../types';
import { ensureUserProfile, refreshUserProfile, supabase, isSupabaseConfigured } from '../services/supabase';
import { consumeAccess as consumeAccessRpc, grantAccess as grantAccessRpc } from '../services/pricing';

type UserState = {
  session: Session | null;
  profile: UserProfile | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null | undefined;
  bootstrap: () => Promise<() => void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  refreshProfile: () => Promise<void>;
  consumeAccess: () => Promise<void>;
  grantAccess: (delta: number, reason: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updatePreferredFuel: (fuelType: FuelType | null) => Promise<void>;
};

const buildRedirectUrl = () => {
  // For mobile: use custom scheme (works in native builds)
  // For Expo Go: WebBrowser will handle the session persistence via localStorage
  const scheme = 'via';
  return `${scheme}://auth`;
};

// Mock session for testing without Supabase
const mockSession: Session = {
  user: {
    id: 'test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@via.local',
    email_confirmed_at: new Date().toISOString(),
    phone: undefined,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {
      full_name: 'Test User',
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh',
  expires_at: Date.now() + 3600000,
};

const mockProfile: UserProfile = {
  id: 'test-user-id',
  auth_id: 'test-user-id',
  display_name: 'Test User',
  reputation: 42,
  access_remaining: 3,
  preferred_fuel: null,
  created_at: new Date().toISOString(),
};

export const useUserStore = create<UserState>((set, get) => ({
  session: null,
  profile: null,
  status: 'idle',
  error: null,
  setSession: (session) => set({ session }),
  bootstrap: async () => {
    set({ status: 'loading', error: null });

    try {
      if (!isSupabaseConfigured()) {
        // Use mock session for development without Supabase
        set({ session: mockSession, profile: mockProfile, status: 'ready' });
        return () => {};
      }

      // First, try to get existing session
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        set({ status: 'error', error: error.message });
      } else {
        if (data.session) {
          set({ session: data.session, status: 'ready' });
          const profile = await ensureUserProfile(data.session);
          set({ profile });
        } else {
          set({ status: 'ready' });
        }
      }

      // Set up listener for auth state changes
      const { data: authData } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        set({ session: nextSession });
        if (nextSession) {
          const profile = await ensureUserProfile(nextSession);
          set({ profile, status: 'ready' });
        } else {
          set({ profile: null });
        }
      });

      return () => {
        authData.subscription.unsubscribe();
      };
    } catch (err) {
      const errorMsg = (err as Error).message;
      set({ status: 'error', error: errorMsg });
      return () => {};
    }
  },
  signInWithGoogle: async () => {
    if (!isSupabaseConfigured()) {
      set({ session: mockSession, profile: mockProfile, status: 'ready' });
      return;
    }

    set({ status: 'loading', error: null });
    const redirectTo = buildRedirectUrl();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data?.url) {
      const errorMsg = error?.message ?? 'Unable to start Google sign-in.';
      set({ status: 'error', error: errorMsg });
      return;
    }
    
    try {
      // In Expo Go, deep links don't work, so we can't get the URL back from WebBrowser
      // Instead, we rely on onAuthStateChange to detect the session after auth completes
      await WebBrowser.openBrowserAsync(data.url);
      
      // After browser closes, wait for onAuthStateChange to pick up the session
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if session was established
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        set({ session: sessionData.session, status: 'ready' });
        const profile = await ensureUserProfile(sessionData.session);
        set({ profile });
      } else {
        set({ status: 'error', error: 'No session found. Try again.' });
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      set({ status: 'error', error: errorMsg });
    }
  },
  signOut: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    set({ session: null, profile: null });
  },
  refreshProfile: async () => {
    const session = get().session;
    if (!session) return;
    if (isSupabaseConfigured()) {
      const profile = await refreshUserProfile(session.user.id);
      set({ profile });
    }
  },
  consumeAccess: async () => {
    const session = get().session;
    if (!session) return;
    if (isSupabaseConfigured()) {
      const remaining = await consumeAccessRpc(session.user.id);
      const profile = get().profile;
      if (profile) {
        set({ profile: { ...profile, access_remaining: remaining } });
      }
    } else {
      const profile = get().profile;
      if (profile && profile.access_remaining > 0) {
        set({ profile: { ...profile, access_remaining: profile.access_remaining - 1 } });
      }
    }
  },
  grantAccess: async (delta: number, reason: string) => {
    const session = get().session;
    if (!session) return;
    if (isSupabaseConfigured()) {
      const remaining = await grantAccessRpc(session.user.id, delta, reason);
      const profile = get().profile;
      if (profile) {
        set({ profile: { ...profile, access_remaining: remaining } });
      }
    } else {
      const profile = get().profile;
      if (profile) {
        set({ profile: { ...profile, access_remaining: profile.access_remaining + delta } });
      }
    }
  },
  updateDisplayName: async (name: string) => {
    const { profile, session } = get();
    if (!profile || !session) return;
    if (isSupabaseConfigured()) {
      const { updateProfileName } = await import('../services/supabase');
      await updateProfileName(profile.id, name);
    }
    set({ profile: { ...profile, display_name: name } });
  },
  updatePreferredFuel: async (fuelType: FuelType | null) => {
    const { profile, session } = get();
    if (!profile || !session) return;
    if (isSupabaseConfigured()) {
      const { updatePreferredFuel } = await import('../services/supabase');
      await updatePreferredFuel(profile.id, fuelType);
    }
    set({ profile: { ...profile, preferred_fuel: fuelType } });
  },
}));
