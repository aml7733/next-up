import { renderHook, act } from '@testing-library/react-native';
import { useShowsStore } from '../showsStore';

// Reset the store before each test
const initialState = useShowsStore.getState();

describe('showsStore', () => {
  beforeEach(() => {
    useShowsStore.setState(initialState, true);
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useShowsStore());
    
    expect(result.current.userShows).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('adds a show correctly', () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockShow = {
      id: '1',
      user_id: 'user1',
      show_id: 123,
      status: 'watching' as const,
      current_season: 1,
      current_episode: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    act(() => {
      result.current.addShow(mockShow);
    });

    expect(result.current.userShows).toHaveLength(1);
    expect(result.current.userShows[0]).toEqual(mockShow);
  });

  it('updates a show correctly', () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockShow = {
      id: '1',
      user_id: 'user1',
      show_id: 123,
      status: 'watching' as const,
      current_season: 1,
      current_episode: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    act(() => {
      result.current.addShow(mockShow);
    });

    act(() => {
      result.current.updateShow('1', {
        current_season: 2,
        current_episode: 5,
        status: 'completed',
      });
    });

    const updatedShow = result.current.userShows[0];
    expect(updatedShow.current_season).toBe(2);
    expect(updatedShow.current_episode).toBe(5);
    expect(updatedShow.status).toBe('completed');
    expect(updatedShow.id).toBe('1'); // Other properties should remain
  });

  it('removes a show correctly', () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockShow1 = {
      id: '1',
      user_id: 'user1',
      show_id: 123,
      status: 'watching' as const,
      current_season: 1,
      current_episode: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const mockShow2 = {
      id: '2',
      user_id: 'user1',
      show_id: 456,
      status: 'completed' as const,
      current_season: 1,
      current_episode: 10,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    act(() => {
      result.current.addShow(mockShow1);
      result.current.addShow(mockShow2);
    });

    expect(result.current.userShows).toHaveLength(2);

    act(() => {
      result.current.removeShow('1');
    });

    expect(result.current.userShows).toHaveLength(1);
    expect(result.current.userShows[0].id).toBe('2');
  });

  it('sets user shows correctly', () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockShows = [
      {
        id: '1',
        user_id: 'user1',
        show_id: 123,
        status: 'watching' as const,
        current_season: 1,
        current_episode: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: '2',
        user_id: 'user1',
        show_id: 456,
        status: 'completed' as const,
        current_season: 1,
        current_episode: 10,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
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

  it('handles updating non-existent show', () => {
    const { result } = renderHook(() => useShowsStore());
    
    act(() => {
      result.current.updateShow('non-existent', { status: 'completed' });
    });

    // Should not crash and shows array should remain empty
    expect(result.current.userShows).toEqual([]);
  });

  it('handles removing non-existent show', () => {
    const { result } = renderHook(() => useShowsStore());
    
    const mockShow = {
      id: '1',
      user_id: 'user1',
      show_id: 123,
      status: 'watching' as const,
      current_season: 1,
      current_episode: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    act(() => {
      result.current.addShow(mockShow);
    });

    act(() => {
      result.current.removeShow('non-existent');
    });

    // Original show should still be there
    expect(result.current.userShows).toHaveLength(1);
    expect(result.current.userShows[0].id).toBe('1');
  });
});
