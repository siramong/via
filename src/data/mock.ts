import { GasStation, UserProfile } from "../types";

export const mockUser: UserProfile = {
  id: "user-1",
  name: "Conductor VIA",
  city: "Cuenca",
  reputation: 64,
  contributions: 18,
  validations: 37
};

export const mockStations: GasStation[] = [
  {
    id: "st-1",
    name: "PetroCuenca Centro",
    brand: "Petr Ecuador",
    lat: -2.9005,
    lon: -79.0053,
    distanceKm: 0.8,
    trustScore: 88,
    trustBand: "fresh",
    address: "Av. Solano y Remigio Crespo",
    notes: "Dato reciente validado por comunidad.",
    fuelPrices: [
      { fuelType: "regular", price: 2.49, updatedAt: "2026-05-26T12:40:00Z", sourceScore: 92 },
      { fuelType: "extra", price: 2.77, updatedAt: "2026-05-26T12:40:00Z", sourceScore: 92 },
      { fuelType: "diesel", price: 1.89, updatedAt: "2026-05-26T12:40:00Z", sourceScore: 92 }
    ]
  },
  {
    id: "st-2",
    name: "Kia Gas Tomebamba",
    brand: "Terpel",
    lat: -2.9019,
    lon: -79.01,
    distanceKm: 1.4,
    trustScore: 73,
    trustBand: "recent",
    address: "Av. 12 de Abril",
    notes: "Precio competitivo con respaldo medio.",
    fuelPrices: [
      { fuelType: "regular", price: 2.45, updatedAt: "2026-05-25T18:20:00Z", sourceScore: 71 },
      { fuelType: "extra", price: 2.73, updatedAt: "2026-05-25T18:20:00Z", sourceScore: 71 },
      { fuelType: "diesel", price: 1.92, updatedAt: "2026-05-25T18:20:00Z", sourceScore: 71 }
    ]
  },
  {
    id: "st-3",
    name: "Mirador Fuel",
    brand: "Primax",
    lat: -2.9043,
    lon: -79.0154,
    distanceKm: 2.2,
    trustScore: 61,
    trustBand: "recent",
    address: "Sector Mirador de Turi",
    notes: "Aun con baja densidad de reportes.",
    fuelPrices: [
      { fuelType: "regular", price: 2.39, updatedAt: "2026-05-24T09:11:00Z", sourceScore: 59 },
      { fuelType: "extra", price: 2.68, updatedAt: "2026-05-24T09:11:00Z", sourceScore: 59 },
      { fuelType: "diesel", price: 1.95, updatedAt: "2026-05-24T09:11:00Z", sourceScore: 59 }
    ]
  },
  {
    id: "st-4",
    name: "Ruta Austral",
    brand: "Repsol",
    lat: -2.8899,
    lon: -79.0192,
    distanceKm: 3.4,
    trustScore: 41,
    trustBand: "old",
    address: "Autopista Cuenca - Azogues",
    notes: "Dato viejo, mostrar con cautela.",
    fuelPrices: [
      { fuelType: "regular", price: 2.53, updatedAt: "2026-05-22T07:05:00Z", sourceScore: 40 },
      { fuelType: "extra", price: 2.82, updatedAt: "2026-05-22T07:05:00Z", sourceScore: 40 },
      { fuelType: "diesel", price: 2.02, updatedAt: "2026-05-22T07:05:00Z", sourceScore: 40 }
    ]
  }
];
