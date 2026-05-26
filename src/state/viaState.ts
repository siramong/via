import { GasStation, FuelType } from "../types";

export type ViaAction =
  | { type: "consume-access" }
  | {
      type: "submit-contribution";
      payload: { stationId: string; fuelType: FuelType; price: number; confidence: number };
    }
  | { type: "validate-contribution" };

export interface ViaState {
  accessRemaining: number;
  degradedAccessHits: number;
  reputation: number;
  contributions: number;
  validations: number;
  stations: GasStation[];
  lastSubmissionAt: string | null;
}

export function viaReducer(state: ViaState, action: ViaAction): ViaState {
  switch (action.type) {
    case "consume-access":
      if (state.accessRemaining > 0) {
        return { ...state, accessRemaining: state.accessRemaining - 1 };
      }
      return { ...state, degradedAccessHits: state.degradedAccessHits + 1 };
    case "submit-contribution":
      return {
        ...state,
        contributions: state.contributions + 1,
        reputation: Math.min(100, state.reputation + Math.round(action.payload.confidence / 10)),
        accessRemaining: state.accessRemaining + 1,
        lastSubmissionAt: new Date().toISOString(),
        stations: state.stations.map((station) => {
          if (station.id !== action.payload.stationId) return station;
          return {
            ...station,
            trustScore: Math.min(100, station.trustScore + 3),
            trustBand: station.trustScore + 3 >= 80 ? "fresh" : station.trustBand,
            fuelPrices: station.fuelPrices.map((fuel) =>
              fuel.fuelType === action.payload.fuelType
                ? {
                    ...fuel,
                    price: action.payload.price,
                    updatedAt: new Date().toISOString(),
                    sourceScore: action.payload.confidence
                  }
                : fuel
            )
          };
        })
      };
    case "validate-contribution":
      return {
        ...state,
        validations: state.validations + 1,
        reputation: Math.min(100, state.reputation + 1)
      };
    default:
      return state;
  }
}

export function selectBestStation(stations: GasStation[], fuelType: FuelType = "regular") {
  return [...stations]
    .map((station) => {
      const fuel = station.fuelPrices.find((item) => item.fuelType === fuelType) ?? station.fuelPrices[0];
      const freshnessPenalty = station.trustBand === "fresh" ? 0 : station.trustBand === "recent" ? 0.03 : 0.08;
      const trustBonus = station.trustScore / 1000;
      const score = fuel.price + station.distanceKm * 0.015 + freshnessPenalty - trustBonus;
      return { station, fuel, score };
    })
    .sort((a, b) => a.score - b.score)[0];
}
