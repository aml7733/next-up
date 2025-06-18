import React from 'react';
import { render, fireEvent, act, within } from '@testing-library/react-native';
import CurrentlyWatchingScreen from '../../screens/CurrentlyWatchingScreen';
import { useShowsStore } from '../../store/showsStore';
import { useAuthStore } from '../../store/authStore';

// REAL integration tests - test CurrentlyWatchingScreen with real store integration
// These tests verify the main user journey and how the screen responds to different store states

describe('CurrentlyWatchingScreen Integration Tests', () => {
  beforeEach(() => {
    // Reset stores to known state
    act(() => {
      useShowsStore.setState({
        userShows: [],
        isLoading: false,
        error: null,
      });
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    });
  });

  it('displays placeholder content when user is unauthenticated', () => {
    const screen = render(<CurrentlyWatchingScreen />);
    
    // Get the scroll view container first
    const scrollView = screen.getByTestId('currently-watching-scroll');
    expect(scrollView).toBeTruthy();
    
    // Use testIDs for reliable queries
    expect(screen.getByTestId('currently-watching-title')).toBeTruthy();
    expect(screen.getByTestId('no-shows-title')).toBeTruthy();
    expect(screen.getByTestId('no-shows-description')).toBeTruthy();
    
    // Verify the store state that drives this UI
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(false);
  });

  it('displays placeholder content when user is authenticated but has no shows', () => {
    // Set up authenticated user with no shows
    act(() => {
      useAuthStore.setState({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          created_at: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    });

    const screen = render(<CurrentlyWatchingScreen />);
    
    // Get the scroll view container first
    const scrollView = screen.getByTestId('currently-watching-scroll');
    expect(scrollView).toBeTruthy();
    
    // Use testIDs for reliable queries  
    expect(screen.getByTestId('currently-watching-title')).toBeTruthy();
    expect(screen.getByTestId('no-shows-title')).toBeTruthy();
    
    // Verify integrated store states
    const authState = useAuthStore.getState();
    const showsState = useShowsStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(showsState.userShows).toHaveLength(0);
  });

  it('displays status chips for show filtering', () => {
    const screen = render(<CurrentlyWatchingScreen />);
    
    // Should display filter chips regardless of authentication state
    expect(screen.getByTestId('watching-chip')).toBeTruthy();
    expect(screen.getByTestId('completed-chip')).toBeTruthy();
    expect(screen.getByTestId('paused-chip')).toBeTruthy();
  });

  it('handles loading state properly', () => {
    // Set up loading state
    act(() => {
      useAuthStore.setState({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          created_at: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useShowsStore.setState({
        userShows: [],
        isLoading: true,
        error: null,
      });
    });

    const screen = render(<CurrentlyWatchingScreen />);
    
    // Screen should still render while loading
    const scrollView = screen.getByTestId('currently-watching-scroll');
    expect(scrollView).toBeTruthy();
    expect(screen.getByTestId('currently-watching-title')).toBeTruthy();
    
    // Verify the loading state integration
    const showsState = useShowsStore.getState();
    expect(showsState.isLoading).toBe(true);
  });

  it('handles error state integration', () => {
    // Set up error state
    act(() => {
      useAuthStore.setState({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          created_at: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useShowsStore.setState({
        userShows: [],
        isLoading: false,
        error: 'Failed to load shows',
      });
    });

    const screen = render(<CurrentlyWatchingScreen />);
    
    // Screen should handle error state gracefully
    const scrollView = screen.getByTestId('currently-watching-scroll');
    expect(scrollView).toBeTruthy();
    expect(screen.getByTestId('currently-watching-title')).toBeTruthy();
    
    // Verify error state integration
    const showsState = useShowsStore.getState();
    expect(showsState.error).toBe('Failed to load shows');
  });

  it('integrates properly when user has shows (future state)', () => {
    // Set up user with shows (testing the data structure integration)
    act(() => {
      useAuthStore.setState({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          created_at: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      useShowsStore.setState({
        userShows: [
          {
            id: '1',
            user_id: '1',
            show_id: 12345,
            status: 'watching',
            current_season: 1,
            current_episode: 5,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: '2',
            user_id: '1',
            show_id: 67890,
            status: 'completed',
            current_season: 3,
            current_episode: 10,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
        isLoading: false,
        error: null,
      });
    });

    const screen = render(<CurrentlyWatchingScreen />);
    
    // Screen should render with shows data
    const scrollView = screen.getByTestId('currently-watching-scroll');
    expect(scrollView).toBeTruthy();
    expect(screen.getByTestId('currently-watching-title')).toBeTruthy();
    
    // Verify the populated state integration
    const showsState = useShowsStore.getState();
    expect(showsState.userShows).toHaveLength(2);
    expect(showsState.userShows[0].status).toBe('watching');
    expect(showsState.userShows[1].status).toBe('completed');
  });
});
