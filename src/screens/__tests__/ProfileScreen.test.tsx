import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';

// Mock the auth store
const mockSignOut = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(component);
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when user is not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      signOut: mockSignOut,
    });

    const { getByText } = renderWithTheme(<ProfileScreen />);
    
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Welcome to NextUp')).toBeTruthy();
    expect(getByText('Sign in to start tracking your favorite TV shows.')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  it('renders correctly when user is authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      created_at: '2024-01-01',
    };

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      signOut: mockSignOut,
    });

    const { getByText } = renderWithTheme(<ProfileScreen />);
    
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByText('@testuser')).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('renders user avatar with first letter of email', () => {
    const mockUser = {
      id: '1',
      email: 'john@example.com',
      created_at: '2024-01-01',
    };

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      signOut: mockSignOut,
    });

    const { getByText } = renderWithTheme(<ProfileScreen />);
    
    // Avatar should show 'J' (first letter of email)
    expect(getByText('J')).toBeTruthy();
  });

  it('shows stats section', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      signOut: mockSignOut,
    });

    const { getByText } = renderWithTheme(<ProfileScreen />);
    
    expect(getByText('Your Stats')).toBeTruthy();
    expect(getByText('Shows Watching')).toBeTruthy();
    expect(getByText('Episodes Watched')).toBeTruthy();
    expect(getByText('Shows Completed')).toBeTruthy();
  });

  it('calls signOut when sign out button is pressed', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      created_at: '2024-01-01',
    };

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      signOut: mockSignOut,
    });

    const { getByText } = renderWithTheme(<ProfileScreen />);
    
    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);
    
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('handles sign in button press', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      signOut: mockSignOut,
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { getByText } = renderWithTheme(<ProfileScreen />);
    
    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to sign in');
    
    consoleSpy.mockRestore();
  });

  it('handles sign up button press', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      signOut: mockSignOut,
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { getByText } = renderWithTheme(<ProfileScreen />);
    
    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to sign up');
    
    consoleSpy.mockRestore();
  });
});
