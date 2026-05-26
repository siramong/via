export type FuelType = "regular" | "extra" | "diesel";

export type TrustBand = "fresh" | "recent" | "old";

export interface FuelPrice {
  fuelType: FuelType;
  price: number;
  updatedAt: string;
  sourceScore: number;
}

export interface GasStation {
  id: string;
  name: string;
  brand: string;
  lat: number;
  lon: number;
  distanceKm: number;
  trustScore: number;
  trustBand: TrustBand;
  fuelPrices: FuelPrice[];
  address: string;
  notes: string;
}

export interface UserProfile {
  id: string;
  name: string;
  city: string;
  reputation: number;
  contributions: number;
  validations: number;
}

export interface ContributionDraft {
  stationId: string;
  fuelType: FuelType;
  price: number;
  confidence: number;
  ocrRetries: number;
}
