import { episodeService } from '../episodeService';
import { localDB } from '../database';
import { tmdbService } from '../tmdb';

jest.mock('../tmdb', () => ({
  tmdbService: {
    getSeasonEpisodes: jest.fn(),
    getNextEpisode: jest.fn(),
  }
}));

// Minimal in-memory prep (assuming database.init already called in global setup)

describe('episodeService', () => {
  const showId = 1001;
  // In-memory episode cache keyed by `${showId}_${season}` => Episode[]
  const memory: Record<string, any[]> = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    for (const k of Object.keys(memory)) delete memory[k];

    // Monkey-patch only needed localDB methods (store originals for potential future restore)
    (localDB as any).cacheSeasonEpisodes = async (sId: number, season: number, episodes: any[]) => {
      memory[`${sId}_${season}`] = episodes.map(e => ({ ...e }));
    };
    (localDB as any).getSeasonEpisodes = async (sId: number, season: number) => {
      return memory[`${sId}_${season}`] ? [...memory[`${sId}_${season}`]] : [];
    };
    (localDB as any).getNextEpisodeFromCache = async (sId: number, currentSeason: number, currentEpisode: number, skipUnaired: boolean) => {
      const list = memory[`${sId}_${currentSeason}`] || [];
      const next = list.find(ep => ep.episode_number === currentEpisode + 1);
      const now = new Date();
      const isAired = (ep: any) => !skipUnaired || !ep.air_date || new Date(ep.air_date) <= now;
      if (next && isAired(next)) return { ...next };
      const nextSeasonList = memory[`${sId}_${currentSeason + 1}`] || [];
      const firstNext = nextSeasonList.find(ep => ep.episode_number === 1 && isAired(ep));
      return firstNext ? { ...firstNext } : null;
    };
  });

  it('caches season episodes when missing', async () => {
    (tmdbService.getSeasonEpisodes as jest.Mock).mockResolvedValue([
      { id: 1, episode_number: 1, season_number: 1, name: 'Ep1', overview: '', air_date: '2024-01-01' },
      { id: 2, episode_number: 2, season_number: 1, name: 'Ep2', overview: '', air_date: '2024-01-02' }
    ]);

    let cached = await localDB.getSeasonEpisodes(showId, 1);
    expect(cached).toHaveLength(0);

    await episodeService.ensureSeasonCached(showId, 1);

    cached = await localDB.getSeasonEpisodes(showId, 1);
    expect(cached).toHaveLength(2);
  });

  it('returns next episode from cache', async () => {
    // Seed cache
    await localDB.cacheSeasonEpisodes(showId, 1, [
      { id: 1, episode_number: 1, season_number: 1, name: 'Ep1', overview: '', air_date: '2024-01-01' },
      { id: 2, episode_number: 2, season_number: 1, name: 'Ep2', overview: '', air_date: '2024-01-02' }
    ]);

    const next = await episodeService.getNextEpisode(showId, 1, 1);
    expect(next?.episode_number).toBe(2);
    expect(tmdbService.getNextEpisode).not.toHaveBeenCalled();
  });

  it('skips unaired episodes when skipUnaired true', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0,10);
    await localDB.cacheSeasonEpisodes(showId, 1, [
      { id: 1, episode_number: 1, season_number: 1, name: 'Ep1', overview: '', air_date: '2024-01-01' },
      { id: 2, episode_number: 2, season_number: 1, name: 'Future', overview: '', air_date: futureDate }
    ]);

    const next = await episodeService.getNextEpisode(showId, 1, 1, { skipUnaired: true });
    // Should return null because only next is unaired
    expect(next).toBeNull();
  });

  it('falls back to tmdb when cache empty', async () => {
    (tmdbService.getNextEpisode as jest.Mock).mockResolvedValue({
      id: 3,
      episode_number: 5,
      season_number: 2,
      name: 'Remote Next',
      overview: '',
      air_date: '2024-02-01'
    });

    const next = await episodeService.getNextEpisode(showId, 1, 10);
    expect(next?.season_number).toBe(2);
    expect(tmdbService.getNextEpisode).toHaveBeenCalled();
  });
});
