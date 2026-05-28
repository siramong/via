import { supabase } from './supabase';
import type { Coordinates } from './location';
import type { Freshness, RealtimeStation, StationMarker, StationResult } from '../types';

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

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_RADIUS = 50000;

export const findNearbyRealStations = async (coords: Coordinates): Promise<RealtimeStation[]> => {
  const query = `[out:json];node(around:${OVERPASS_RADIUS},${coords.latitude},${coords.longitude})[amenity=fuel];out body 50;`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`, {
    signal: controller.signal,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ViaApp/1.0',
    },
  });
  clearTimeout(timer);

  if (!response.ok) throw new Error(`Overpass error: ${response.status}`);

  const json = await response.json();
  return (json.elements ?? []).map((el: any) => ({
    placeId: `osm_${el.id}`,
    name: el.tags?.name || el.tags?.brand || 'Gas Station',
    latitude: el.lat,
    longitude: el.lon,
    address: el.tags?.['addr:street']
      ? [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ')
      : '',
  }));
};

export const ensureStation = async (realStation: RealtimeStation): Promise<StationMarker> => {
  const { data, error } = await supabase.rpc('ensure_station', {
    p_place_id: realStation.placeId,
    p_name: realStation.name,
    p_latitude: realStation.latitude,
    p_longitude: realStation.longitude,
    p_address: realStation.address,
  });

  if (error || !data) throw error ?? new Error('Failed to ensure station');

  const row = Array.isArray(data) ? data[0] : data;
  return {
    stationId: row.id,
    name: row.name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    distanceMeters: 0,
  };
};

export const getBestStation = async (coords: Coordinates): Promise<StationResult | null> => {
  const stations = await getNearbyStations(coords);
  const withPrices = stations.filter((s) => s.price != null);
  if (withPrices.length === 0) return null;

  const maxPrice = Math.max(...withPrices.map((s) => s.price!));
  const maxDist = Math.max(...withPrices.map((s) => s.distanceMeters));

  const scored = withPrices.map((s) => ({
    station: s,
    score:
      0.6 * (maxPrice > 0 ? 1 - s.price! / maxPrice : 0.5) +
      0.4 * (maxDist > 0 ? 1 - s.distanceMeters / maxDist : 0.5),
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return {
    stationId: best.station.stationId,
    name: best.station.name,
    fuelType: best.station.fuelType ?? 'regular',
    price: best.station.price!,
    distanceMeters: best.station.distanceMeters,
    trustScore: best.station.trustScore ?? 50,
    freshness: best.station.freshness ?? 'stale',
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
    price: station.price ? Number(station.price) : undefined,
    fuelType: station.fuel_type ?? undefined,
    freshness: station.freshness ?? undefined,
    trustScore: station.trust_score ? Number(station.trust_score) : undefined,
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
