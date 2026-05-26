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

      // First, try to get existing session
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('[Auth] getSession error:', error.message);
        set({ status: 'error', error: error.message });
      } else {
        if (data.session) {
          console.log('[Auth] Existing session found');
          set({ session: data.session, status: 'ready' });
          const profile = await ensureUserProfile(data.session);
          set({ profile });
        } else {
          console.log('[Auth] No existing session');
          set({ status: 'ready' });
        }
      }

      // Set up listener for auth state changes
      const { data: authData } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        console.log('[Auth] State changed:', event, !!nextSession);
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
      console.error('[Auth] Bootstrap error:', errorMsg);
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
    console.log('[OAuth] Starting Google sign-in with redirectTo:', redirectTo);
    
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
      console.error('[OAuth] signInWithOAuth failed:', errorMsg);
      set({ status: 'error', error: errorMsg });
      return;
    }

    console.log('[OAuth] Opening auth session...');
    
    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log('[OAuth] WebBrowser result type:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('[OAuth] Got success with URL');
        // Parse the redirect URL - Supabase returns token in hash fragment
        const urlObject = new URL(result.url);
        const hashParams = new URLSearchParams(urlObject.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          console.log('[OAuth] Found access token in hash');
          // Create a session from the access token
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (sessionError || !sessionData.session) {
            const errorMsg = sessionError?.message ?? 'Failed to establish session';
            console.error('[OAuth] setSession failed:', errorMsg);
            set({ status: 'error', error: errorMsg });
          } else {
            console.log('[OAuth] Session established successfully');
            set({ session: sessionData.session, status: 'ready' });
            const profile = await ensureUserProfile(sessionData.session);
            set({ profile });
          }
        } else {
          console.log('[OAuth] No token in hash, checking getSession...');
          // Fallback: try to get session from Supabase (onAuthStateChange might have handled it)
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('[OAuth] Session found via getSession');
            set({ session: sessionData.session, status: 'ready' });
            const profile = await ensureUserProfile(sessionData.session);
            set({ profile });
          } else {
            console.warn('[OAuth] No session found in redirect');
            set({ status: 'error', error: 'No session found in redirect' });
          }
        }
      } else if (result.type === 'dismiss') {
        console.log('[OAuth] User dismissed auth');
        set({ status: 'error', error: 'Sign-in cancelled' });
      } else {
        console.log('[OAuth] Auth session closed, waiting for state change...');
        // On web, after WebBrowser closes, check if Supabase already processed the auth
        // Wait a moment for onAuthStateChange to fire
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log('[OAuth] Session found after waiting');
          set({ session: sessionData.session, status: 'ready' });
          const profile = await ensureUserProfile(sessionData.session);
          set({ profile });
        } else {
          console.warn('[OAuth] No session after auth flow');
          set({ status: 'error', error: 'Authentication failed or was cancelled' });
        }
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      console.error('[OAuth] Exception:', errorMsg);
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
}));
