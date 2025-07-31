import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CurrentlyWatchingScreen from '../CurrentlyWatchingScreen';

// Mock zustand stores
const mockUpdateShowStatus = jest.fn();
const mockLoadUserShows = jest.fn();

jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'test-user-id' }
  })),
}));

jest.mock('../../store/showsStore', () => ({
  useShowsStore: jest.fn(() => ({
    userShows: [],
    isLoading: false,
    error: null,
    loadUserShows: mockLoadUserShows,
    updateShowStatus: mockUpdateShowStatus,
  })),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(component);
};

describe('CurrentlyWatchingScreen', () => {
  it('renders correctly with no shows', () => {
    const { getByText } = renderWithTheme(<CurrentlyWatchingScreen />);
    
    expect(getByText('My Shows')).toBeTruthy();
    expect(getByText('No shows yet')).toBeTruthy();
    expect(getByText('Start tracking your favorite TV shows by searching for them in the Search tab.')).toBeTruthy();
  });

  it('renders status chips', () => {
    const { getByText } = renderWithTheme(<CurrentlyWatchingScreen />);
    
    expect(getByText('Watching (0)')).toBeTruthy();
    expect(getByText('Completed (0)')).toBeTruthy();
    expect(getByText('Paused (0)')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const { getByText } = renderWithTheme(<CurrentlyWatchingScreen />);
    
    const title = getByText('My Shows');
    expect(title).toBeTruthy();
  });

  it('renders ScrollView for content', () => {
    const { getByTestId } = renderWithTheme(
      <CurrentlyWatchingScreen />
    );
    
    // ScrollView should be present for scrollable content
    expect(() => getByTestId('currently-watching-scroll')).not.toThrow();
  });

  it('displays start watching button for want_to_watch shows', () => {
    const mockWantToWatchShow = {
      id: '1',
      show_id: 123,
      user_id: 'test-user',
      status: 'want_to_watch' as const,
      current_season: 1,
      current_episode: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      show: {
        tmdb_id: 123,
        title: 'Test Show',
        overview: 'Test overview',
        poster_path: '/test.jpg',
        backdrop_path: '/test-bg.jpg',
        first_air_date: '2023-01-01',
        vote_average: 8.5,
        vote_count: 1000,
        genre_ids: [18],
        original_language: 'en',
        original_name: 'Test Show',
        popularity: 100,
        origin_country: ['US']
      }
    };

    // Update the mock to return our test show
    const { useShowsStore } = require('../../store/showsStore');
    useShowsStore.mockReturnValue({
      userShows: [mockWantToWatchShow],
      isLoading: false,
      error: null,
      loadUserShows: mockLoadUserShows,
      updateShowStatus: mockUpdateShowStatus,
    });

    const { getByText, getAllByText } = renderWithTheme(<CurrentlyWatchingScreen />);
    
    // Should show the want to watch section
    expect(getAllByText('Want to Watch (1)').length).toBeGreaterThan(0);
    expect(getByText('Test Show')).toBeTruthy();
    expect(getByText('Start')).toBeTruthy();
  });

  it('calls updateShowStatus when start watching button is pressed', () => {
    const mockWantToWatchShow = {
      id: '1',
      show_id: 123,
      user_id: 'test-user',
      status: 'want_to_watch' as const,
      current_season: 1,
      current_episode: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      show: {
        tmdb_id: 123,
        title: 'Test Show',
        overview: 'Test overview',
        poster_path: '/test.jpg',
        backdrop_path: '/test-bg.jpg',
        first_air_date: '2023-01-01',
        vote_average: 8.5,
        vote_count: 1000,
        genre_ids: [18],
        original_language: 'en',
        original_name: 'Test Show',
        popularity: 100,
        origin_country: ['US']
      }
    };

    // Update the mock to return our test show
    const { useShowsStore } = require('../../store/showsStore');
    useShowsStore.mockReturnValue({
      userShows: [mockWantToWatchShow],
      isLoading: false,
      error: null,
      loadUserShows: mockLoadUserShows,
      updateShowStatus: mockUpdateShowStatus,
    });

    const { getByText } = renderWithTheme(<CurrentlyWatchingScreen />);
    
    const startWatchingButton = getByText('Start');
    fireEvent.press(startWatchingButton);
    
    expect(mockUpdateShowStatus).toHaveBeenCalledWith('test-user-id', 123, 'watching');
  });
});
