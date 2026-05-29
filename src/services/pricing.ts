import { supabase } from './supabase';
import type { Coordinates } from './location';
import type { Freshness, FuelType, RealtimeStation, StationMarker, StationResult } from '../types';

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

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const OVERPASS_RADIUS = 10000;
const MAX_RESULTS = 15;
const REQUEST_TIMEOUT = 8000;

const haversineDistance = (a: Coordinates, b: { latitude: number; longitude: number }): number => {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
};

export const findNearbyRealStations = async (coords: Coordinates): Promise<RealtimeStation[]> => {
  const errors: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const query = `[out:json];node(around:${OVERPASS_RADIUS},${coords.latitude},${coords.longitude})[amenity=fuel];out body 50;`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ViaApp/1.0',
        },
      });
      clearTimeout(timer);

      if (!response.ok) {
        const msg = `Overpass ${endpoint} returned ${response.status}`;
        console.warn(`[Overpass] ${msg}`);
        errors.push(msg);
        continue;
      }

      const text = await response.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        const msg = `Overpass ${endpoint} returned invalid JSON`;
        console.warn(`[Overpass] ${msg}`);
        errors.push(msg);
        continue;
      }

      const elements = json.elements;
      if (!Array.isArray(elements) || elements.length === 0) continue;

      const withDist: { el: any; dist: number }[] = [];
      for (const el of elements) {
        if (el.lat == null || el.lon == null) continue;
        withDist.push({
          el,
          dist: haversineDistance(coords, { latitude: el.lat, longitude: el.lon }),
        });
      }

      if (withDist.length === 0) continue;

      withDist.sort((a, b) => a.dist - b.dist);
      return withDist.slice(0, MAX_RESULTS).map(({ el }) => ({
        placeId: `osm_${el.id}`,
        name: el.tags?.name || el.tags?.brand || 'Gas Station',
        latitude: el.lat,
        longitude: el.lon,
        address: el.tags?.['addr:street']
          ? [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ')
          : '',
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Overpass] ${endpoint} error: ${msg}`);
      errors.push(`${endpoint}: ${msg}`);
    }
  }

  const debugInfo = `Tried ${OVERPASS_ENDPOINTS.length} endpoint(s) at ${OVERPASS_RADIUS / 1000}km radius.\nErrors:\n${errors.join('\n')}`;
  console.warn(`[Overpass] All endpoints failed.\n${debugInfo}`);
  throw new Error(`No stations found. ${debugInfo}`);
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

export const getBestStation = async (coords: Coordinates, preferredFuel?: FuelType | null): Promise<StationResult | null> => {
  const stations = await getNearbyStations(coords);
  let withPrices = stations.filter((s) => s.price != null);

  if (preferredFuel) {
    withPrices = withPrices.filter((s) => s.fuelType === preferredFuel);
  }

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
    latitude: best.station.latitude,
    longitude: best.station.longitude,
    fuelType: best.station.fuelType ?? 'ecopais',
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
