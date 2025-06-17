import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ShowDetailsScreen from '../ShowDetailsScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
} as any;

const mockRoute = {
  params: { showId: 123 },
} as any;

const renderWithTheme = (component: React.ReactElement) => {
  return render(component);
};

describe('ShowDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with mock show data', () => {
    const { getByText } = renderWithTheme(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    expect(getByText('Sample Show')).toBeTruthy();
    expect(getByText('2023')).toBeTruthy();
    expect(getByText('⭐ 8.5')).toBeTruthy();
    expect(getByText('Add to My List')).toBeTruthy();
    expect(getByText('Mark as Watched')).toBeTruthy();
  });

  it('shows overview section', () => {
    const { getByText } = renderWithTheme(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('This is a sample show overview. In the actual implementation, this will be fetched from TMDB.')).toBeTruthy();
  });

  it('shows genres section', () => {
    const { getByText } = renderWithTheme(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    expect(getByText('Genres')).toBeTruthy();
    expect(getByText('Drama')).toBeTruthy();
    expect(getByText('Comedy')).toBeTruthy();
    expect(getByText('Action')).toBeTruthy();
  });

  it('handles add to list button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { getByText } = renderWithTheme(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    const addButton = getByText('Add to My List');
    fireEvent.press(addButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Add show to list:', 123);
    
    consoleSpy.mockRestore();
  });

  it('displays correct year from air date', () => {
    const { getByText } = renderWithTheme(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    expect(getByText('2023')).toBeTruthy();
  });

  it('displays rating with correct format', () => {
    const { getByText } = renderWithTheme(
      <ShowDetailsScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    expect(getByText('⭐ 8.5')).toBeTruthy();
  });

  it('renders with different showId from route params', () => {
    const differentRoute = {
      params: { showId: 456 },
    } as any;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { getByText } = renderWithTheme(
      <ShowDetailsScreen route={differentRoute} navigation={mockNavigation} />
    );
    
    const addButton = getByText('Add to My List');
    fireEvent.press(addButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Add show to list:', 456);
    
    consoleSpy.mockRestore();
  });
});
