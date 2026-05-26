import { create } from 'zustand';
import { requestLocation, type Coordinates } from '../services/location';

type LocationState = {
  coords: Coordinates | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
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
}));
