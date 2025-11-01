import './setupStoreTests';
import { renderHook, act } from '@testing-library/react-native';
import { useShowsStore } from '../showsStore';

describe('showsStore', () => {
  // Helper function to create mock UserShow data
  const createMockUserShow = (overrides = {}) => ({
    id: '1',
    user_id: 'user1',
    show_id: 123,
    status: 'watching' as const,
    current_season: 1,
    current_episode: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  });

  // Helper function to create mock Show data (for TMDB API)
  const createMockShow = (overrides = {}) => ({
    id: 123,
    title: 'Test Show',
    overview: 'A test show',
    first_air_date: '2023-01-01',
    vote_average: 8.5,
    poster_path: '/test-poster.jpg',
    backdrop_path: '/test-backdrop.jpg',
    genre_ids: [18, 35],
    tmdb_id: 123,
    ...overrides,
  });

  // Helper to reset store state
  const resetStore = () => {
    act(() => {
      useShowsStore.setState({
        userShows: [],
        searchResults: [],
        isLoading: false,
        isSearching: false,
        searchQuery: '',
        error: null,
      });
    });
  };

  beforeEach(() => {
    resetStore();
    
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useShowsStore());
    
    expect(result.current.userShows).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('adds a show correctly', async () => {
    const { result } = renderHook(() => useShowsStore());
    const mockShow = createMockShow();

    // Mock database responses
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.cacheShow.mockResolvedValue(undefined);
    mockLocalDB.getShow.mockResolvedValue({ ...mockShow, id: 1 });
    mockLocalDB.addUserShow.mockResolvedValue({
      id: '1',
      user_id: 'user1',
      show_id: 1,
      status: 'want_to_watch',
      current_season: 1,
      current_episode: 1,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    });
    mockLocalDB.getUserShows.mockResolvedValue([{
      id: '1',
      user_id: 'user1',
      show_id: 1,
      status: 'want_to_watch',
      current_season: 1,
      current_episode: 1,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      show: { ...mockShow, id: 1 }
    }]);

    await act(async () => {
      await result.current.addShow('user1', mockShow);
    });

    expect(result.current.userShows).toHaveLength(1);
    expect(result.current.userShows[0].show_id).toBe(1);
  });

  it('updates a show status correctly', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up initial state with a show
    const initialShow = createMockUserShow({ id: '1', show_id: 123, status: 'want_to_watch' });
    act(() => {
      result.current.setUserShows([initialShow]);
    });

    // Mock database response
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.updateUserShowStatus.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.updateShowStatus('user1', 123, 'watching');
    });

    expect(result.current.userShows[0].status).toBe('watching');
    expect(mockLocalDB.updateUserShowStatus).toHaveBeenCalledWith('user1', 123, 'watching');
  });

  it('removes a show correctly', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up initial state with shows
    const shows = [
      createMockUserShow({ id: '1', show_id: 123 }),
      createMockUserShow({ id: '2', show_id: 456 }),
    ];
    act(() => {
      result.current.setUserShows(shows);
    });

    // Mock database response
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.deleteUserShow.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.removeShow('user1', 123);
    });

    expect(result.current.userShows).toHaveLength(1);
    expect(result.current.userShows[0].show_id).toBe(456);
    expect(mockLocalDB.deleteUserShow).toHaveBeenCalledWith('user1', 123);
  });

  it('sets user shows correctly', () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockShows = [
      createMockUserShow({ id: '1', show_id: 123 }),
      createMockUserShow({ id: '2', show_id: 456, status: 'completed' as const }),
    ];

    act(() => {
      result.current.setUserShows(mockShows);
    });

    expect(result.current.userShows).toEqual(mockShows);
  });

  it('sets loading state correctly', () => {
    const { result } = renderHook(() => useShowsStore());
    
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets error state correctly', () => {
    const { result } = renderHook(() => useShowsStore());
    
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.setError('Failed to load shows');
    });

    expect(result.current.error).toBe('Failed to load shows');

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });

  it('handles updating non-existent show', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up initial state with different show
    const initialShow = createMockUserShow({ id: '1', show_id: 456, status: 'watching' });
    act(() => {
      result.current.setUserShows([initialShow]);
    });

    // Mock database response
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.updateUserShowStatus.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.updateShowStatus('user1', 999, 'completed'); // Non-existent show
    });

    // Show shouldn't be affected since ID 999 doesn't exist
    expect(result.current.userShows[0].status).toBe('watching');
    expect(result.current.userShows[0].show_id).toBe(456);
    expect(mockLocalDB.updateUserShowStatus).toHaveBeenCalledWith('user1', 999, 'completed');
  });

  it('handles removing non-existent show', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up initial state with shows
    const shows = [
      createMockUserShow({ id: '1', show_id: 123 }),
      createMockUserShow({ id: '2', show_id: 456 }),
    ];
    act(() => {
      result.current.setUserShows(shows);
    });

    // Mock database response
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.deleteUserShow.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.removeShow('user1', 999); // Non-existent show
    });

    // Shows should remain unchanged
    expect(result.current.userShows).toHaveLength(2);
    expect(result.current.userShows[0].show_id).toBe(123);
    expect(result.current.userShows[1].show_id).toBe(456);
    expect(mockLocalDB.deleteUserShow).toHaveBeenCalledWith('user1', 999);
  });

  it('handles database errors when adding show', async () => {
    const { result } = renderHook(() => useShowsStore());
    const mockShow = createMockShow();

    // Mock database to throw error
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.cacheShow.mockRejectedValue(new Error('Database error'));

    await act(async () => {
      try {
        await result.current.addShow('user1', mockShow);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to add show');
    expect(result.current.userShows).toHaveLength(0);
  });

  it('handles database errors when updating status', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up initial state
    const initialShow = createMockUserShow({ id: '1', show_id: 123, status: 'want_to_watch' });
    act(() => {
      result.current.setUserShows([initialShow]);
    });

    // Mock database to throw error
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.updateUserShowStatus.mockRejectedValue(new Error('Database error'));

    await act(async () => {
      await result.current.updateShowStatus('user1', 123, 'watching');
    });

    expect(result.current.error).toBe('Failed to update show status');
    // State should remain unchanged on error
    expect(result.current.userShows[0].status).toBe('want_to_watch');
  });

  it('handles database errors when removing show', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up initial state
    const shows = [createMockUserShow({ id: '1', show_id: 123 })];
    act(() => {
      result.current.setUserShows(shows);
    });

    // Mock database to throw error
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.deleteUserShow.mockRejectedValue(new Error('Database error'));

    await act(async () => {
      try {
        await result.current.removeShow('user1', 123);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to remove show');
    // State should remain unchanged on error
    expect(result.current.userShows).toHaveLength(1);
  });

  it('updates show progress correctly', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up initial state
    const initialShow = createMockUserShow({ 
      id: '1', 
      show_id: 123, 
      current_season: 1, 
      current_episode: 5 
    });
    act(() => {
      result.current.setUserShows([initialShow]);
    });

    // Mock database response
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.updateUserShowProgress.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.updateShowProgress('user1', 123, 2, 3);
    });

    expect(result.current.userShows[0].current_season).toBe(2);
    expect(result.current.userShows[0].current_episode).toBe(3);
    expect(mockLocalDB.updateUserShowProgress).toHaveBeenCalledWith('user1', 123, 2, 3);
  });

  it('handles database errors when updating progress', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up initial state
    const initialShow = createMockUserShow({ 
      id: '1', 
      show_id: 123, 
      current_season: 1, 
      current_episode: 5 
    });
    act(() => {
      result.current.setUserShows([initialShow]);
    });

    // Mock database to throw error
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.updateUserShowProgress.mockRejectedValue(new Error('Database error'));

    await act(async () => {
      await result.current.updateShowProgress('user1', 123, 2, 3);
    });

    expect(result.current.error).toBe('Failed to update progress');
    // State should remain unchanged on error
    expect(result.current.userShows[0].current_season).toBe(1);
    expect(result.current.userShows[0].current_episode).toBe(5);
  });

  it('loads user shows correctly', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockUserShows = [
      {
        id: '1',
        user_id: 'user1',
        show_id: 123,
        status: 'watching' as const,
        current_season: 1,
        current_episode: 5,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        show: createMockShow({ id: 123 })
      },
      {
        id: '2',
        user_id: 'user1',
        show_id: 456,
        status: 'completed' as const,
        current_season: 3,
        current_episode: 10,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        show: createMockShow({ id: 456, title: 'Another Show' })
      }
    ];

    // Mock database response
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.getUserShows.mockResolvedValue(mockUserShows);

    await act(async () => {
      await result.current.loadUserShows('user1');
    });

    expect(result.current.userShows).toEqual(mockUserShows);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockLocalDB.getUserShows).toHaveBeenCalledWith('user1');
  });

  it('handles database errors when loading user shows', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Mock database to throw error
    const mockLocalDB = require('../../services/database').localDB;
    mockLocalDB.getUserShows.mockRejectedValue(new Error('Database error'));

    await act(async () => {
      await result.current.loadUserShows('user1');
    });

    expect(result.current.error).toBe('Failed to load shows');
    expect(result.current.userShows).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('searches shows correctly with results from cache and TMDB', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockCachedShows = [createMockShow({ id: 1, title: 'Cached Show' })];
    const mockTMDBResults = {
      results: [
        createMockShow({ id: 2, title: 'New Show 1' }),
        createMockShow({ id: 3, title: 'New Show 2' })
      ]
    };

    // Mock services
    const mockLocalDB = require('../../services/database').localDB;
    const mockTmdbService = require('../../services/tmdb').tmdbService;
    
    mockLocalDB.searchCachedShows.mockResolvedValue(mockCachedShows);
    mockLocalDB.cacheShow.mockResolvedValue(undefined);
    mockTmdbService.searchShows.mockResolvedValue(mockTMDBResults);

    await act(async () => {
      await result.current.searchShows('test query');
    });

    expect(result.current.searchResults).toEqual(mockTMDBResults.results);
    expect(result.current.searchQuery).toBe('test query');
    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Verify both cache and TMDB were called
    expect(mockLocalDB.searchCachedShows).toHaveBeenCalledWith('test query');
    expect(mockTmdbService.searchShows).toHaveBeenCalledWith('test query');
    
    // Verify new results were cached
    expect(mockLocalDB.cacheShow).toHaveBeenCalledTimes(2);
  });

  it('searches shows with empty query clears results', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up some initial search results
    act(() => {
      useShowsStore.setState({
        searchResults: [createMockShow()],
        searchQuery: 'previous query'
      });
    });

    await act(async () => {
      await result.current.searchShows('');
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchQuery).toBe('');
  });

  it('searches shows falls back to cache when TMDB fails', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockCachedShows = [createMockShow({ id: 1, title: 'Cached Show' })];

    // Mock services
    const mockLocalDB = require('../../services/database').localDB;
    const mockTmdbService = require('../../services/tmdb').tmdbService;
    
    mockLocalDB.searchCachedShows.mockResolvedValue(mockCachedShows);
    mockTmdbService.searchShows.mockRejectedValue(new Error('TMDB error'));

    await act(async () => {
      await result.current.searchShows('test query');
    });

    expect(result.current.searchResults).toEqual(mockCachedShows);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBeNull(); // Should not set error when fallback works
  });

  it('searches shows handles both TMDB and cache failures', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Mock services to fail
    const mockLocalDB = require('../../services/database').localDB;
    const mockTmdbService = require('../../services/tmdb').tmdbService;
    
    // Both calls to searchCachedShows fail
    mockLocalDB.searchCachedShows.mockRejectedValue(new Error('Cache error'));
    mockTmdbService.searchShows.mockRejectedValue(new Error('TMDB error'));

    await act(async () => {
      await result.current.searchShows('test query');
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBe('Search failed');
  });

  it('clears search results and state', () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Set up search state
    act(() => {
      useShowsStore.setState({
        searchResults: [createMockShow(), createMockShow()],
        searchQuery: 'test query',
        isSearching: true
      });
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  it('refreshes show data correctly', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    const updatedShowData = createMockShow({ id: 123, title: 'Updated Show Title', vote_average: 9.0 });
    
    // Set up initial state with a show in user's list
    const initialShow = {
      id: '1',
      user_id: 'user1',
      show_id: 123,
      status: 'watching' as const,
      current_season: 1,
      current_episode: 5,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      show: createMockShow({ id: 123, title: 'Old Title' })
    };
    act(() => {
      result.current.setUserShows([initialShow]);
    });

    // Mock services
    const mockLocalDB = require('../../services/database').localDB;
    const mockTmdbService = require('../../services/tmdb').tmdbService;
    
    mockTmdbService.getShowDetails.mockResolvedValue(updatedShowData);
    mockLocalDB.cacheShow.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.refreshShowData(123);
    });

    expect(result.current.userShows[0].show).toEqual(updatedShowData);
    expect(result.current.error).toBeNull();
    
    // Verify services were called
    expect(mockTmdbService.getShowDetails).toHaveBeenCalledWith(123);
    expect(mockLocalDB.cacheShow).toHaveBeenCalledWith(updatedShowData);
  });

  it('handles errors when refreshing show data', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    // Mock service to fail
    const mockTmdbService = require('../../services/tmdb').tmdbService;
    mockTmdbService.getShowDetails.mockRejectedValue(new Error('TMDB error'));

    await act(async () => {
      await result.current.refreshShowData(123);
    });

    expect(result.current.error).toBe('Failed to refresh data');
  });

  it('refreshes show data for non-existent show in user list', async () => {
    const { result } = renderHook(() => useShowsStore());
    
    const updatedShowData = createMockShow({ id: 999, title: 'New Show' });
    
    // Set up initial state with different shows
    const initialShows = [
      {
        id: '1',
        user_id: 'user1',
        show_id: 123,
        status: 'watching' as const,
        current_season: 1,
        current_episode: 5,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        show: createMockShow({ id: 123 })
      }
    ];
    act(() => {
      result.current.setUserShows(initialShows);
    });

    // Mock services
    const mockLocalDB = require('../../services/database').localDB;
    const mockTmdbService = require('../../services/tmdb').tmdbService;
    
    mockTmdbService.getShowDetails.mockResolvedValue(updatedShowData);
    mockLocalDB.cacheShow.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.refreshShowData(999); // Show not in user's list
    });

    // User shows should remain unchanged since the refreshed show isn't in the list
    expect(result.current.userShows).toEqual(initialShows);
    expect(result.current.error).toBeNull();
    
    // But the data should still be cached
    expect(mockLocalDB.cacheShow).toHaveBeenCalledWith(updatedShowData);
  });
});

