import { Episode } from '../types';
import { localDB } from './database';
import { tmdbService } from './tmdb';

interface GetNextEpisodeOptions {
  skipUnaired?: boolean;
  forceRefresh?: boolean;
}

class EpisodeService {
  async ensureSeasonCached(showId: number, seasonNumber: number): Promise<void> {
    // TTL logic: refresh if no cache or last_synced_at older than 24h
    const TTL_MS = 24 * 60 * 60 * 1000;
    const cachedEpisodes = await localDB.getSeasonEpisodes(showId, seasonNumber);
    const meta = await localDB.getSeasonMeta(showId, seasonNumber);
    const stale = !meta?.last_synced_at || (Date.now() - new Date(meta.last_synced_at).getTime()) > TTL_MS;
    if (cachedEpisodes.length > 0 && !stale) return; // Fresh enough
    try {
      const episodes = await tmdbService.getSeasonEpisodes(showId, seasonNumber);
      if (episodes?.length) {
        await localDB.cacheSeasonEpisodes(showId, seasonNumber, episodes as Episode[]);
      }
    } catch (error) {
      if (cachedEpisodes.length === 0) {
        console.error('Failed to fetch season episodes and none cached:', { showId, seasonNumber, error });
      } // else keep stale cache silently
    }
  }

  async getSeasonEpisodes(showId: number, seasonNumber: number, opts?: { forceRefresh?: boolean }): Promise<Episode[]> {
    if (opts?.forceRefresh) {
      try {
        const episodes = await tmdbService.getSeasonEpisodes(showId, seasonNumber);
        if (episodes?.length) {
          await localDB.cacheSeasonEpisodes(showId, seasonNumber, episodes as Episode[]);
        }
      } catch (error) {
        console.error('Force refresh season episodes failed, falling back to cache:', error);
      }
    }
    return localDB.getSeasonEpisodes(showId, seasonNumber);
  }

  async markEpisodeWatched(userId: string, showId: number, season: number, episode: number): Promise<void> {
    await localDB.markEpisodeWatched(userId, showId, season, episode);
  }

  async getWatchedCount(userId: string, showId: number): Promise<number> {
    return localDB.getWatchedEpisodesCount(userId, showId);
  }

  async getNextEpisode(
    showId: number,
    currentSeason: number,
    currentEpisode: number,
    options: GetNextEpisodeOptions = {}
  ): Promise<Episode | null> {
    const { skipUnaired = true, forceRefresh = false } = options;

    // Try cache shortcut
    let next = await localDB.getNextEpisodeFromCache(showId, currentSeason, currentEpisode, skipUnaired);
    if (next) return next;

    // Optionally refresh current & next season
    if (forceRefresh) {
      await Promise.all([
        this.ensureSeasonCached(showId, currentSeason),
        this.ensureSeasonCached(showId, currentSeason + 1)
      ]);
      next = await localDB.getNextEpisodeFromCache(showId, currentSeason, currentEpisode, skipUnaired);
      if (next) return next;
    }

    // Fallback: ask tmdbService directly for next episode logic
    try {
      const tmdbNext = await tmdbService.getNextEpisode(showId, currentSeason, currentEpisode);
      if (tmdbNext) {
        // Cache involved seasons opportunistically
        if (tmdbNext.season_number) {
          await this.ensureSeasonCached(showId, tmdbNext.season_number);
        }
        return tmdbNext as Episode;
      }
    } catch (error) {
      console.error('Remote next episode fetch failed:', error);
    }

    return null;
  }
}

export const episodeService = new EpisodeService();
