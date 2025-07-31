import { tmdbService } from './tmdb';
import { Show } from '../types';

export interface SearchFilters {
  genre?: number[];
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  status?: 'returning' | 'ended' | 'continuing' | 'planned';
  network?: string;
  language?: string;
}

export interface SearchOptions {
  filters?: SearchFilters;
  page?: number;
  sortBy?: 'popularity' | 'rating' | 'first_air_date' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  shows: Show[];
  totalResults: number;
  page: number;
  totalPages: number;
}

export interface TrendingContent {
  daily: Show[];
  weekly: Show[];
  updated: string;
}

export interface GenreInfo {
  id: number;
  name: string;
}

export interface SearchSuggestion {
  query: string;
  timestamp: string;
  resultCount: number;
}

class DiscoveryService {
  private searchHistory: SearchSuggestion[] = [];
  private cachedGenres: GenreInfo[] | null = null;
  private cachedTrending: TrendingContent | null = null;
  private trendingCacheExpiry: number = 0;

  /**
   * Enhanced search with filters and sorting
   */
  async searchShows(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    try {
      console.log('Searching shows:', query, options);

      // Save search to history
      this.addToSearchHistory(query);

      // Build TMDB API parameters
      const params: any = {
        query: query.trim(),
        page: options.page || 1,
      };

      // Apply filters if provided
      if (options.filters) {
        if (options.filters.yearFrom) {
          params.first_air_date_year = options.filters.yearFrom;
        }
        if (options.filters.genre && options.filters.genre.length > 0) {
          params.with_genres = options.filters.genre.join(',');
        }
        if (options.filters.minRating) {
          params.vote_average_gte = options.filters.minRating;
        }
      }

      // Apply sorting
      if (options.sortBy) {
        params.sort_by = this.mapSortBy(options.sortBy, options.sortOrder);
      }

      // Perform search
      const response = await this.performTMDBSearch(params);
      
      // Transform results
      const shows = this.transformTMDBResults(response.results);
      
      const result: SearchResult = {
        shows,
        totalResults: response.total_results,
        page: response.page,
        totalPages: response.total_pages,
      };

      console.log(`Search completed: ${shows.length} shows found`);
      return result;

    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Failed to search shows');
    }
  }

  /**
   * Get trending shows (daily and weekly)
   */
  async getTrendingShows(forceRefresh = false): Promise<TrendingContent> {
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (!forceRefresh && this.cachedTrending && now < this.trendingCacheExpiry) {
      return this.cachedTrending;
    }

    try {
      console.log('Fetching trending shows...');

      const [dailyResponse, weeklyResponse] = await Promise.all([
        this.fetchTrendingFromTMDB('day'),
        this.fetchTrendingFromTMDB('week')
      ]);

      const trendingContent: TrendingContent = {
        daily: this.transformTMDBResults(dailyResponse.results.slice(0, 20)),
        weekly: this.transformTMDBResults(weeklyResponse.results.slice(0, 20)),
        updated: new Date().toISOString(),
      };

      // Cache for 6 hours
      this.cachedTrending = trendingContent;
      this.trendingCacheExpiry = now + (6 * 60 * 60 * 1000);

      console.log('Trending shows fetched successfully');
      return trendingContent;

    } catch (error) {
      console.error('Failed to fetch trending shows:', error);
      
      // Return cached data if available
      if (this.cachedTrending) {
        return this.cachedTrending;
      }
      
      throw new Error('Failed to fetch trending shows');
    }
  }

  /**
   * Get popular shows by genre
   */
  async getPopularByGenre(genreId: number, page = 1): Promise<SearchResult> {
    try {
      console.log(`Fetching popular shows for genre ${genreId}...`);

      const params = {
        with_genres: genreId.toString(),
        sort_by: 'popularity.desc',
        page,
      };

      const response = await this.performTMDBDiscovery(params);
      const shows = this.transformTMDBResults(response.results);

      return {
        shows,
        totalResults: response.total_results,
        page: response.page,
        totalPages: response.total_pages,
      };

    } catch (error) {
      console.error(`Failed to fetch popular shows for genre ${genreId}:`, error);
      throw new Error('Failed to fetch popular shows');
    }
  }

