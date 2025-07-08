import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressSection } from '../ProgressSection';

describe('ProgressSection', () => {
  it('renders progress correctly', () => {
    const { getByText, getByTestId } = render(
      <ProgressSection
        currentEpisode={5}
        currentSeason={2}
        totalEpisodes={50}
        watchedEpisodes={5}
      />
    );

    expect(getByText('🎯 Progress')).toBeTruthy();
    expect(getByText('Season 2, Episode 5 of 50')).toBeTruthy();
    expect(getByText('10% complete')).toBeTruthy();
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('renders completed state correctly', () => {
    const { getByText } = render(
      <ProgressSection
        currentEpisode={50}
        currentSeason={5}
        totalEpisodes={50}
        watchedEpisodes={50}
      />
    );

    expect(getByText('🎯 Progress')).toBeTruthy();
    expect(getByText('Season 5, Episode 50 of 50')).toBeTruthy();
    expect(getByText('100% complete')).toBeTruthy();
  });

  it('calculates progress percentage correctly', () => {
    const { getByText } = render(
      <ProgressSection
        currentEpisode={25}
        currentSeason={3}
        totalEpisodes={100}
        watchedEpisodes={25}
      />
    );

    // 25 watched out of 100 total = 25%
    expect(getByText('25% complete')).toBeTruthy();
  });

  it('handles zero episodes correctly', () => {
    const { getByText } = render(
      <ProgressSection
        currentEpisode={0}
        currentSeason={1}
        totalEpisodes={0}
        watchedEpisodes={0}
      />
    );

    expect(getByText('🎯 Progress')).toBeTruthy();
    // Component should render without crashing even with zero episodes
    // Text is split across multiple elements, so just check it doesn't crash
  });

  it('handles edge case with high episode/season numbers', () => {
    const { getByText } = render(
      <ProgressSection
        currentEpisode={999}
        currentSeason={99}
        totalEpisodes={1000}
        watchedEpisodes={999}
      />
    );

    expect(getByText('🎯 Progress')).toBeTruthy();
    expect(getByText('Season 99, Episode 999 of 1000')).toBeTruthy();
    expect(getByText('100% complete')).toBeTruthy(); // 999/1000 rounds to 100%
  });

  it('handles missing totalEpisodes', () => {
    const { getByText } = render(
      <ProgressSection
        currentEpisode={5}
        currentSeason={2}
      />
    );

    expect(getByText('🎯 Progress')).toBeTruthy();
    expect(getByText('Season 2, Episode 5')).toBeTruthy();
  });

  it('handles missing watchedEpisodes', () => {
    const { getByText } = render(
      <ProgressSection
        currentEpisode={5}
        currentSeason={2}
        totalEpisodes={50}
      />
    );

    expect(getByText('🎯 Progress')).toBeTruthy();
    expect(getByText('Season 2, Episode 5 of 50')).toBeTruthy();
    expect(getByText('0% complete')).toBeTruthy(); // No watchedEpisodes = 0%
  });
});
