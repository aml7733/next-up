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
        isLoading: false,
        error: null,
      });
    });
  };

  beforeEach(() => {
    resetStore();
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

    await act(async () => {
      await result.current.addShow('user1', mockShow);
    });

    expect(result.current.userShows).toHaveLength(1);
    expect(result.current.userShows[0].show_id).toBe(1);
  });

  it.todo('updates a show status correctly - implementation pending');

  it.todo('removes a show correctly - implementation pending');

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

  it.todo('handles updating non-existent show - implementation pending');

  it.todo('handles removing non-existent show - implementation pending');
});
