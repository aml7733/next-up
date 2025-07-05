import React from 'react';
import { render, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchScreen from '../SearchScreen';
import { useAuthStore } from '../../store/authStore';

// Mock stores
jest.mock('../../store/authStore');
jest.mock('../../store/showsStore');

// Mock services
jest.mock('../../services/tmdb', () => ({
  tmdbService: {
    searchShows: jest.fn(),
    getPopularShows: jest.fn(),
  },
}));

// Mock Alert
import { Alert } from 'react-native';
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock show data
const mockPopularShows = {
  results: [
    {
      id: 1,
      tmdb_id: 1,
      title: 'Popular Show 1',
      overview: 'Overview 1',
      first_air_date: '2023-01-01',
      vote_average: 8.5,
      poster_path: '/poster1.jpg',
      backdrop_path: '/backdrop1.jpg',
      genres: [],
      seasons: [],
      episode_count: 10,
      status: 'Ongoing',
    },
    {
      id: 2,
      tmdb_id: 2,
      title: 'Popular Show 2',
      overview: 'Overview 2',
      first_air_date: '2023-02-01',
      vote_average: 7.8,
      poster_path: '/poster2.jpg',
      backdrop_path: '/backdrop2.jpg',
      genres: [],
      seasons: [],
      episode_count: 20,
      status: 'Ongoing',
    },
  ],
};

const mockSearchResults = {
  results: [
    {
      id: 3,
      tmdb_id: 3,
      title: 'Breaking Bad',
      overview: 'A high school chemistry teacher...',
      first_air_date: '2008-01-20',
      vote_average: 9.3,
      poster_path: '/poster3.jpg',
      backdrop_path: '/backdrop3.jpg',
      genres: [],
      seasons: [],
      episode_count: 62,
      status: 'Ended',
    },
  ],
};

const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  created_at: '2024-01-01',
};

// Wrapper component with QueryClient
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SearchScreen Integration Tests', () => {
  const { tmdbService } = require('../../services/tmdb');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset auth store to unauthenticated state
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    // Reset shows store
    const { useShowsStore } = require('../../store/showsStore');
    useShowsStore.mockReturnValue({
      userShows: [],
      isLoading: false,
      error: null,
      addShow: jest.fn(),
      removeShow: jest.fn(),
      updateShowStatus: jest.fn(),
      updateShowProgress: jest.fn(),
      fetchUserShows: jest.fn(),
    });

    // Mock tmdb service responses
    tmdbService.getPopularShows.mockResolvedValue(mockPopularShows);
    tmdbService.searchShows.mockResolvedValue(mockSearchResults);
  });

  it('renders search interface and loads popular shows', async () => {
    const screen = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>
    );
    
    // Should show basic UI elements
    expect(screen.getByTestId('search-input')).toBeTruthy();
    expect(screen.getByTestId('search-scroll')).toBeTruthy();
    expect(screen.getByTestId('discover-title')).toBeTruthy();
    
    // Wait for popular shows to load
    await waitFor(() => {
      expect(screen.getByTestId('popular-shows-title')).toBeTruthy();
    });

    // Should show popular shows
    expect(screen.getByText('Popular Show 1')).toBeTruthy();
    expect(screen.getByText('Popular Show 2')).toBeTruthy();
  });

  it('renders search interface for authenticated users', async () => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const screen = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('search-input')).toBeTruthy();
    expect(screen.getByTestId('search-scroll')).toBeTruthy();
    expect(screen.getByTestId('discover-title')).toBeTruthy();
    
    // Wait for popular shows to load
    await waitFor(() => {
      expect(screen.getByTestId('popular-shows-title')).toBeTruthy();
    });
  });

  it('handles search input and displays results', async () => {
    const screen = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>
    );
    
    const searchInput = screen.getByTestId('search-input');
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('discover-title')).toBeTruthy();
    });
    
    // Test user typing in search
    await act(async () => {
      fireEvent.changeText(searchInput, 'Breaking Bad');
    });
    
    // Should update the search query state
    expect(searchInput.props.value).toBe('Breaking Bad');
    
    // Wait for search results to load (debounced)
    await waitFor(() => {
      expect(screen.getByTestId('search-results-title')).toBeTruthy();
    }, { timeout: 3000 });

    // Should show search results and hide discover content
    expect(screen.getByText('Breaking Bad')).toBeTruthy();
    expect(screen.queryByTestId('discover-title')).toBeFalsy();
  });

  it('shows no results when search returns empty', async () => {
    tmdbService.searchShows.mockResolvedValue({ results: [] });

    const screen = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>
    );
    
    const searchInput = screen.getByTestId('search-input');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'NonexistentShow');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('search-no-results')).toBeTruthy();
    }, { timeout: 3000 });

    expect(screen.getByText('No Results')).toBeTruthy();
    expect(screen.getByText('No shows found for "NonexistentShow". Try a different search term.')).toBeTruthy();
  });

  it('handles search errors gracefully', async () => {
    tmdbService.searchShows.mockRejectedValue(new Error('API Error'));

    const screen = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>
    );
    
    const searchInput = screen.getByTestId('search-input');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'Error Search');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('search-error')).toBeTruthy();
    }, { timeout: 3000 });

    expect(screen.getByText('Search Error')).toBeTruthy();
    expect(screen.getByText('Failed to search shows. Please check your connection and try again.')).toBeTruthy();
  });

  it('handles popular shows loading error', async () => {
    tmdbService.getPopularShows.mockRejectedValue(new Error('API Error'));

    const screen = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('popular-error')).toBeTruthy();
    });

    expect(screen.getByText('Connection Error')).toBeTruthy();
    expect(screen.getByText('Failed to load popular shows. Please check your connection and try again.')).toBeTruthy();
  });

  it('shows loading states properly', async () => {
    // Mock slow loading for popular shows
    tmdbService.getPopularShows.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPopularShows), 100))
    );

    const screen = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>
    );
    
    // Should show loading state initially
    expect(screen.getByTestId('popular-loading')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('popular-loading')).toBeFalsy();
      expect(screen.getByTestId('popular-shows-title')).toBeTruthy();
    });
  });

  it('clears search when input is cleared', async () => {
    const screen = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>
    );
    
    const searchInput = screen.getByTestId('search-input');
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('discover-title')).toBeTruthy();
    });
    
    // Enter search
    await act(async () => {
      fireEvent.changeText(searchInput, 'Breaking Bad');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('search-results-title')).toBeTruthy();
    }, { timeout: 3000 });
    
    // Clear search
    await act(async () => {
      fireEvent.changeText(searchInput, '');
    });
    
    // Should return to discover state
    await waitFor(() => {
      expect(screen.getByTestId('discover-title')).toBeTruthy();
      expect(screen.queryByTestId('search-results-title')).toBeFalsy();
    });
  });
});
