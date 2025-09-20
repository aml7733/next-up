import { renderHook, act } from '@testing-library/react-native';
import { useEpisodeProgress } from '../useEpisodeProgress';
import { episodeService } from '../../services/episodeService';

jest.mock('../../services/episodeService', () => ({
  episodeService: {
    ensureSeasonCached: jest.fn().mockResolvedValue(undefined),
    getNextEpisode: jest.fn().mockResolvedValue(null),
  },
}));

describe('useEpisodeProgress', () => {
  beforeEach(() => jest.clearAllMocks());

  it('computes watchedCount from derived field when present and fetches next episode', async () => {
    (episodeService.getNextEpisode as jest.Mock).mockResolvedValue({ id: 2, season_number: 1, episode_number: 2, name: 'E2', overview: '', air_date: '' });

    const userShow = { current_season: 1, current_episode: 2, watched_count: 5 } as any;
    const { result } = renderHook(() => useEpisodeProgress(1, userShow));

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.watchedCount).toBe(5);
    expect(result.current.nextEpisode?.episode_number).toBe(2);
  });

  it('falls back to current_episode-1 for watchedCount when derived missing', async () => {
    const userShow = { current_season: 1, current_episode: 3 } as any;
    const { result } = renderHook(() => useEpisodeProgress(1, userShow));

    await act(async () => {});

    expect(result.current.watchedCount).toBe(2);
  });
});
