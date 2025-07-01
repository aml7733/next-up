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
        results: data.results.map(this.transformShow),
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
      results: data.results.map(this.transformShow),
      total_pages: data.total_pages,
    };
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
