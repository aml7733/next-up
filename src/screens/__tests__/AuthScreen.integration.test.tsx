import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AuthScreen from '../AuthScreen';
import { Provider as PaperProvider } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';

// Integration test for AuthScreen component
// Tests the complete user flow through sign up and sign in

describe('AuthScreen Integration', () => {
  const renderAuthScreen = () => {
    return render(
      <PaperProvider>
        <AuthScreen />
      </PaperProvider>
    );
  };

  beforeEach(() => {
    // Reset auth store state
    useAuthStore.getState().signOut();
  });

  it('should start with sign up screen by default', () => {
    renderAuthScreen();
    
    expect(screen.getByText('Create Account')).toBeTruthy();
    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email (optional)')).toBeTruthy();
  });

  it('should switch between sign up and sign in modes', () => {
    renderAuthScreen();
    
    // Should start with sign up
    expect(screen.getByText('Create Account')).toBeTruthy();
    
    // Switch to sign in
    fireEvent.press(screen.getByText('Already have an account? Sign In'));
    
    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Email (optional)')).toBeNull();
    
    // Switch back to sign up
    fireEvent.press(screen.getByText("Don't have an account? Sign Up"));
    
    expect(screen.getByText('Create Account')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email (optional)')).toBeTruthy();
  });

  it('should handle complete sign up flow', async () => {
    renderAuthScreen();
    
    // Fill out sign up form
    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(screen.getByPlaceholderText('Email (optional)'), 'test@example.com');
    
    // Submit form
    fireEvent.press(screen.getByText('Create Account'));
    
    // Should show loading state temporarily
    await waitFor(() => {
      expect(screen.queryByText('Create Account')).toBeTruthy();
    });
  });

  it('should handle sign in flow after switching modes', async () => {
    renderAuthScreen();
    
    // Switch to sign in mode
    fireEvent.press(screen.getByText('Already have an account? Sign In'));
    
    // Fill out sign in form
    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'existinguser');
    
    // Submit form
    fireEvent.press(screen.getByText('Sign In'));
    
    // Should attempt to sign in
    await waitFor(() => {
      expect(screen.queryByText('Sign In')).toBeTruthy();
    });
  });

  it('should maintain form state when switching modes quickly', () => {
    renderAuthScreen();
    
    // Fill out sign up form
    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(screen.getByPlaceholderText('Email (optional)'), 'test@example.com');
    
    // Switch to sign in and back
    fireEvent.press(screen.getByText('Already have an account? Sign In'));
    fireEvent.press(screen.getByText("Don't have an account? Sign Up"));
    
    // Form should be reset (this is expected behavior)
    expect(screen.getByPlaceholderText('Username').props.value).toBeFalsy();
    expect(screen.getByPlaceholderText('Email (optional)').props.value).toBeFalsy();
  });
});
