export type FuelType = 'regular' | 'premium' | 'diesel';

export type FuelPriceInput = Partial<Record<FuelType, number>>;

export type Freshness = 'fresh' | 'recent' | 'stale';

export type StationResult = {
  stationId: string;
  name: string;
  fuelType: FuelType;
  price: number;
  distanceMeters: number;
  trustScore: number;
  freshness: Freshness;
};

export type StationMarker = {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  price?: number;
  fuelType?: FuelType;
  freshness?: Freshness;
  trustScore?: number;
};

export type UserProfile = {
  id: string;
  auth_id: string;
  display_name: string | null;
  reputation: number;
  access_remaining: number;
  created_at: string;
};

export type UserReport = {
  id: string;
  station_name: string | null;
  prices: FuelPriceInput;
  status: string;
  created_at: string;
};
