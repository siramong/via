import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isSupabaseConfigured = () => {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !supabaseUrl.includes('placeholder')
  );
};

export const ensureUserProfile = async (session: Session): Promise<UserProfile> => {
  if (!isSupabaseConfigured()) {
    return {
      id: session.user.id,
      auth_id: session.user.id,
      display_name: session.user.user_metadata?.full_name ?? 'Test User',
      reputation: 0,
      access_remaining: 3,
    };
  }

  const authId = session.user.id;
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
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
  if (!isSupabaseConfigured()) {
    return {
      id: authId,
      auth_id: authId,
      display_name: 'Test User',
      reputation: 0,
      access_remaining: 3,
    };
  }

  const { data, error } = await supabase.from('users').select('*').eq('auth_id', authId).single();
  if (error || !data) {
    throw error;
  }
  return data as UserProfile;
};
