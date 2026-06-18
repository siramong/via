import { create } from 'zustand';
import { requestLocation, startWatchingLocation, stopWatchingLocation, type Coordinates } from '../services/location';
import { stationRepository } from '../services/stationRepository';

type LocationState = {
  coords: Coordinates | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  status: 'idle',
  error: null,

  refresh: async () => {
    set({ status: 'loading', error: null });
    try {
      const coords = await requestLocation();
      set({ coords, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: (error as Error).message });
    }
  },

  startWatching: async () => {
    set({ status: 'loading', error: null });
    try {
      const initial = await requestLocation();
      set({ coords: initial, status: 'ready' });
      await startWatchingLocation((coords) => {
        stationRepository.invalidateNearbyCache();
        set({ coords, status: 'ready' });
      });
    } catch (error) {
      set({ status: 'error', error: (error as Error).message });
    }
  },

  stopWatching: () => {
    stopWatchingLocation();
  },
}));
