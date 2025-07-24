import { Show, Episode } from '../types';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

class TMDBService {
  private async fetchFromTMDB(endpoint: string): Promise<any> {
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
      throw new Error('TMDB API key not configured. Please set EXPO_PUBLIC_TMDB_API_KEY in your .env file.');
    }

    // Check if endpoint already has query parameters
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${TMDB_BASE_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('TMDB fetch error:', error);
      throw error;
    }
  }

  // Search for TV shows
  async searchShows(query: string, page: number = 1): Promise<{ results: Show[]; total_pages: number }> {
    if (!query.trim()) {
      return { results: [], total_pages: 0 };
    }

    try {
      const data = await this.fetchFromTMDB(`/search/tv?query=${encodeURIComponent(query.trim())}&page=${page}`);
      
      return {
        results: data.results.map(this.transformShow).filter((show: Show) => !!show.title),
        total_pages: data.total_pages,
      };
    } catch (error) {
      console.error('TMDB search error:', error);
      throw error;
    }
  }

  // Get popular TV shows
  async getPopularShows(page: number = 1): Promise<{ results: Show[]; total_pages: number }> {
    const data = await this.fetchFromTMDB(`/tv/popular?page=${page}`);
    return {
      results: data.results.map(this.transformShow).filter((show: Show) => !!show.title),
      total_pages: data.total_pages,
    };
  }

  // Get trending TV shows
  async getTrendingShows(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<{ results: Show[]; total_pages: number }> {
    const data = await this.fetchFromTMDB(`/trending/tv/${timeWindow}?page=${page}`);
    return {
      results: data.results.map(this.transformShow).filter((show: Show) => !!show.title),
      total_pages: data.total_pages,
    };
  }

  // Get TV show genres
  async getGenres(): Promise<{ genres: { id: number; name: string }[] }> {
    return await this.fetchFromTMDB('/genre/tv/list');
  }

  // Get show details
  async getShowDetails(showId: number): Promise<Show> {
    const data = await this.fetchFromTMDB(`/tv/${showId}`);
    return this.transformShow(data);
  }

  // Get show episodes for a season
  async getSeasonEpisodes(showId: number, seasonNumber: number): Promise<Episode[]> {
    const data = await this.fetchFromTMDB(`/tv/${showId}/season/${seasonNumber}`);
    return data.episodes.map(this.transformEpisode);
  }

  // Get total episode count across all seasons (excluding specials)
  async getTotalEpisodeCount(showId: number): Promise<{ totalEpisodes: number; seasonCount: number }> {
    try {
      const showDetails = await this.fetchFromTMDB(`/tv/${showId}`);
      
      // Filter out season 0 (specials) if it exists
      const regularSeasons = showDetails.seasons?.filter((season: any) => season.season_number > 0) || [];
      
      const totalEpisodes = regularSeasons.reduce((total: number, season: any) => {
        return total + (season.episode_count || 0);
      }, 0);

      return {
        totalEpisodes,
        seasonCount: regularSeasons.length
      };
    } catch (error) {
      console.error('Error getting total episode count:', error);
      return { totalEpisodes: 0, seasonCount: 0 };
    }
  }

  // Get next episode to watch based on current progress
  async getNextEpisode(showId: number, currentSeason: number, currentEpisode: number): Promise<Episode | null> {
    try {
      // First try to get the next episode in the current season
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
        // Next season doesn't exist
        return null;
      }
    } catch (error) {
      console.error('Error getting next episode:', error);
      return null;
    }
  }

  // Calculate episodes watched based on current season/episode position
  async calculateWatchedEpisodes(showId: number, currentSeason: number, currentEpisode: number): Promise<number> {
    try {
      const showDetails = await this.fetchFromTMDB(`/tv/${showId}`);
      const regularSeasons = showDetails.seasons?.filter((season: any) => season.season_number > 0) || [];
      
      let watchedCount = 0;
      
      // Count all episodes from completed seasons
      for (const season of regularSeasons) {
        if (season.season_number < currentSeason) {
          watchedCount += season.episode_count || 0;
        } else if (season.season_number === currentSeason) {
          // For current season, count episodes up to current episode
          watchedCount += Math.max(0, currentEpisode - 1);
        }
      }
      
      return watchedCount;
    } catch (error) {
      console.error('Error calculating watched episodes:', error);
      return 0;
    }
  }

  // Check if user has completed the entire show
  async isShowCompleted(showId: number, currentSeason: number, currentEpisode: number): Promise<boolean> {
    try {
      const showDetails = await this.fetchFromTMDB(`/tv/${showId}`);
      const regularSeasons = showDetails.seasons?.filter((season: any) => season.season_number > 0) || [];
      
      if (regularSeasons.length === 0) return false;
      
      const lastSeason = regularSeasons[regularSeasons.length - 1];
      const lastSeasonEpisodes = await this.getSeasonEpisodes(showId, lastSeason.season_number);
      const lastEpisode = Math.max(...lastSeasonEpisodes.map(ep => ep.episode_number));
      
      return currentSeason === lastSeason.season_number && currentEpisode >= lastEpisode;
    } catch (error) {
      console.error('Error checking if show completed:', error);
      return false;
    }
  }

  // Transform TMDB show data to our Show interface
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

  // Transform TMDB episode data to our Episode interface
  private transformEpisode = (tmdbEpisode: any): Episode => ({
    id: tmdbEpisode.id,
    episode_number: tmdbEpisode.episode_number,
    season_number: tmdbEpisode.season_number,
    name: tmdbEpisode.name,
    overview: tmdbEpisode.overview,
    air_date: tmdbEpisode.air_date,
    still_path: tmdbEpisode.still_path,
  });

  // Helper function to get full image URL
  getImageUrl(path: string | undefined, size: string = 'w500'): string | undefined {
    if (!path) return undefined;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}

export const tmdbService = new TMDBService();
