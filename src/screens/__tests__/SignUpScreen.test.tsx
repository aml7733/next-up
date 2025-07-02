import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import SignUpScreen from '../SignUpScreen';
import { useAuthStore } from '../../store/authStore';

// Mock the auth store
jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      {component}
    </PaperProvider>
  );
};

describe('SignUpScreen', () => {
  const mockSignUp = jest.fn();
  const mockOnSwitchToSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      signUp: mockSignUp,
      isLoading: false,
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      initialize: jest.fn(),
    });
  });

  it('renders correctly with initial state', () => {
    const { getAllByText, getByText, getByTestId } = renderWithTheme(
      <SignUpScreen onSwitchToSignIn={mockOnSwitchToSignIn} />
    );
    
    expect(getAllByText('Create Account').length).toBeGreaterThan(0);
    expect(getByText('Get started tracking your shows')).toBeTruthy();
    expect(getByTestId('username-input')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('signup-button')).toBeTruthy();
    expect(getByTestId('switch-to-signin-button')).toBeTruthy();
  });

  it('updates username input when typing', () => {
    const { getByTestId } = renderWithTheme(
      <SignUpScreen onSwitchToSignIn={mockOnSwitchToSignIn} />
    );
    
    const usernameInput = getByTestId('username-input');
    fireEvent.changeText(usernameInput, 'testuser');
    
    expect(usernameInput.props.value).toBe('testuser');
  });

  it('enables sign up button when username is entered', () => {
    const { getByTestId } = renderWithTheme(
      <SignUpScreen onSwitchToSignIn={mockOnSwitchToSignIn} />
    );
    
    const usernameInput = getByTestId('username-input');
    const signUpButton = getByTestId('signup-button');
    
    // Initially disabled
    expect(signUpButton.props.accessibilityState.disabled).toBe(true);
    
    // Enter username
    fireEvent.changeText(usernameInput, 'testuser');
    
    // Should be enabled
    expect(signUpButton.props.accessibilityState.disabled).toBe(false);
  });

  it('calls onSwitchToSignIn when switch button is pressed', () => {
    const { getByTestId } = renderWithTheme(
      <SignUpScreen onSwitchToSignIn={mockOnSwitchToSignIn} />
    );
    
    const switchButton = getByTestId('switch-to-signin-button');
    fireEvent.press(switchButton);
    
    expect(mockOnSwitchToSignIn).toHaveBeenCalledTimes(1);
  });
});
