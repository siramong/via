import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';
import { ensureUserProfile, refreshUserProfile, supabase, isSupabaseConfigured } from '../services/supabase';
import { consumeAccess as consumeAccessRpc, grantAccess as grantAccessRpc } from '../services/pricing';

WebBrowser.maybeCompleteAuthSession();

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
};

const buildRedirectUrl = () => {
  // For web: redirect back to current origin
  // For native: use custom scheme
  if (typeof window !== 'undefined') {
    return `${window.location.origin}`;
  }
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

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        set({ status: 'error', error: error.message });
      } else {
        set({ session: data.session, status: 'ready' });
        if (data.session) {
          const profile = await ensureUserProfile(data.session);
          set({ profile });
        }
      }

      const { data: authData } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        set({ session: nextSession });
        if (nextSession) {
          const profile = await ensureUserProfile(nextSession);
          set({ profile });
        } else {
          set({ profile: null });
        }
      });

      return () => {
        authData.subscription.unsubscribe();
      };
    } catch (err) {
      set({ status: 'error', error: (err as Error).message });
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
      set({ status: 'error', error: error?.message ?? 'Unable to start Google sign-in.' });
      return;
    }

    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        // Parse the redirect URL - Supabase returns token in hash fragment
        const urlObject = new URL(result.url);
        const hashParams = new URLSearchParams(urlObject.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          // Create a session from the access token
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (sessionError || !sessionData.session) {
            set({ status: 'error', error: sessionError?.message ?? 'Failed to establish session' });
          } else {
            set({ session: sessionData.session, status: 'ready' });
            const profile = await ensureUserProfile(sessionData.session);
            set({ profile });
          }
        } else {
          // Fallback: try to get session from Supabase (onAuthStateChange might have handled it)
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            set({ session: sessionData.session, status: 'ready' });
            const profile = await ensureUserProfile(sessionData.session);
            set({ profile });
          } else {
            set({ status: 'error', error: 'No session found in redirect' });
          }
        }
      } else if (result.type === 'dismiss') {
        set({ status: 'error', error: 'Sign-in cancelled' });
      }
    } catch (err) {
      set({ status: 'error', error: (err as Error).message });
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
}));
