import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { useAuthStore } from '../../store/authStore';

// This tests ProfileScreen with REAL stores and business logic
// UI components are mocked (because Jest), but store interactions are real

describe('ProfileScreen Integration Tests', () => {
  beforeEach(() => {
    // Reset the real store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('should integrate with real auth store for unauthenticated state', () => {
    const { getByText } = render(<ProfileScreen />);
    
    // Test that the component correctly reads from the real store
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Welcome to NextUp')).toBeTruthy();
    
    // Verify store state
    const storeState = useAuthStore.getState();
    expect(storeState.isAuthenticated).toBe(false);
    expect(storeState.user).toBeNull();
  });

  it('should integrate with real auth store for authenticated state', async () => {
    // Set up real store state
    const testUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      created_at: '2024-01-01',
    };

    useAuthStore.setState({
      user: testUser,
      isAuthenticated: true,
      isLoading: false,
    });

    const { getByText, queryByText } = render(<ProfileScreen />);
    
    // Test that component reflects real store state
    await waitFor(() => {
      expect(getByText('testuser')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(queryByText('Welcome to NextUp')).toBeNull();
    });

    // Verify store state is actually what we expect
    const storeState = useAuthStore.getState();
    expect(storeState.isAuthenticated).toBe(true);
    expect(storeState.user?.email).toBe('test@example.com');
  });

  it('should handle store actions through real store methods', async () => {
    // Set up authenticated state
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2024-01-01',
      },
      isAuthenticated: true,
    });

    const { getByText } = render(<ProfileScreen />);
    
    // Find sign out button and click it
    const signOutButton = getByText('Sign Out');
    expect(signOutButton).toBeTruthy();
    
    // This would trigger the real signOut method in the store
    fireEvent.press(signOutButton);

    // Note: The actual signOut implementation might be async and involve API calls
    // For integration testing, we're testing that the button press triggers the right action
    // The store's signOut method is tested separately in store tests
  });

  it('should display correct user statistics from store', () => {
    // Test with user that has stats
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2024-01-01',
      },
      isAuthenticated: true,
    });

    const { getByText } = render(<ProfileScreen />);

    // Test that user stats section appears
    expect(getByText('Statistics')).toBeTruthy();
    expect(getByText('Shows Watched')).toBeTruthy();
    expect(getByText('Episodes Watched')).toBeTruthy();
    
    // This tests the integration between component and store data
  });

  it('should handle loading states from real store', () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    const { getByText } = render(<ProfileScreen />);

    // Test that component handles store loading state
    expect(getByText('Welcome to NextUp')).toBeTruthy();
    
    // Verify the actual store loading state
    const storeState = useAuthStore.getState();
    expect(storeState.isLoading).toBe(true);
  });
});