describe('showsStore episode progression', () => {
  const userId = 'user1';
  const showId = 9999;
  const baseShow = {
    id: showId,
    tmdb_id: showId,
    title: 'Episode Progression Show',
    overview: '',
    first_air_date: '2024-01-01',
    vote_average: 0,
    poster_path: '',
    backdrop_path: '',
    genre_ids: [] as number[],
  };

  let watchedEpisodes: any[];
  let mockDB: any;

  beforeEach(() => {
    watchedEpisodes = [];
    act(() => {
      useShowsStore.setState({
        userShows: [{
          id: 'us1',
          user_id: userId,
          show_id: showId,
          status: 'watching',
          current_season: 1,
          current_episode: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          show: baseShow,
        } as any],
      });
    });
    mockDB = require('../../services/database').localDB;
    mockDB.markEpisodeWatched.mockResolvedValue(undefined);
    mockDB.getWatchedEpisodes.mockImplementation(async () => watchedEpisodes.slice().sort((a,b)=> a.episode_number - b.episode_number));
    mockDB.updateUserShowDerivedFields.mockResolvedValue(undefined);
    mockDB.updateUserShowProgress.mockResolvedValue(undefined);
    jest.clearAllMocks();
  });

  const runMark = async (result: any, ep: number) => {
    watchedEpisodes.push({ season_number: 1, episode_number: ep, watched_at: new Date(Date.now() + ep * 1000).toISOString() });
    await act(async () => {
      await result.current.markEpisodeWatched(userId, showId, 1, ep, new Date());
    });
  };

  it('advances pointer contiguously when watching episodes in order', async () => {
    const { result } = renderHook(() => useShowsStore());
    await runMark(result, 1);
    await runMark(result, 2);
    await runMark(result, 3);
    const us = result.current.userShows.find(s => s.show_id === showId)!;
    expect(us.current_episode).toBe(3);
    expect(mockDB.updateUserShowProgress).toHaveBeenCalledTimes(2);
  });

  it('does not advance pointer past a gap (watched 1 then 3)', async () => {
    const { result } = renderHook(() => useShowsStore());
    await runMark(result, 1);
    await runMark(result, 3);
    const us = result.current.userShows.find(s => s.show_id === showId)!;
    expect(us.current_episode).toBe(1);
    expect(mockDB.updateUserShowProgress).toHaveBeenCalledTimes(0);
  });

  it('fills gap later and advances pointer (watch 1,3 then 2)', async () => {
    const { result } = renderHook(() => useShowsStore());
    await runMark(result, 1);
    await runMark(result, 3);
    await runMark(result, 2);
    const us = result.current.userShows.find(s => s.show_id === showId)!;
    expect(us.current_episode).toBe(3);
    expect(mockDB.updateUserShowProgress).toHaveBeenCalledTimes(1);
  });

  it('updates derived fields watched_count and last_watched_at', async () => {
    const { result } = renderHook(() => useShowsStore());
    await runMark(result, 1);
    await runMark(result, 2);
    const us = result.current.userShows.find(s => s.show_id === showId)!;
    expect(us.watched_count).toBe(2);
    expect(us.last_watched_at).toBeDefined();
    expect(mockDB.updateUserShowDerivedFields).toHaveBeenCalledTimes(2);
  });
});
