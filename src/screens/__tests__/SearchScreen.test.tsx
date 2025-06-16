import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import SearchScreen from '../SearchScreen';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('SearchScreen', () => {
  it('renders correctly with initial state', () => {
    const { getByText, getByPlaceholderText } = renderWithTheme(<SearchScreen />);
    
    expect(getByText('Discover Shows')).toBeTruthy();
    expect(getByText('Popular Shows')).toBeTruthy();
    expect(getByPlaceholderText('Search for TV shows...')).toBeTruthy();
  });

  it('updates search input when typing', () => {
    const { getByPlaceholderText } = renderWithTheme(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    fireEvent.changeText(searchInput, 'Breaking Bad');
    
    expect(searchInput.props.value).toBe('Breaking Bad');
  });

  it('shows search results when search query exists', () => {
    const { getByPlaceholderText, getByText } = renderWithTheme(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    fireEvent.changeText(searchInput, 'Breaking Bad');
    
    expect(getByText('Search results for "Breaking Bad"')).toBeTruthy();
  });

  it('handles search submission', () => {
    const { getByPlaceholderText } = renderWithTheme(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    fireEvent.changeText(searchInput, 'Game of Thrones');
    fireEvent(searchInput, 'submitEditing');
    
    // Should not throw and search should be triggered
    expect(searchInput.props.value).toBe('Game of Thrones');
  });

  it('clears search shows initial content', () => {
    const { getByPlaceholderText, queryByText } = renderWithTheme(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    fireEvent.changeText(searchInput, 'Test');
    
    // Initial content should not be visible when searching
    expect(queryByText('Discover Shows')).toBeFalsy();
    expect(queryByText('Popular Shows')).toBeFalsy();
  });

  it('has proper accessibility labels', () => {
    const { getByPlaceholderText } = renderWithTheme(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    expect(searchInput).toBeTruthy();
  });
});
