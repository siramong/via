import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';
import { ensureUserProfile, refreshUserProfile, supabase } from '../services/supabase';
import { consumeAccess as consumeAccessRpc, grantAccess as grantAccessRpc } from '../services/pricing';

WebBrowser.maybeCompleteAuthSession();

type UserState = {
  session: Session | null;
  profile: UserProfile | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  bootstrap: () => Promise<() => void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  refreshProfile: () => Promise<void>;
  consumeAccess: () => Promise<void>;
  grantAccess: (delta: number, reason: string) => Promise<void>;
};

const buildRedirectUrl = () => {
  const scheme = 'via';
  return `${scheme}://auth`;
};

export const useUserStore = create<UserState>((set, get) => ({
  session: null,
  profile: null,
  status: 'idle',
  error: null,
  setSession: (session) => set({ session }),
  bootstrap: async () => {
    set({ status: 'loading', error: null });
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
  },
  signInWithGoogle: async () => {
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
        const urlParams = new URL(result.url).searchParams;
        const code = urlParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            set({ status: 'error', error: exchangeError.message });
          }
        }
      }
    } catch (err) {
      set({ status: 'error', error: (err as Error).message });
    }

    set({ status: 'ready' });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
  refreshProfile: async () => {
    const session = get().session;
    if (!session) return;
    const profile = await refreshUserProfile(session.user.id);
    set({ profile });
  },
  consumeAccess: async () => {
    const session = get().session;
    if (!session) return;
    const remaining = await consumeAccessRpc(session.user.id);
    const profile = get().profile;
    if (profile) {
      set({ profile: { ...profile, access_remaining: remaining } });
    }
  },
  grantAccess: async (delta: number, reason: string) => {
    const session = get().session;
    if (!session) return;
    const remaining = await grantAccessRpc(session.user.id, delta, reason);
    const profile = get().profile;
    if (profile) {
      set({ profile: { ...profile, access_remaining: remaining } });
    }
  },
}));
