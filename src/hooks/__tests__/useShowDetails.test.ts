import { renderHook, act } from '@testing-library/react-native';
import { useShowDetails } from '../useShowDetails';
import { tmdbService } from '../../services/tmdb';

jest.mock('../../services/tmdb', () => ({
  tmdbService: {
    getShowDetails: jest.fn(),
    getTotalEpisodeCount: jest.fn(),
  },
}));

describe('useShowDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads show details and counts', async () => {
    (tmdbService.getShowDetails as jest.Mock).mockResolvedValue({ id: 1, tmdb_id: 1, title: 'X', overview: '', first_air_date: '', vote_average: 0, genre_ids: [] });
    (tmdbService.getTotalEpisodeCount as jest.Mock).mockResolvedValue({ totalEpisodes: 10, seasonCount: 2 });

    const { result } = renderHook(() => useShowDetails(1));

    // allow effect to run
    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.show?.title).toBe('X');
    expect(result.current.totalEpisodes).toBe(10);
    expect(result.current.seasonCount).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    (tmdbService.getShowDetails as jest.Mock).mockRejectedValue(new Error('fail'));
    (tmdbService.getTotalEpisodeCount as jest.Mock).mockResolvedValue({ totalEpisodes: 0, seasonCount: 0 });

    const { result } = renderHook(() => useShowDetails(1));

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.show).toBeNull();
    expect(result.current.error).toBe('Failed to load show details');
  });
});
