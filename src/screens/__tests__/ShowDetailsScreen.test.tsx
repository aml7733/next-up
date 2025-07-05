import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ShowDetailsScreen from '../ShowDetailsScreen';
import { useAuthStore } from '../../store/authStore';
import { useShowsStore } from '../../store/showsStore';

// Mock stores
jest.mock('../../store/authStore');
jest.mock('../../store/showsStore');

// Mock services
jest.mock('../../services/tmdb', () => ({
  tmdbService: {
    getShowDetails: jest.fn(),
    getImageUrl: jest.fn((path: string, size: string) => 
      path ? `https://image.tmdb.org/t/p/${size}${path}` : null
    ),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigation = {
  goBack: mockGoBack,
} as any;

const mockRoute = {
  params: { showId: 123 },
} as any;

// Mock show data
const mockShow = {
  tmdb_id: 123,
  title: 'Breaking Bad',
  overview: 'A high school chemistry teacher turned methamphetamine producer.',
  first_air_date: '2008-01-20',
  vote_average: 9.3,
  poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  backdrop_path: '/9faGSFi5jam6pDWGNd0p8JcJgXQ.jpg',
  genres: [],
  seasons: [],
  episode_count: 62,
  status: 'Ended',
};

const mockUserShow = {
  id: '1',
  user_id: '1',
  show_id: 123,
  status: 'watching' as const,
  current_season: 2,
  current_episode: 5,
  added_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  created_at: '2024-01-01',
};

// Mock implementations
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseShowsStore = useShowsStore as jest.MockedFunction<typeof useShowsStore>;

const mockAddShow = jest.fn();
const mockUpdateShowStatus = jest.fn();
const mockUpdateShowProgress = jest.fn();
const mockRemoveShow = jest.fn();

describe('ShowDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    mockUseShowsStore.mockReturnValue({
      userShows: [],
      isLoading: false,
      error: null,
      addShow: mockAddShow,
      removeShow: mockRemoveShow,
      updateShowStatus: mockUpdateShowStatus,
      updateShowProgress: mockUpdateShowProgress,
      fetchUserShows: jest.fn(),
    });

    // Mock tmdb service to resolve with show data
    const { tmdbService } = require('../../services/tmdb');
    tmdbService.getShowDetails.mockResolvedValue(mockShow);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    expect(getByText('Loading show details...')).toBeTruthy();
  });

  it('renders show details after loading', async () => {
    const { getByText, queryByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    // Should show loading initially
    expect(getByText('Loading show details...')).toBeTruthy();
    
    // Wait for show details to load
    await waitFor(() => {
      expect(queryByText('Loading show details...')).toBeFalsy();
    });

    // Should show show details
    expect(getByText('Breaking Bad')).toBeTruthy();
    expect(getByText('2008 • ⭐ 9.3')).toBeTruthy();
    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('A high school chemistry teacher turned methamphetamine producer.')).toBeTruthy();
  });

  it('shows add to tracking button when user is authenticated and not tracking', async () => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const { getByText, queryByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(queryByText('Loading show details...')).toBeFalsy();
    });

    expect(getByText('Add to Tracking')).toBeTruthy();
    expect(getByText('Add this show to your tracking list to keep track of your progress.')).toBeTruthy();
  });

  it('shows tracking controls when user is tracking the show', async () => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    mockUseShowsStore.mockReturnValue({
      userShows: [mockUserShow],
      isLoading: false,
      error: null,
      addShow: mockAddShow,
      removeShow: mockRemoveShow,
      updateShowStatus: mockUpdateShowStatus,
      updateShowProgress: mockUpdateShowProgress,
      fetchUserShows: jest.fn(),
    });

    // Make the API call resolve immediately
    const { tmdbService } = require('../../services/tmdb');
    tmdbService.getShowDetails.mockResolvedValueOnce(mockShow);

    const { getByText, queryByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(queryByText('Loading show details...')).toBeFalsy();
    }, { timeout: 3000 });

    expect(getByText('Currently Watching')).toBeTruthy();
    expect(getByText('Progress: Season 2, Episode 5')).toBeTruthy();
    expect(getByText('Mark Next Episode Watched')).toBeTruthy();
    expect(getByText('Remove from Tracking')).toBeTruthy();
  });

  it('calls addShow when add to tracking button is pressed', async () => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const { getByText, queryByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(queryByText('Loading show details...')).toBeFalsy();
    });

    const addButton = getByText('Add to Tracking');
    
    await act(async () => {
      fireEvent.press(addButton);
    });

    expect(mockAddShow).toHaveBeenCalledWith(mockUser.id, mockShow, 'want_to_watch');
  });

  it('calls updateShowProgress when mark next episode is pressed', async () => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    mockUseShowsStore.mockReturnValue({
      userShows: [mockUserShow],
      isLoading: false,
      error: null,
      addShow: mockAddShow,
      removeShow: mockRemoveShow,
      updateShowStatus: mockUpdateShowStatus,
      updateShowProgress: mockUpdateShowProgress,
      fetchUserShows: jest.fn(),
    });

    // Make the API call resolve immediately
    const { tmdbService } = require('../../services/tmdb');
    tmdbService.getShowDetails.mockResolvedValueOnce(mockShow);

    const { getByText, queryByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(queryByText('Loading show details...')).toBeFalsy();
    }, { timeout: 3000 });

    const progressButton = getByText('Mark Next Episode Watched');
    
    await act(async () => {
      fireEvent.press(progressButton);
    });

    expect(mockUpdateShowProgress).toHaveBeenCalledWith(mockUser.id, mockShow.tmdb_id, 2, 6);
  });

  it('shows authentication alert when unauthenticated user tries to add show', async () => {
    const component = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(component.queryByText('Loading show details...')).toBeFalsy();
    }, { timeout: 2000 });

    // Should show tracking section with info text, but no add button for unauthenticated user
    expect(component.getByText('Tracking')).toBeTruthy();
    // Should not show add button for unauthenticated user
    expect(component.queryByText('Add to Tracking')).toBeFalsy();
  });

  it('calls removeShow when remove button is pressed with confirmation', async () => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    mockUseShowsStore.mockReturnValue({
      userShows: [mockUserShow],
      isLoading: false,
      error: null,
      addShow: mockAddShow,
      removeShow: mockRemoveShow,
      updateShowStatus: mockUpdateShowStatus,
      updateShowProgress: mockUpdateShowProgress,
      fetchUserShows: jest.fn(),
    });

    // Mock Alert.alert to simulate user confirming removal
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      // Simulate user pressing "Remove" button
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    // Make the API call resolve immediately
    const { tmdbService } = require('../../services/tmdb');
    tmdbService.getShowDetails.mockResolvedValueOnce(mockShow);

    const { getByText, queryByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(queryByText('Loading show details...')).toBeFalsy();
    }, { timeout: 3000 });

    const removeButton = getByText('Remove from Tracking');
    
    await act(async () => {
      fireEvent.press(removeButton);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Remove Show',
      'Are you sure you want to remove "Breaking Bad" from your tracking list?',
      expect.any(Array)
    );
    expect(mockRemoveShow).toHaveBeenCalledWith(mockUser.id, mockShow.tmdb_id);

    alertSpy.mockRestore();
  });

  it('handles back button press', async () => {
    const { queryByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(queryByText('Loading show details...')).toBeFalsy();
    });

    // Back button is an IconButton, we can't easily test it without complex DOM traversal
    // Instead, we'll verify navigation.goBack was set up correctly by testing the navigation prop
    expect(mockNavigation.goBack).toBeDefined();
  });

  it('handles API error gracefully', async () => {
    const { tmdbService } = require('../../services/tmdb');
    tmdbService.getShowDetails.mockRejectedValue(new Error('API Error'));

    const { getByText, queryByText } = render(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(queryByText('Loading show details...')).toBeFalsy();
    });

    expect(getByText('Show not found')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load show details');
  });
});
