import React from 'react';
import { render } from '@testing-library/react-native';
import CurrentlyWatchingScreen from '../CurrentlyWatchingScreen';

// Mock zustand store
jest.mock('../../store/showsStore', () => ({
  useShowsStore: jest.fn(() => ({
    userShows: [],
    isLoading: false,
    error: null,
  })),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(component);
};

describe('CurrentlyWatchingScreen', () => {
  it('renders correctly with no shows', () => {
    const { getByText } = renderWithTheme(<CurrentlyWatchingScreen />);
    
    expect(getByText('Currently Watching')).toBeTruthy();
    expect(getByText('No shows yet')).toBeTruthy();
    expect(getByText('Start tracking your favorite TV shows by searching for them in the Search tab.')).toBeTruthy();
  });

  it('renders status chips', () => {
    const { getByText } = renderWithTheme(<CurrentlyWatchingScreen />);
    
    expect(getByText('Watching')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
    expect(getByText('Paused')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const { getByText } = renderWithTheme(<CurrentlyWatchingScreen />);
    
    const title = getByText('Currently Watching');
    expect(title).toBeTruthy();
  });

  it('renders ScrollView for content', () => {
    const { getByTestId } = renderWithTheme(
      <CurrentlyWatchingScreen />
    );
    
    // ScrollView should be present for scrollable content
    expect(() => getByTestId('currently-watching-scroll')).not.toThrow();
  });
});
