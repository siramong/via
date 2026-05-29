export type FuelType = 'ecopais' | 'super' | 'diesel';

export type FuelPriceInput = Partial<Record<FuelType, number>>;

export type Freshness = 'fresh' | 'recent' | 'stale';

export type StationResult = {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
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

export type RealtimeStation = {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
};

export type UserProfile = {
  id: string;
  auth_id: string;
  display_name: string | null;
  reputation: number;
  access_remaining: number;
  preferred_fuel: FuelType | null;
  created_at: string;
};

export type UserReport = {
  id: string;
  station_name: string | null;
  prices: FuelPriceInput;
  status: string;
  created_at: string;
};
