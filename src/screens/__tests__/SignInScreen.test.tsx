import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import SignInScreen from '../SignInScreen';
import { useAuthStore } from '../../store/authStore';

// Mock the auth store
jest.mock('../../store/authStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      {component}
    </PaperProvider>
  );
};

describe('SignInScreen', () => {
  const mockSignIn = jest.fn();
  const mockOnSwitchToSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      initialize: jest.fn(),
    });
  });

  it('renders correctly with initial state', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to continue tracking your shows')).toBeTruthy();
    expect(getByTestId('username-input')).toBeTruthy();
    expect(getByTestId('signin-button')).toBeTruthy();
    expect(getByTestId('switch-to-signup-button')).toBeTruthy();
  });

  it('updates username input when typing', () => {
    const { getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    fireEvent.changeText(usernameInput, 'testuser');
    
    expect(usernameInput.props.value).toBe('testuser');
  });

  it('enables sign in button when username is entered', () => {
    const { getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    const signInButton = getByTestId('signin-button');
    
    // Initially disabled
    expect(signInButton.props.accessibilityState.disabled).toBe(true);
    
    // Enter username
    fireEvent.changeText(usernameInput, 'testuser');
    
    // Should be enabled
    expect(signInButton.props.accessibilityState.disabled).toBe(false);
  });

  it('keeps sign in button disabled with only whitespace', () => {
    const { getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    const signInButton = getByTestId('signin-button');
    
    // Enter only whitespace
    fireEvent.changeText(usernameInput, '   ');
    
    // Should remain disabled
    expect(signInButton.props.accessibilityState.disabled).toBe(true);
  });

  it('shows error when trying to sign in without username', async () => {
    const { getByTestId, queryByText } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    
    // Try to submit without username using onSubmitEditing
    fireEvent(usernameInput, 'submitEditing');
    
    await waitFor(() => {
      // Check if error message appears
      const errorText = queryByText('Please enter your username');
      expect(errorText).toBeTruthy();
    });
    
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with trimmed username when form is valid', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    
    const { getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    const signInButton = getByTestId('signin-button');
    
    // Enter username with spaces
    fireEvent.changeText(usernameInput, '  testuser  ');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('testuser');
    });
  });

  it('shows error message when sign in fails', async () => {
    const errorMessage = 'User not found';
    mockSignIn.mockResolvedValue({ error: errorMessage });
    
    const { getByTestId, getByText } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    const signInButton = getByTestId('signin-button');
    
    fireEvent.changeText(usernameInput, 'nonexistentuser');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });

  it('clears error when user starts typing', async () => {
    mockSignIn.mockResolvedValue({ error: 'User not found' });
    
    const { getByTestId, getByText, queryByText } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    const signInButton = getByTestId('signin-button');
    
    // Trigger error
    fireEvent.changeText(usernameInput, 'baduser');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(getByText('User not found')).toBeTruthy();
    });
    
    // Start typing again
    fireEvent.changeText(usernameInput, 'gooduser');
    
    expect(queryByText('User not found')).toBeNull();
  });

  it('shows loading state during sign in', () => {
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      isLoading: true,
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      initialize: jest.fn(),
    });

    const { getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    const signInButton = getByTestId('signin-button');
    const switchButton = getByTestId('switch-to-signup-button');
    
    expect(usernameInput.props.editable).toBe(false);
    expect(signInButton.props.accessibilityState.disabled).toBe(true);
    expect(switchButton.props.accessibilityState.disabled).toBe(true);
  });

  it('calls onSwitchToSignUp when switch button is pressed', () => {
    const { getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const switchButton = getByTestId('switch-to-signup-button');
    fireEvent.press(switchButton);
    
    expect(mockOnSwitchToSignUp).toHaveBeenCalledTimes(1);
  });

  it('submits form when pressing enter on username input', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    
    const { getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent(usernameInput, 'submitEditing');
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('testuser');
    });
  });

  it('does not submit form when pressing enter with empty username', async () => {
    const { getByTestId } = renderWithTheme(
      <SignInScreen onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    
    const usernameInput = getByTestId('username-input');
    
    fireEvent(usernameInput, 'submitEditing');
    
    // Should show validation error instead of calling signIn
    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });
});
