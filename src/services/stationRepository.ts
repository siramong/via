import { supabase } from './supabase';
import type { Coordinates } from './location';
import type { StationMarker } from '../types';

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;

class StationRepository {
  private nearbyCache = new Map<string, CacheEntry<StationMarker[]>>();
  private ttl: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttl = ttlMs;
  }

  private cacheKey(lat: number, lng: number, radius?: number): string {
    const r = radius ?? 10000;
    const round = (v: number) => Math.round(v * 100) / 100;
    return `${round(lat)},${round(lng)},${r}`;
  }

  private isFresh<T>(entry: CacheEntry<T> | undefined): boolean {
    return !!entry && Date.now() < entry.expiresAt;
  }

  async getNearbyStations(
    coords: Coordinates,
    radiusMeters = 10000,
    limitCount = 50,
  ): Promise<StationMarker[]> {
    const key = this.cacheKey(coords.latitude, coords.longitude, radiusMeters);
    const cached = this.nearbyCache.get(key);
    if (this.isFresh(cached)) {
      return cached!.data;
    }

    const { data, error } = await supabase.rpc('get_nearby_stations', {
      user_lat: coords.latitude,
      user_lng: coords.longitude,
      radius_meters: radiusMeters,
      limit_count: limitCount,
    });

    if (error) {
      throw error;
    }

    const markers: StationMarker[] = (data ?? []).map((station: any) => ({
      stationId: station.station_id,
      name: station.station_name,
      latitude: Number(station.latitude),
      longitude: Number(station.longitude),
      distanceMeters: Number(station.distance_meters),
      price: station.price ? Number(station.price) : undefined,
      fuelType: station.fuel_type ?? undefined,
      freshness: station.freshness ?? undefined,
      priceDate: station.price_date ?? undefined,
      trustScore: station.trust_score ? Number(station.trust_score) : undefined,
      brand: station.brand ?? undefined,
      city: station.city ?? undefined,
      province: station.province ?? undefined,
    }));

    this.nearbyCache.set(key, { data: markers, expiresAt: Date.now() + this.ttl });
    return markers;
  }

  invalidateNearbyCache(): void {
    this.nearbyCache.clear();
  }
}

export const stationRepository = new StationRepository();
