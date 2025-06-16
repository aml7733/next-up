import '@testing-library/jest-native/extend-expect';

// Mock react-native-paper components
jest.mock('react-native-paper', () => {
  const RealComponent = jest.requireActual('react-native-paper');
  const React = require('react');
  return {
    ...RealComponent,
    Portal: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock react-navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock zustand stores
jest.mock('../store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    setUser: jest.fn(),
  })),
}));

jest.mock('../store/showsStore', () => ({
  useShowsStore: jest.fn(() => ({
    userShows: [],
    isLoading: false,
    error: null,
    addShow: jest.fn(),
    updateShow: jest.fn(),
    removeShow: jest.fn(),
    setUserShows: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
  })),
}));
