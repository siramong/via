import { supabase } from './supabase';

export const getFavoriteIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('favorites')
    .select('station_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((r) => r.station_id);
};

export const addFavorite = async (userId: string, stationId: string): Promise<void> => {
  const { error } = await supabase.from('favorites').insert({ user_id: userId, station_id: stationId });
  if (error && error.code !== '23505') throw error;
};

export const removeFavorite = async (userId: string, stationId: string): Promise<void> => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('station_id', stationId);
  if (error) throw error;
};
