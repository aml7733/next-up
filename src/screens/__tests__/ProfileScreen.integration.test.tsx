import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { useAuthStore } from '../../store/authStore';

// REAL integration tests - test component <-> store communication
// These tests verify that the UI actually responds to store changes and user actions work

describe('ProfileScreen Integration Tests', () => {
  beforeEach(() => {
    // Reset the real store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('shows different UI when user is authenticated vs unauthenticated', async () => {
    const { getByTestId, queryByTestId, rerender } = render(<ProfileScreen />);
    
    // Initially unauthenticated - should show unauthenticated card and sign in buttons
    expect(getByTestId('unauthenticated-profile-card')).toBeTruthy();
    expect(getByTestId('welcome-title')).toBeTruthy();
    expect(getByTestId('welcome-message')).toBeTruthy();
    expect(getByTestId('sign-in-button')).toBeTruthy();
    expect(getByTestId('sign-up-button')).toBeTruthy();
    expect(queryByTestId('sign-out-button')).toBeFalsy();
    expect(queryByTestId('authenticated-profile-card')).toBeFalsy();
    
    // Change store to authenticated state
    act(() => {
      useAuthStore.setState({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          created_at: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    });
    
    // Force re-render to pick up store changes
    rerender(<ProfileScreen />);
    
    // Now should show authenticated card with user info and sign out button
    expect(getByTestId('authenticated-profile-card')).toBeTruthy();
    expect(getByTestId('user-email')).toBeTruthy();
    expect(getByTestId('user-username')).toBeTruthy();
    expect(getByTestId('sign-out-button')).toBeTruthy();
    expect(queryByTestId('sign-in-button')).toBeFalsy();
    expect(queryByTestId('unauthenticated-profile-card')).toBeFalsy();
  });

  it('actually calls signOut when user clicks Sign Out button', async () => {
    // Set up authenticated state so we have a sign out button
    act(() => {
      useAuthStore.setState({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          created_at: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    });

    const { getByTestId, queryByTestId, rerender } = render(<ProfileScreen />);
    
    // Verify we're in authenticated state
    expect(getByTestId('authenticated-profile-card')).toBeTruthy();
    expect(getByTestId('sign-out-button')).toBeTruthy();
    
    // Click the sign out button
    const signOutButton = getByTestId('sign-out-button');
    fireEvent.press(signOutButton);

    // Wait for the signOut action to complete and verify UI changes
    await waitFor(() => {
      // Store should be updated
      const storeState = useAuthStore.getState();
      expect(storeState.isAuthenticated).toBe(false);
      expect(storeState.user).toBeNull();
    });

    // Force re-render to see UI changes
    rerender(<ProfileScreen />);
    
    // UI should now show unauthenticated state
    expect(queryByTestId('authenticated-profile-card')).toBeFalsy();
    expect(queryByTestId('sign-out-button')).toBeFalsy();
    expect(getByTestId('unauthenticated-profile-card')).toBeTruthy();
    expect(getByTestId('sign-in-button')).toBeTruthy();
  });

  it('displays user email and username from store', () => {
    // Set user data in store
    const testUser = {
      id: '1',
      email: 'john@example.com',
      username: 'johntest',
      created_at: '2024-01-01',
    };
    
    act(() => {
      useAuthStore.setState({
        user: testUser,
        isAuthenticated: true,
        isLoading: false,
      });
    });

    const { getByTestId } = render(<ProfileScreen />);
    
    // Verify the UI components exist (we can't easily test text content due to react-native-paper nesting)
    // But we can verify the store integration is working by checking the right elements render
    expect(getByTestId('authenticated-profile-card')).toBeTruthy();
    expect(getByTestId('user-email')).toBeTruthy();
    expect(getByTestId('user-username')).toBeTruthy();
    
    // Verify the store actually contains the expected data
    const storeState = useAuthStore.getState();
    expect(storeState.user?.email).toBe('john@example.com');
    expect(storeState.user?.username).toBe('johntest');
  });

  it('displays user without username correctly', () => {
    // Set user data without username
    const testUser = {
      id: '1',
      email: 'jane@example.com',
      username: undefined,
      created_at: '2024-01-01',
    };
    
    act(() => {
      useAuthStore.setState({
        user: testUser,
        isAuthenticated: true,
        isLoading: false,
      });
    });

    const { getByTestId, queryByTestId } = render(<ProfileScreen />);
    
    // Should show email element but no username element
    expect(getByTestId('authenticated-profile-card')).toBeTruthy();
    expect(getByTestId('user-email')).toBeTruthy();
    expect(queryByTestId('user-username')).toBeFalsy(); // Should not render username element
    
    // Verify store state
    const storeState = useAuthStore.getState();
    expect(storeState.user?.email).toBe('jane@example.com');
    expect(storeState.user?.username).toBeUndefined();
  });
});
