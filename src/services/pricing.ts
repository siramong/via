import { supabase } from './supabase';
import type { Coordinates } from './location';
import type { FuelType, StationMarker, StationResult } from '../types';
import { stationRepository } from './stationRepository';

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
    priceDate: best.station.priceDate,
  };
};

export const getNearbyStations = async (coords: Coordinates): Promise<StationMarker[]> => {
  return stationRepository.getNearbyStations(coords);
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
