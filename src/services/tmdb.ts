import { Show, Episode } from '../types';
import { logger } from '../utils/logger';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Types for better type safety
interface TMDBResponse<T> {
  results: T[];
  total_pages: number;
  total_results: number;
}

interface ShowListResponse {
  results: Show[];
  total_pages: number;
}

interface SeasonInfo {
  season_number: number;
  episode_count: number;
}

class TMDBService {
  // ============================================================================
  // CORE API METHODS
  // ============================================================================

  private async fetchFromTMDB(endpoint: string): Promise<any> {
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
      throw new Error('TMDB API key not configured. Please set EXPO_PUBLIC_TMDB_API_KEY in your .env file.');
    }

    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${TMDB_BASE_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Network or HTTP failures are expected negative paths in tests
      logger.errorExpected('TMDB fetch error:', error);
      throw error;
    }
  }

  private async fetchShowList(endpoint: string, errorContext: string): Promise<ShowListResponse> {
    try {
      const data: TMDBResponse<any> = await this.fetchFromTMDB(endpoint);
      return {
        results: data.results.map(this.transformShow).filter((show: Show) => !!show.title),
        total_pages: data.total_pages,
      };
    } catch (error) {
      // Expected when API/network fails
      logger.errorExpected(`${errorContext} error:`, error);
      throw error;
    }
  }

  private async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    defaultValue: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Swallowing by returning defaultValue; treat as expected negative path
      logger.errorExpected(errorMessage, error);
      return defaultValue;
    }
  }

  // ============================================================================
  // SHOW DISCOVERY METHODS
  // ============================================================================

  async searchShows(query: string, page: number = 1): Promise<ShowListResponse> {
    if (!query.trim()) {
      return { results: [], total_pages: 0 };
    }

    const endpoint = `/search/tv?query=${encodeURIComponent(query.trim())}&page=${page}`;
    return this.fetchShowList(endpoint, 'TMDB search');
  }

  async getPopularShows(page: number = 1): Promise<ShowListResponse> {
    return this.fetchShowList(`/tv/popular?page=${page}`, 'TMDB popular shows');
  }

  async getTrendingShows(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<ShowListResponse> {
    return this.fetchShowList(`/trending/tv/${timeWindow}?page=${page}`, 'TMDB trending shows');
  }

  async getGenres(): Promise<{ genres: { id: number; name: string }[] }> {
    return this.fetchFromTMDB('/genre/tv/list');
  }

  // ============================================================================
  // SHOW DETAILS METHODS
  // ============================================================================

  async getShowDetails(showId: number): Promise<Show> {
    const data = await this.fetchFromTMDB(`/tv/${showId}`);
    return this.transformShow(data);
  }

  async getSeasonEpisodes(showId: number, seasonNumber: number): Promise<Episode[]> {
    const data = await this.fetchFromTMDB(`/tv/${showId}/season/${seasonNumber}`);
    return data.episodes.map(this.transformEpisode);
  }

  // ============================================================================
  // PROGRESS TRACKING METHODS
  // ============================================================================

  async getTotalEpisodeCount(showId: number): Promise<{ totalEpisodes: number; seasonCount: number }> {
    return this.withErrorHandling(
      async () => {
        const showDetails = await this.fetchFromTMDB(`/tv/${showId}`);
        const regularSeasons = this.getRegularSeasons(showDetails.seasons);
        
        const totalEpisodes = regularSeasons.reduce((total: number, season: SeasonInfo) => 
          total + (season.episode_count || 0), 0
        );

        return { totalEpisodes, seasonCount: regularSeasons.length };
      },
      'Error getting total episode count:',
      { totalEpisodes: 0, seasonCount: 0 }
    );
  }

  async getNextEpisode(showId: number, currentSeason: number, currentEpisode: number): Promise<Episode | null> {
    return this.withErrorHandling(
      async () => {
        // Try to get the next episode in the current season
        const currentSeasonEpisodes = await this.getSeasonEpisodes(showId, currentSeason);
        const nextEpisodeInSeason = currentSeasonEpisodes.find(ep => ep.episode_number === currentEpisode + 1);
        
        if (nextEpisodeInSeason) {
          return nextEpisodeInSeason;
        }

        // If no next episode in current season, try next season
        try {
          const nextSeasonEpisodes = await this.getSeasonEpisodes(showId, currentSeason + 1);
          return nextSeasonEpisodes.find(ep => ep.episode_number === 1) || null;
        } catch {
          return null; // Next season doesn't exist
        }
      },
      'Error getting next episode:',
      null
    );
  }

  async calculateWatchedEpisodes(showId: number, currentSeason: number, currentEpisode: number): Promise<number> {
    return this.withErrorHandling(
      async () => {
        const showDetails = await this.fetchFromTMDB(`/tv/${showId}`);
        const regularSeasons = this.getRegularSeasons(showDetails.seasons);
        
        return regularSeasons.reduce((watchedCount: number, season: SeasonInfo) => {
          if (season.season_number < currentSeason) {
            return watchedCount + (season.episode_count || 0);
          } else if (season.season_number === currentSeason) {
            return watchedCount + Math.max(0, currentEpisode - 1);
          }
          return watchedCount;
        }, 0);
      },
      'Error calculating watched episodes:',
      0
    );
  }

  async isShowCompleted(showId: number, currentSeason: number, currentEpisode: number): Promise<boolean> {
    return this.withErrorHandling(
      async () => {
        const showDetails = await this.fetchFromTMDB(`/tv/${showId}`);
        const regularSeasons = this.getRegularSeasons(showDetails.seasons);
        
        if (regularSeasons.length === 0) return false;
        
        const lastSeason = regularSeasons[regularSeasons.length - 1];
        const lastSeasonEpisodes = await this.getSeasonEpisodes(showId, lastSeason.season_number);
        
        if (lastSeasonEpisodes.length === 0) return false;
        
        const lastEpisode = Math.max(...lastSeasonEpisodes.map(ep => ep.episode_number));
        return currentSeason === lastSeason.season_number && currentEpisode >= lastEpisode;
      },
      'Error checking if show completed:',
      false
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getRegularSeasons(seasons?: any[]): SeasonInfo[] {
    return seasons?.filter(season => season.season_number > 0) || [];
  }

  getImageUrl(path: string | undefined, size: string = 'w500'): string | undefined {
    if (!path) return undefined;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  // ============================================================================
  // DATA TRANSFORMATION METHODS
  // ============================================================================

  private transformShow = (tmdbShow: any): Show => ({
    id: tmdbShow.id,
    title: tmdbShow.name || tmdbShow.title,
    poster_path: tmdbShow.poster_path,
    backdrop_path: tmdbShow.backdrop_path,
    overview: tmdbShow.overview,
    first_air_date: tmdbShow.first_air_date,
    vote_average: tmdbShow.vote_average,
    genre_ids: tmdbShow.genre_ids || [],
    tmdb_id: tmdbShow.id,
  });

  private transformEpisode = (tmdbEpisode: any): Episode => ({
    id: tmdbEpisode.id,
    episode_number: tmdbEpisode.episode_number,
    season_number: tmdbEpisode.season_number,
    name: tmdbEpisode.name,
    overview: tmdbEpisode.overview,
    air_date: tmdbEpisode.air_date,
    still_path: tmdbEpisode.still_path,
  });
}

export const tmdbService = new TMDBService();
