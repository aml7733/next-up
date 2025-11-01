import { create } from 'zustand';
import { Show, UserShow, WatchStatus } from '../types';
import { localDB } from '../services/database';
import { tmdbService } from '../services/tmdb';
import { logger } from '../utils/logger';

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
  markEpisodeWatched: (userId: string, showId: number, season: number, episode: number, watchedAt?: Date) => Promise<void>;
  reconcileProgress: (userId: string, showId: number) => Promise<void>;
  
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
      logger.errorExpected('Failed to load user shows:', error);
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
      
      // Add to user's shows using tmdb_id as the show identifier
      await localDB.addUserShow(userId, show.tmdb_id, status);
      
      // Reload user shows from database to ensure consistency
      const userShows = await localDB.getUserShows(userId);
      set({ userShows });
      
      logger.info('Show added successfully:', show.title);
    } catch (error) {
      logger.errorExpected('Failed to add show:', error);
      set({ error: 'Failed to add show' });
      throw error; // Re-throw so the UI can handle it
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
      logger.errorExpected('Failed to update show progress:', error);
      set({ error: 'Failed to update progress' });
    }
  },
  
  updateShowStatus: async (userId: string, showId: number, status: WatchStatus) => {
    try {
      await localDB.updateUserShowStatus(userId, showId, status);
      
      // Update local state
      const userShows = get().userShows.map(userShow => 
        userShow.show_id === showId 
          ? { ...userShow, status }
          : userShow
      );
      set({ userShows });
      
      logger.info('Show status updated successfully:', { showId, status });
    } catch (error) {
      logger.errorExpected('Failed to update show status:', error);
      set({ error: 'Failed to update show status' });
    }
  },
  
  removeShow: async (userId: string, showId: number) => {
    try {
      await localDB.deleteUserShow(userId, showId);
      
      // Remove from local state
      const userShows = get().userShows.filter(userShow => userShow.show_id !== showId);
      set({ userShows });
      
      logger.info('Show removed successfully:', { showId });
    } catch (error) {
      logger.errorExpected('Failed to remove show:', error);
      set({ error: 'Failed to remove show' });
      throw error; // Re-throw so the UI can handle it
    }
  },

  markEpisodeWatched: async (userId: string, showId: number, season: number, episode: number, watchedAt = new Date()) => {
    try {
      await localDB.markEpisodeWatched(userId, showId, season, episode, watchedAt);
      // Update derived fields after marking
      await get().reconcileProgress(userId, showId);
    } catch (error) {
      logger.errorExpected('Failed to mark episode watched:', error);
      set({ error: 'Failed to mark episode watched' });
    }
  },

  reconcileProgress: async (userId: string, showId: number) => {
    try {
      const watched = await localDB.getWatchedEpisodes(userId, showId);
      const watchedCount = watched.length;
      const lastWatchedAt = watched.length ? watched[watched.length - 1].watched_at : null;

      // Find existing user show
      const userShow = get().userShows.find(us => us.show_id === showId);
      if (!userShow) return; // Nothing to do

      // Compute contiguous pointer only if current pointer matches existing contiguous progression (avoid moving forward past gaps out-of-order)
      const pointer = localDB.computeContiguousPointer(watched, userShow.current_season, userShow.current_episode);

      // Update DB fields (watched_count, last_watched_at, pointer if advanced)
      await localDB.updateUserShowDerivedFields(userId, showId, watchedCount, lastWatchedAt);
      if (pointer.season !== userShow.current_season || pointer.episode !== userShow.current_episode) {
        await localDB.updateUserShowProgress(userId, showId, pointer.season, pointer.episode);
      }

      // Update local state
      const userShows = get().userShows.map(us =>
        us.show_id === showId
          ? { ...us, watched_count: watchedCount as any, last_watched_at: lastWatchedAt as any, current_season: pointer.season, current_episode: pointer.episode }
          : us
      );
      set({ userShows });
    } catch (error) {
      logger.errorExpected('Failed to reconcile progress:', error);
    }
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
      await Promise.all(tmdbResults.results.map(show => localDB.cacheShow(show)));
      
      set({ searchResults: tmdbResults.results });
    } catch (error) {
      logger.errorExpected('Search failed:', error);
      // Fall back to cached results if TMDB fails
      try {
        const cachedResults = await localDB.searchCachedShows(query);
        set({ searchResults: cachedResults });
      } catch (cacheError) {
        logger.errorExpected('Cache search also failed:', cacheError);
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
      logger.errorExpected('Failed to refresh show data:', error);
      set({ error: 'Failed to refresh data' });
    }
  },
  
  // Legacy actions for compatibility
  setUserShows: (shows) => set({ userShows: shows }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
