import { create } from 'zustand';
import { UserShow } from '../types';

interface ShowsState {
  userShows: UserShow[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addShow: (show: UserShow) => void;
  updateShow: (id: string, updates: Partial<UserShow>) => void;
  removeShow: (id: string) => void;
  setUserShows: (shows: UserShow[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useShowsStore = create<ShowsState>((set) => ({
  userShows: [],
  isLoading: false,
  error: null,
  
  addShow: (show) => 
    set((state) => ({ 
      userShows: [...state.userShows, show] 
    })),
    
  updateShow: (id, updates) =>
    set((state) => ({
      userShows: state.userShows.map((show) =>
        show.id === id ? { ...show, ...updates } : show
      ),
    })),
    
  removeShow: (id) =>
    set((state) => ({
      userShows: state.userShows.filter((show) => show.id !== id),
    })),
    
  setUserShows: (shows) => set({ userShows: shows }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
