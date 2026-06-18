import { create } from 'zustand';
import { getFavoriteIds, addFavorite, removeFavorite } from '../services/favorites';

type FavoritesState = {
  ids: string[];
  loaded: boolean;
  load: (userId: string) => Promise<void>;
  toggle: (userId: string, stationId: string) => Promise<void>;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  loaded: false,
  load: async (userId: string) => {
    try {
      const ids = await getFavoriteIds(userId);
      set({ ids, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  toggle: async (userId: string, stationId: string) => {
    const { ids } = get();
    const isFav = ids.includes(stationId);
    if (isFav) {
      await removeFavorite(userId, stationId);
      set({ ids: ids.filter((id) => id !== stationId) });
    } else {
      await addFavorite(userId, stationId);
      set({ ids: [...ids, stationId] });
    }
  },
}));