  /**
   * Get available genres
   */
  async getGenres(forceRefresh = false): Promise<GenreInfo[]> {
    if (!forceRefresh && this.cachedGenres) {
      return this.cachedGenres;
    }

    try {
      console.log('Fetching genres...');
      
      // Fetch genres from TMDB
      const response = await tmdbService.getGenres();
      const genres = response.genres;

      this.cachedGenres = genres;
      return genres;

    } catch (error) {
      console.error('Failed to fetch genres:', error);
      
      // Fallback to hardcoded genres if API fails
      const fallbackGenres: GenreInfo[] = [
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' },
        { id: 80, name: 'Crime' },
        { id: 99, name: 'Documentary' },
        { id: 18, name: 'Drama' },
        { id: 10751, name: 'Family' },
        { id: 14, name: 'Fantasy' },
        { id: 36, name: 'History' },
        { id: 27, name: 'Horror' },
        { id: 10762, name: 'Kids' },
        { id: 9648, name: 'Mystery' },
        { id: 10763, name: 'News' },
        { id: 10764, name: 'Reality' },
        { id: 10765, name: 'Sci-Fi & Fantasy' },
        { id: 10766, name: 'Soap' },
        { id: 10767, name: 'Talk' },
        { id: 10768, name: 'War & Politics' },
        { id: 37, name: 'Western' },
      ];

      this.cachedGenres = fallbackGenres;
      return fallbackGenres;
    }
  }

  /**
   * Get search suggestions based on history
   */
  getSearchSuggestions(query: string, limit = 5): SearchSuggestion[] {
    if (!query.trim()) {
      return this.searchHistory.slice(0, limit);
    }

    return this.searchHistory
      .filter(suggestion => 
        suggestion.query.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  }

  /**
   * Get recent search queries
   */
  getRecentSearches(limit = 10): SearchSuggestion[] {
    return this.searchHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.loadSearchHistory();
    console.log('DiscoveryService initialized');
  }

  // Private methods

  private async performTMDBSearch(params: any): Promise<any> {
    // Use the actual TMDB service for search
    if (params.query && params.query.trim()) {
      return await tmdbService.searchShows(params.query, params.page || 1);
    } else {
      // For discovery without query, use popular shows
      return await tmdbService.getPopularShows(params.page || 1);
    }
  }

  private async performTMDBDiscovery(params: any): Promise<any> {
    // Mock TMDB discover API call
    return this.performTMDBSearch(params);
  }

  private async fetchTrendingFromTMDB(timeWindow: 'day' | 'week'): Promise<any> {
    // Use the actual TMDB service for trending shows
    return await tmdbService.getTrendingShows(timeWindow);
  }

  private transformTMDBResults(results: any[]): Show[] {
    return results.map(result => ({
      id: result.id,
      title: result.name,
      overview: result.overview,
      poster_path: result.poster_path,
      backdrop_path: result.backdrop_path,
      first_air_date: result.first_air_date,
      vote_average: result.vote_average,
      genre_ids: result.genre_ids,
      tmdb_id: result.id,
    }));
  }

  private mapSortBy(sortBy: string, sortOrder: string = 'desc'): string {
    const sortMap: Record<string, string> = {
      popularity: 'popularity',
      rating: 'vote_average',
      first_air_date: 'first_air_date',
      name: 'original_name',
    };

    const tmdbSort = sortMap[sortBy] || 'popularity';
    return `${tmdbSort}.${sortOrder}`;
  }

  private addToSearchHistory(query: string): void {
    if (!query.trim()) return;

    // Remove existing entry for this query
    this.searchHistory = this.searchHistory.filter(s => s.query !== query);

    // Add new entry at the beginning
    this.searchHistory.unshift({
      query,
      timestamp: new Date().toISOString(),
      resultCount: 0, // Will be updated after search
    });

    // Keep only last 50 searches
    this.searchHistory = this.searchHistory.slice(0, 50);

    this.saveSearchHistory();
  }

  private async loadSearchHistory(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('searchHistory');
        if (stored) {
          this.searchHistory = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  private saveSearchHistory(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
      }
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }
}

export const discoveryService = new DiscoveryService();
