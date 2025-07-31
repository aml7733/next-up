import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecentlyWatched } from '../RecentlyWatched';
import type { RecentActivity } from '../RecentlyWatched';

// Mock the TMDB service
jest.mock('../../services/tmdb', () => ({
  tmdbService: {
    getImageUrl: jest.fn((path: string, size: string) => 
      path ? `https://image.tmdb.org/t/p/${size}${path}` : null
    ),
  },
}));

describe('RecentlyWatched', () => {
  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      userShow: {
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
      },
      action: 'watched_episode',
      episode: { season: 2, episode: 5, name: 'Test Episode' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: '2',
      userShow: {
        id: '2',
        show_id: 456,
        user_id: 'test-user',
        status: 'watching',
        current_season: 1,
        current_episode: 3,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        show: {
          id: 456,
          title: 'Another Show',
          overview: 'Another overview',
          poster_path: '/another.jpg',
          backdrop_path: '/another-bg.jpg',
          first_air_date: '2023-02-01',
          vote_average: 7.5,
          genre_ids: [35],
          tmdb_id: 456
        }
      },
      action: 'started_show',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    }
  ];

  const mockOnShowPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recent activities correctly', () => {
    const { getByText } = render(
      <RecentlyWatched 
        activities={mockActivities}
        onShowPress={mockOnShowPress}
        maxItems={3}
      />
    );

    expect(getByText('📈 Recent Activity')).toBeTruthy();
    expect(getByText('Watched S2E5 "Test Episode" of Test Show')).toBeTruthy();
    expect(getByText('Started watching Another Show')).toBeTruthy();
  });

  it('respects maxItems prop', () => {
    const { queryByText } = render(
      <RecentlyWatched 
        activities={mockActivities}
        onShowPress={mockOnShowPress}
        maxItems={1}
      />
    );

    expect(queryByText('Watched S2E5 "Test Episode" of Test Show')).toBeTruthy();
    expect(queryByText('Started watching Another Show')).toBeFalsy();
  });

  it('calls onShowPress when activity is tapped', () => {
    const { getByText } = render(
      <RecentlyWatched 
        activities={mockActivities}
        onShowPress={mockOnShowPress}
        maxItems={3}
      />
    );

    const activity = getByText('Watched S2E5 "Test Episode" of Test Show');
    fireEvent.press(activity);

    expect(mockOnShowPress).toHaveBeenCalledWith(123);
  });

  it('renders empty state when no activities', () => {
    const { getByText } = render(
      <RecentlyWatched 
        activities={[]}
        onShowPress={mockOnShowPress}
        maxItems={3}
      />
    );

    expect(getByText('📈 Recent Activity')).toBeTruthy();
    expect(getByText('Your recent viewing activity will appear here.')).toBeTruthy();
  });

  it('formats timestamps correctly', () => {
    const { getByText } = render(
      <RecentlyWatched 
        activities={mockActivities}
        onShowPress={mockOnShowPress}
        maxItems={3}
      />
    );

    // Check for relative time display
    expect(getByText('30m ago')).toBeTruthy();
    expect(getByText('1h ago')).toBeTruthy();
  });
});
