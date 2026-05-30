import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { FuelType, UserProfile, UserReport } from '../types';

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
      preferred_fuel: null,
      created_at: session.user.created_at,
    };
  }

  const authId = session.user.id;
  const displayName = session.user.user_metadata?.full_name ?? session.user.email ?? 'VIA User';

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle();

  if (existing) return existing as UserProfile;

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert({
      auth_id: authId,
      display_name: displayName,
      reputation: 0,
      access_remaining: 3,
    })
    .select('*')
    .single();

  if (insertError?.code === '23505') {
    const { data: retry } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single();
    if (retry) return retry as UserProfile;
  }

  if (insertError || !inserted) throw insertError ?? new Error('Failed to create profile');

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
        preferred_fuel: null,
        created_at: new Date().toISOString(),
      };
  }

  const { data, error } = await supabase.from('users').select('*').eq('auth_id', authId).single();
  if (error || !data) {
    throw error;
  }
  return data as UserProfile;
};

export const updateProfileName = async (profileId: string, displayName: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('users').update({ display_name: displayName }).eq('id', profileId);
  if (error) throw error;
};

export const updatePreferredFuel = async (profileId: string, fuelType: FuelType | null): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('users').update({ preferred_fuel: fuelType }).eq('id', profileId);
  if (error) throw error;
};

export const getUserReports = async (profileId: string, limit = 10): Promise<UserReport[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('reports')
    .select('id, station_id, station:stations(name), ocr_json, status, created_at')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    station_name: r.station?.name ?? null,
    prices: r.ocr_json ?? {},
    status: r.status,
    created_at: r.created_at,
  }));
};
