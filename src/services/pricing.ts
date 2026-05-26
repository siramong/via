import { supabase } from './supabase';
import type { Coordinates } from './location';
import type { Freshness, StationMarker, StationResult } from '../types';

export const classifyFreshness = (createdAt: string): Freshness => {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  if (ageHours < 24) return 'fresh';
  if (ageHours < 72) return 'recent';
  return 'stale';
};

export const recencyBonus = (createdAt: string): number => {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  if (ageHours < 24) return 5;
  if (ageHours < 72) return 2;
  return 0;
};

export const computeTrustScore = (weightSum: number, freshness: Freshness): number => {
  const freshnessBoost = freshness === 'fresh' ? 15 : freshness === 'recent' ? 6 : 0;
  return Math.min(100, Math.max(10, Math.round(weightSum * 4 + freshnessBoost)));
};

export const getCheapestStation = async (coords: Coordinates): Promise<StationResult | null> => {
  const { data, error } = await supabase.rpc('get_cheapest_station', {
    user_lat: coords.latitude,
    user_lng: coords.longitude,
  });

  if (error) {
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    return null;
  }

  return {
    stationId: result.station_id,
    name: result.station_name,
    fuelType: result.fuel_type,
    price: Number(result.price),
    distanceMeters: Number(result.distance_meters),
    trustScore: Number(result.trust_score),
    freshness: result.freshness,
  };
};

export const getNearbyStations = async (coords: Coordinates): Promise<StationMarker[]> => {
  const { data, error } = await supabase.rpc('get_nearby_stations', {
    user_lat: coords.latitude,
    user_lng: coords.longitude,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map((station: any) => ({
    stationId: station.station_id,
    name: station.station_name,
    latitude: Number(station.latitude),
    longitude: Number(station.longitude),
    distanceMeters: Number(station.distance_meters),
  }));
};

export const consumeAccess = async (authId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('consume_access', { user_auth_id: authId });
  if (error) {
    throw error;
  }
  return Number(data);
};

export const grantAccess = async (authId: string, delta: number, reason: string): Promise<number> => {
  const { data, error } = await supabase.rpc('grant_access', {
    user_auth_id: authId,
    access_delta: delta,
    access_reason: reason,
  });
  if (error) {
    throw error;
  }
  return Number(data);
};
