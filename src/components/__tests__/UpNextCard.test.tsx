import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UpNextCard } from '../UpNextCard';
import { Episode } from '../../types';

// Mock the TMDB service
jest.mock('../../services/tmdb', () => ({
  tmdbService: {
    getImageUrl: jest.fn((path: string, size: string) => 
      path ? `https://image.tmdb.org/t/p/${size}${path}` : null
    ),
  },
}));

describe('UpNextCard', () => {
  const mockEpisode: Episode = {
    id: 1,
    episode_number: 5,
    season_number: 2,
    name: 'The One with George Stephanopoulos',
    overview: 'Monica and Rachel get into a fight and split the group.',
    air_date: '1994-10-13',
    still_path: '/episode.jpg'
  };

  const mockOnMarkWatched = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders episode information correctly', () => {
    const { getByText } = render(
      <UpNextCard 
        episode={mockEpisode} 
        onMarkWatched={mockOnMarkWatched} 
      />
    );

    expect(getByText('📍 Up Next')).toBeTruthy();
    expect(getByText('S2E5: "The One with George Stephanopoulos"')).toBeTruthy();
    expect(getByText('Monica and Rachel get into a fight and split the group.')).toBeTruthy();
    expect(getByText('▶️ Mark Watched')).toBeTruthy();
  });

  it('renders loading state correctly', () => {
    const { getByText } = render(
      <UpNextCard 
        episode={mockEpisode} 
        onMarkWatched={mockOnMarkWatched} 
        isLoading={true}
      />
    );

    expect(getByText('📍 Up Next')).toBeTruthy();
    // Button should still be present but disabled when loading
    expect(getByText('▶️ Mark Watched')).toBeTruthy();
  });

  it('renders null episode state correctly', () => {
    const { getByText, queryByText } = render(
      <UpNextCard 
        episode={null} 
        onMarkWatched={mockOnMarkWatched} 
      />
    );

    expect(getByText('📍 Up Next')).toBeTruthy();
    expect(getByText('All caught up! 🎉')).toBeTruthy();
    expect(queryByText('▶️ Mark Watched')).toBeFalsy();
  });

  it('calls onMarkWatched when button is pressed', () => {
    const { getByText } = render(
      <UpNextCard 
        episode={mockEpisode} 
        onMarkWatched={mockOnMarkWatched} 
      />
    );

    const markButton = getByText('▶️ Mark Watched');
    fireEvent.press(markButton);

    expect(mockOnMarkWatched).toHaveBeenCalledTimes(1);
  });

  it('handles episode without overview', () => {
    const episodeWithoutOverview = {
      ...mockEpisode,
      overview: ''
    };

    const { getByText, queryByText } = render(
      <UpNextCard 
        episode={episodeWithoutOverview} 
        onMarkWatched={mockOnMarkWatched} 
      />
    );

    expect(getByText('S2E5: "The One with George Stephanopoulos"')).toBeTruthy();
    expect(queryByText('Monica and Rachel get into a fight and split the group.')).toBeFalsy();
  });

  it('handles episode without still image', () => {
    const episodeWithoutStill = {
      ...mockEpisode,
      still_path: undefined
    };

    const { getByText } = render(
      <UpNextCard 
        episode={episodeWithoutStill} 
        onMarkWatched={mockOnMarkWatched} 
      />
    );

    expect(getByText('S2E5: "The One with George Stephanopoulos"')).toBeTruthy();
    // Should still render the card without breaking
  });

  it('formats episode title correctly for single digit numbers', () => {
    const episodeWithSingleDigits = {
      ...mockEpisode,
      season_number: 1,
      episode_number: 3
    };

    const { getByText } = render(
      <UpNextCard 
        episode={episodeWithSingleDigits} 
        onMarkWatched={mockOnMarkWatched} 
      />
    );

    expect(getByText('S1E3: "The One with George Stephanopoulos"')).toBeTruthy();
  });

  it('renders episode title and content correctly', () => {
    const { getByText } = render(
      <UpNextCard 
        episode={mockEpisode} 
        onMarkWatched={mockOnMarkWatched} 
      />
    );

    // Verify the main components are rendered
    expect(getByText('📍 Up Next')).toBeTruthy();
    expect(getByText('S2E5: "The One with George Stephanopoulos"')).toBeTruthy();
  });
});
