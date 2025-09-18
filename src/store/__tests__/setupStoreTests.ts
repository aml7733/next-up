import '@testing-library/jest-native/extend-expect';

// Suppress react-test-renderer deprecation warnings
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0];
  
  // Suppress react-test-renderer deprecation warnings
  if (typeof message === 'string' && message.includes('react-test-renderer is deprecated')) {
    return;
  }
  
  // Allow all other console.error messages
  originalConsoleError(...args);
};

// Define global variables for React Native/Expo
(global as any).__DEV__ = false;

// Mock react-native-paper components as React components
jest.mock('react-native-paper', () => {
  const React = require('react');
  
  return {
    Button: React.forwardRef((props: any, ref: any) => 
      React.createElement('Button', { ...props, ref, testID: props.testID })
    ),
    Text: React.forwardRef((props: any, ref: any) => 
      React.createElement('Text', { ...props, ref, testID: props.testID })
    ),
    View: React.forwardRef((props: any, ref: any) => 
      React.createElement('View', { ...props, ref, testID: props.testID })
    ),
    ActivityIndicator: React.forwardRef((props: any, ref: any) => 
      React.createElement('ActivityIndicator', { ...props, ref, testID: props.testID })
    ),
    PaperProvider: ({ children }: { children: React.ReactNode }) => children,
    Portal: ({ children }: { children: React.ReactNode }) => children,
    Card: Object.assign(
      React.forwardRef((props: any, ref: any) => 
        React.createElement('Card', { ...props, ref, testID: props.testID })
      ),
      {
        Title: React.forwardRef((props: any, ref: any) => 
          React.createElement('CardTitle', { ...props, ref, testID: props.testID })
        ),
        Content: React.forwardRef((props: any, ref: any) => 
          React.createElement('CardContent', { ...props, ref, testID: props.testID })
        ),
      }
    ),
    Avatar: {
      Text: React.forwardRef((props: any, ref: any) => 
        React.createElement('AvatarText', { ...props, ref, testID: props.testID })
      ),
    },
    TextInput: React.forwardRef((props: any, ref: any) => 
      React.createElement('TextInput', { ...props, ref, testID: props.testID })
    ),
    ScrollView: React.forwardRef((props: any, ref: any) => 
      React.createElement('ScrollView', { ...props, ref, testID: props.testID })
    ),
    useTheme: () => ({
      colors: {
        primary: '#6200ee',
        surface: '#ffffff',
        background: '#f6f6f6',
        onSurfaceVariant: '#666666',
      },
    }),
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

jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: React.forwardRef((props: any, ref: any) => 
      React.createElement('Image', { ...props, ref, testID: props.testID })
    ),
  };
});

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => 
    React.createElement('MaterialCommunityIcons', { ...props, ref, testID: props.testID })
  );
});

// Mock services - but NOT the stores (that's the key difference from setupTests.ts)
jest.mock('../../services/tmdb', () => ({
  tmdbService: {
    searchShows: jest.fn(),
    getShowDetails: jest.fn(),
    getShowCredits: jest.fn(),
    getPopularShows: jest.fn(),
    getTrendingShows: jest.fn(),
  },
}));

// Mock database service
jest.mock('../../services/database', () => ({
  localDB: {
    init: jest.fn(),
    createUser: jest.fn(),
    getUserByUsername: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    addShow: jest.fn(),
    getShowById: jest.fn(),
    searchShows: jest.fn(),
    addUserShow: jest.fn(),
    getUserShows: jest.fn(),
    getUserShow: jest.fn(),
    updateUserShow: jest.fn(),
    updateUserShowStatus: jest.fn(),
    updateUserShowProgress: jest.fn(),
    deleteUserShow: jest.fn(),
    cacheShow: jest.fn(),
    getShow: jest.fn(),
    searchCachedShows: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
    // Episode tracking additions
    markEpisodeWatched: jest.fn(),
    getWatchedEpisodes: jest.fn(),
    updateUserShowDerivedFields: jest.fn(),
    computeContiguousPointer: jest.fn((watched: { season_number: number; episode_number: number }[], currentSeason: number, currentEpisode: number) => {
      if (!watched.length) return { season: currentSeason, episode: currentEpisode };
      // Ensure ordered
      const ordered = [...watched].sort((a,b)=> a.season_number - b.season_number || a.episode_number - b.episode_number);
      let expectedSeason = 1;
      let expectedEpisode = 1;
      let pointer = { season: currentSeason, episode: currentEpisode };
      for (const w of ordered) {
        if (w.season_number === expectedSeason && w.episode_number === expectedEpisode) {
          pointer = { season: w.season_number, episode: w.episode_number };
          expectedEpisode += 1;
        } else if (w.season_number === expectedSeason && w.episode_number > expectedEpisode) {
          break; // gap
        } else if (w.season_number > expectedSeason) {
          break; // cannot advance without season length knowledge
        }
      }
      return pointer;
    }),
  },
}));
