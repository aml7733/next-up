import '@testing-library/jest-native/extend-expect';

// Minimal setup for integration tests - only mock what we absolutely must

// Mock expo modules that don't work in test environment
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

// Mock navigation (required for React Navigation)
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

// Mock services (external APIs should be mocked)
jest.mock('./services/supabase', () => ({
  supabase: {
    auth: {
      signInWithEmailAndPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('./services/tmdb', () => ({
  searchShows: jest.fn(),
  getShowDetails: jest.fn(),
}));

// Don't mock react-native-paper - use the real thing!
// Don't mock our stores - use the real thing!
