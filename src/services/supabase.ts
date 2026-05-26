import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const ensureUserProfile = async (session: Session): Promise<UserProfile> => {
  const authId = session.user.id;
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing as UserProfile;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert({
      auth_id: authId,
      display_name: session.user.user_metadata?.full_name ?? session.user.email ?? 'VIA User',
      reputation: 0,
      access_remaining: 3,
    })
    .select('*')
    .single();

  if (insertError || !inserted) {
    throw insertError;
  }

  return inserted as UserProfile;
};

export const refreshUserProfile = async (authId: string): Promise<UserProfile> => {
  const { data, error } = await supabase.from('users').select('*').eq('auth_id', authId).single();
  if (error || !data) {
    throw error;
  }
  return data as UserProfile;
};
