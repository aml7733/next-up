import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EnhancedShowCard } from '../SwipeableShowCard';
import { UserShow } from '../../types';

// Mock the TMDB service
jest.mock('../../services/tmdb', () => ({
  tmdbService: {
    getImageUrl: jest.fn((path: string, size: string) => 
      path ? `https://image.tmdb.org/t/p/${size}${path}` : null
    ),
  },
}));

describe('EnhancedShowCard', () => {
  const mockShow: UserShow = {
    id: '1',
    show_id: 123,
    user_id: 'test-user',
    status: 'watching',
    current_season: 2,
    current_episode: 5,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    show: {
      id: 123,
      title: 'Test Show',
      overview: 'Test overview',
      poster_path: '/test.jpg',
      backdrop_path: '/test-bg.jpg',
      first_air_date: '2023-01-01',
      vote_average: 8.5,
      genre_ids: [18],
      tmdb_id: 123
    }
  };

  const mockOnPress = jest.fn();
  const mockOnMarkNextEpisode = jest.fn();
  const mockOnQuickStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders show information correctly', () => {
    const { getByText } = render(
      <EnhancedShowCard 
        userShow={mockShow}
        onPress={mockOnPress}
        onMarkNextEpisode={mockOnMarkNextEpisode}
        onQuickStatusChange={mockOnQuickStatusChange}
      />
    );

    expect(getByText('Test Show')).toBeTruthy();
    expect(getByText('S2E5')).toBeTruthy();
    expect(getByText('Test overview')).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const { getByTestId } = render(
      <EnhancedShowCard 
        userShow={mockShow}
        onPress={mockOnPress}
        testID="test-card"
      />
    );

    const card = getByTestId('test-card');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders start watching button for want_to_watch status', () => {
    const wantToWatchShow = {
      ...mockShow,
      status: 'want_to_watch' as const
    };

    const { getByText } = render(
      <EnhancedShowCard 
        userShow={wantToWatchShow}
        onPress={mockOnPress}
        onQuickStatusChange={mockOnQuickStatusChange}
      />
    );

    expect(getByText('Start')).toBeTruthy();
  });

  it('renders mark next episode button for watching status', () => {
    const { getByTestId } = render(
      <EnhancedShowCard 
        userShow={mockShow}
        onPress={mockOnPress}
        onMarkNextEpisode={mockOnMarkNextEpisode}
      />
    );

    expect(getByTestId('mark-watched-123')).toBeTruthy();
  });

  it('handles different show statuses correctly', () => {
    const completedShow = {
      ...mockShow,
      status: 'completed' as const
    };

    const { getAllByText } = render(
      <EnhancedShowCard 
        userShow={completedShow}
        onPress={mockOnPress}
      />
    );

    // Check for progress text that shows "Completed"
    expect(getAllByText('Completed').length).toBeGreaterThan(0);
  });

  it('handles show without overview', () => {
    const showWithoutOverview: UserShow = {
      ...mockShow,
      show: {
        id: 123,
        title: 'Test Show',
        overview: '',
        poster_path: '/test.jpg',
        backdrop_path: '/test-bg.jpg',
        first_air_date: '2023-01-01',
        vote_average: 8.5,
        genre_ids: [18],
        tmdb_id: 123
      }
    };

    const { getByText, queryByText } = render(
      <EnhancedShowCard 
        userShow={showWithoutOverview}
        onPress={mockOnPress}
      />
    );

    expect(getByText('Test Show')).toBeTruthy();
    expect(queryByText('Test overview')).toBeFalsy();
  });
});
