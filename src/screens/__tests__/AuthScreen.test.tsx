import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AuthScreen from '../AuthScreen';
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

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      signUp: jest.fn(),
      signIn: jest.fn(),
      isLoading: false,
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      signOut: jest.fn(),
      setUser: jest.fn(),
      initialize: jest.fn(),
    });
  });

  it('renders signup screen by default', () => {
    const { getAllByText } = renderWithTheme(<AuthScreen />);
    
    // SignUpScreen shows "Create Account"
    expect(getAllByText('Create Account').length).toBeGreaterThan(0);
  });

  it('switches from signup to signin when switch button is pressed', () => {
    const { getByTestId, getAllByText } = renderWithTheme(<AuthScreen />);
    
    // Should start with SignUpScreen
    expect(getAllByText('Create Account').length).toBeGreaterThan(0);
    
    // Press switch to sign in button
    const switchButton = getByTestId('switch-to-signin-button');
    fireEvent.press(switchButton);
    
    // Should now show SignInScreen
    expect(getAllByText('Welcome Back').length).toBeGreaterThan(0);
  });
});
