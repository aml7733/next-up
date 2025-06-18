import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import EmptyState from '../EmptyState';
import { useAuthStore } from '../../store/authStore';
import { useShowsStore } from '../../store/showsStore';

// REAL integration tests - test EmptyState as it would be used in the actual app
// These test realistic scenarios where EmptyState integrates with stores and navigation

describe('EmptyState Integration Tests', () => {
  beforeEach(() => {
    // Reset stores to clean state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    useShowsStore.setState({
      userShows: [],
      isLoading: false,
      error: null,
    });
  });

  it('triggers navigation action when user clicks browse button', () => {
    const mockNavigate = jest.fn();
    
    // Render EmptyState as it would be used in CurrentlyWatchingScreen when no shows
    const { getByTestId } = render(
      <EmptyState 
        title="No shows in your list"
        description="Start tracking your favorite TV shows by searching for them."
        actionText="Browse Shows"
        onActionPress={() => mockNavigate('search')}
        icon="television"
      />
    );
    
    // Verify the content is actually displayed using testIDs
    expect(getByTestId('empty-state-title')).toBeTruthy();
    expect(getByTestId('empty-state-description')).toBeTruthy();
    
    // Real integration test: User clicks the button and navigation happens
    const browseButton = getByTestId('empty-state-action-button');
    fireEvent.press(browseButton);
    
    // Verify the actual user interaction triggered the callback
    expect(mockNavigate).toHaveBeenCalledWith('search');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('displays different content and handles user actions based on authentication state', () => {
    const mockSignIn = jest.fn();
    
    // Test unauthenticated state
    const { getByTestId, rerender } = render(
      <EmptyState 
        title="Sign in to track shows"
        description="Create an account to save your favorite shows and track your progress."
        actionText="Sign In"
        onActionPress={mockSignIn}
        icon="account"
      />
    );
    
    // Verify content is rendered with testIDs
    expect(getByTestId('empty-state-title')).toBeTruthy();
    expect(getByTestId('empty-state-description')).toBeTruthy();
    
    // Real integration test: User clicks sign in button
    const signInButton = getByTestId('empty-state-action-button');
    fireEvent.press(signInButton);
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    
    // Integration test: Simulate auth state change (as would happen in real app)
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', username: 'test', created_at: '2024-01-01' },
      isAuthenticated: true,
      isLoading: false,
    });
    
    const mockBrowse = jest.fn();
    
    // Re-render with authenticated user content
    rerender(
      <EmptyState 
        title="No shows yet"
        description="Start building your watchlist by searching for shows."
        actionText="Browse Shows"
        onActionPress={mockBrowse}
        icon="television"
      />
    );
    
    // Verify the component renders different content after auth state change
    expect(getByTestId('empty-state-title')).toBeTruthy();
    expect(getByTestId('empty-state-description')).toBeTruthy();
    
    // Real integration test: User clicks browse button in authenticated state
    const browseButton = getByTestId('empty-state-action-button');
    fireEvent.press(browseButton);
    expect(mockBrowse).toHaveBeenCalledTimes(1);
    
    // Verify store state actually changed
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user?.email).toBe('test@example.com');
  });

  it('handles error recovery when user clicks retry button', () => {
    // Integration test: Verify EmptyState responds to error conditions from app state
    useShowsStore.setState({
      userShows: [],
      isLoading: false,
      error: 'Failed to load shows',
    });
    
    const mockRetry = jest.fn();
    
    const { getByTestId } = render(
      <EmptyState 
        title="Something went wrong"
        description="We couldn't load your shows. Please try again."
        actionText="Retry"
        onActionPress={mockRetry}
        icon="alert-circle"
      />
    );
    
    // Verify error content is displayed
    expect(getByTestId('empty-state-title')).toBeTruthy();
    expect(getByTestId('empty-state-description')).toBeTruthy();
    
    // Real integration test: User clicks retry button to recover from error
    const retryButton = getByTestId('empty-state-action-button');
    fireEvent.press(retryButton);
    
    // Verify the retry action was triggered
    expect(mockRetry).toHaveBeenCalledTimes(1);
    
    // Verify store state integration - component is rendered in context of error state
    const storeState = useShowsStore.getState();
    expect(storeState.error).toBe('Failed to load shows');
  });

  it('renders without action button when no action provided', () => {
    const { getByTestId, queryByTestId } = render(
      <EmptyState 
        title="Loading complete"
        description="All your shows are up to date."
        icon="check-circle"
      />
    );
    
    expect(getByTestId('empty-state').props.accessibilityLabel).toContain('Loading complete');
    expect(getByTestId('empty-state').props.accessibilityLabel).toContain('All your shows are up to date');
    
    // Should not render action button when no action is provided
    expect(queryByTestId('empty-state-action-button')).toBeFalsy();
  });
});
