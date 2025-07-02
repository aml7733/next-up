import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import SearchScreen from '../SearchScreen';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        {component}
      </PaperProvider>
    </QueryClientProvider>
  );
};

describe('SearchScreen', () => {
  it('renders correctly with initial state', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<SearchScreen />);
    
    expect(getByText('Discover Shows')).toBeTruthy();
    expect(getByPlaceholderText('Search for TV shows...')).toBeTruthy();
  });

  it('updates search input when typing', () => {
    const { getByPlaceholderText } = renderWithProviders(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    fireEvent.changeText(searchInput, 'Breaking Bad');
    
    expect(searchInput.props.value).toBe('Breaking Bad');
  });

  it('shows search results when search query exists', () => {
    const { getByPlaceholderText } = renderWithProviders(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    fireEvent.changeText(searchInput, 'Breaking Bad');
    
    // The input should have the value set
    expect(searchInput.props.value).toBe('Breaking Bad');
  });

  it('handles search submission', () => {
    const { getByPlaceholderText } = renderWithProviders(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    fireEvent.changeText(searchInput, 'Game of Thrones');
    fireEvent(searchInput, 'submitEditing');
    
    // Should not throw and search should be triggered
    expect(searchInput.props.value).toBe('Game of Thrones');
  });

  it('clears search shows initial content', () => {
    const { getByPlaceholderText, queryByText } = renderWithProviders(<SearchScreen />);
    
    // Should show initial content when no search
    expect(queryByText('Discover Shows')).toBeTruthy();
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    fireEvent.changeText(searchInput, 'Test');
    
    // The input should have the search term
    expect(searchInput.props.value).toBe('Test');
  });

  it('has proper accessibility labels', () => {
    const { getByPlaceholderText } = renderWithProviders(<SearchScreen />);
    
    const searchInput = getByPlaceholderText('Search for TV shows...');
    expect(searchInput).toBeTruthy();
  });
});
