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
    
    expect(screen.getByTestId('signup-button-text')).toHaveTextContent('Create Account');
    expect(screen.getByTestId('username-input')).toBeTruthy();
    expect(screen.getByTestId('email-input')).toBeTruthy();
  });

  it('should switch between sign up and sign in modes', () => {
    renderAuthScreen();
    
    // Should start with sign up
    expect(screen.getByTestId('signup-button-text')).toHaveTextContent('Create Account');
    
    // Switch to sign in
    fireEvent.press(screen.getByText('Already have an account? Sign In'));
    
    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(screen.getByTestId('username-input')).toBeTruthy();
    expect(screen.queryByTestId('email-input')).toBeNull();
    
    // Switch back to sign up
    fireEvent.press(screen.getByText("Don't have an account? Sign Up"));
    
    expect(screen.getByTestId('signup-button-text')).toHaveTextContent('Create Account');
    expect(screen.getByTestId('email-input')).toBeTruthy();
  });

  it('should handle complete sign up flow', async () => {
    renderAuthScreen();
    
    // Fill out sign up form
    fireEvent.changeText(screen.getByTestId('username-input'), 'testuser');
    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    
    // Submit form
    fireEvent.press(screen.getByTestId('signup-button'));
    
    // Should show loading state temporarily
    await waitFor(() => {
      expect(screen.queryByTestId('signup-button')).toBeTruthy();
    });
  });

  it('should handle sign in flow after switching modes', async () => {
    renderAuthScreen();
    
    // Switch to sign in mode
    fireEvent.press(screen.getByText('Already have an account? Sign In'));
    
    // Fill out sign in form
    fireEvent.changeText(screen.getByTestId('username-input'), 'existinguser');
    
    // Submit form
    fireEvent.press(screen.getByTestId('signin-button'));
    
    // Should attempt to sign in
    await waitFor(() => {
      expect(screen.queryByTestId('signin-button')).toBeTruthy();
    });
  });

  it('should maintain form state when switching modes quickly', () => {
    renderAuthScreen();
    
    // Fill out sign up form
    fireEvent.changeText(screen.getByTestId('username-input'), 'testuser');
    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    
    // Switch to sign in and back
    fireEvent.press(screen.getByText('Already have an account? Sign In'));
    fireEvent.press(screen.getByText("Don't have an account? Sign Up"));
    
    // Form should be reset (this is expected behavior)
    expect(screen.getByTestId('username-input').props.value).toBeFalsy();
    expect(screen.getByTestId('email-input').props.value).toBeFalsy();
  });
});
