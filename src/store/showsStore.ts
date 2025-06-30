import { create } from 'zustand';
import { Show, UserShow, WatchStatus } from '../types';
import { localDB } from '../services/database';
import { tmdbService } from '../services/tmdb';

interface ShowsState {
  userShows: UserShow[];
  searchResults: Show[];
  isLoading: boolean;
  isSearching: boolean;
  searchQuery: string;
  error: string | null;
  
  // Actions
  loadUserShows: (userId: string) => Promise<void>;
  addShow: (userId: string, show: Show, status?: WatchStatus) => Promise<void>;
  updateShowProgress: (userId: string, showId: number, season: number, episode: number) => Promise<void>;
  updateShowStatus: (userId: string, showId: number, status: WatchStatus) => Promise<void>;
  removeShow: (userId: string, showId: number) => Promise<void>;
  
  // Search actions
  searchShows: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // Cache management
  refreshShowData: (showId: number) => Promise<void>;
  
  // Legacy actions (for compatibility)
  setUserShows: (shows: UserShow[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useShowsStore = create<ShowsState>((set, get) => ({
  userShows: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,
  searchQuery: '',
  error: null,
  
  loadUserShows: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const userShows = await localDB.getUserShows(userId);
      set({ userShows });
    } catch (error) {
      console.error('Failed to load user shows:', error);
      set({ error: 'Failed to load shows' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  addShow: async (userId: string, show: Show, status: WatchStatus = 'want_to_watch') => {
    set({ isLoading: true, error: null });
    try {
      // First, cache the show in local database
      await localDB.cacheShow(show);
      
      // Get the cached show to get the local ID
      const cachedShow = await localDB.getShow(show.tmdb_id);
      if (!cachedShow) throw new Error('Failed to cache show');
      
      // Add to user's shows
      const userShow = await localDB.addUserShow(userId, cachedShow.id, status);
      
      // Update state
      const currentUserShows = get().userShows;
      set({ 
        userShows: [...currentUserShows, { ...userShow, show: cachedShow }] 
      });
    } catch (error) {
      console.error('Failed to add show:', error);
      set({ error: 'Failed to add show' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateShowProgress: async (userId: string, showId: number, season: number, episode: number) => {
    try {
      await localDB.updateUserShowProgress(userId, showId, season, episode);
      
      // Update local state
      const userShows = get().userShows.map(userShow => 
        userShow.show_id === showId 
          ? { ...userShow, current_season: season, current_episode: episode }
          : userShow
      );
      set({ userShows });
    } catch (error) {
      console.error('Failed to update show progress:', error);
      set({ error: 'Failed to update progress' });
    }
  },
  
  updateShowStatus: async (userId: string, showId: number, status: WatchStatus) => {
    // TODO: Implement updateUserShow method in database service
    console.log('TODO: Update show status:', { userId, showId, status });
    set({ error: 'Feature not implemented yet' });
  },
  
  removeShow: async (userId: string, showId: number) => {
    // TODO: Implement deleteUserShow method in database service
    console.log('TODO: Remove show:', { userId, showId });
    set({ error: 'Feature not implemented yet' });
  },
  
  searchShows: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }
    
    set({ isSearching: true, searchQuery: query, error: null });
    try {
      // First, search cached shows
      const cachedResults = await localDB.searchCachedShows(query);
      
      if (cachedResults.length > 0) {
        set({ searchResults: cachedResults });
      }
      
      // Then search TMDB for fresh results
      const tmdbResults = await tmdbService.searchShows(query);
      
      // Cache new results
      for (const show of tmdbResults.results) {
        await localDB.cacheShow(show);
      }
      
      set({ searchResults: tmdbResults.results });
    } catch (error) {
      console.error('Search failed:', error);
      // Fall back to cached results if TMDB fails
      try {
        const cachedResults = await localDB.searchCachedShows(query);
        set({ searchResults: cachedResults });
      } catch (cacheError) {
        console.error('Cache search also failed:', cacheError);
        set({ error: 'Search failed' });
      }
    } finally {
      set({ isSearching: false });
    }
  },
  
  clearSearch: () => {
    set({ searchResults: [], searchQuery: '', isSearching: false });
  },
  
  refreshShowData: async (showId: number) => {
    try {
      // Fetch fresh data from TMDB
      const showDetails = await tmdbService.getShowDetails(showId);
      
      // Update cache
      await localDB.cacheShow(showDetails);
      
      // Update state if this show is in user's list
      const userShows = get().userShows.map(userShow => 
        userShow.show?.tmdb_id === showId 
          ? { ...userShow, show: showDetails }
          : userShow
      );
      set({ userShows });
    } catch (error) {
      console.error('Failed to refresh show data:', error);
      set({ error: 'Failed to refresh data' });
    }
  },
  
  // Legacy actions for compatibility
  setUserShows: (shows) => set({ userShows: shows }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
