// Shared setup for both unit and integration tests
// This file contains mocks and setup that are needed for all test types

// Mock only the specific React Native components that cause ES module transform issues
jest.mock('react-native/src/private/components/HScrollViewNativeComponents', () => ({
  default: jest.fn(),
}));

jest.mock('react-native/src/private/specs_DEPRECATED/components/AndroidHorizontalScrollContentViewNativeComponent', () => ({
  __INTERNAL_VIEW_CONFIG: {},
  default: jest.fn(),
}));

jest.mock('react-native/src/private/specs_DEPRECATED/components/DebuggingOverlayNativeComponent', () => ({
  __INTERNAL_VIEW_CONFIG: {},
  default: jest.fn(),
}));

jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativePlatformConstantsIOS', () => ({
  getConstants: () => ({}),
  default: {},
}));

jest.mock('react-native/src/private/specs_DEPRECATED/components/RCTSafeAreaViewNativeComponent', () => ({
  __INTERNAL_VIEW_CONFIG: {},
  default: jest.fn(),
}));

// Mock expo modules
jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: React.forwardRef((props: any, ref: any) => 
      React.createElement('Image', { ...props, ref, testID: props.testID })
    ),
  };
});

// Mock @expo/vector-icons to avoid ES module dependency chain
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const MockIcon = React.forwardRef(({ name, size, color, testID, ...props }: any, ref: any) => 
    React.createElement('View', { testID, ref, ...props })
  );
  MockIcon.displayName = 'MockMaterialCommunityIcon';
  return MockIcon;
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const MockIcon = React.forwardRef(({ name, size, color, testID, ...props }: any, ref: any) => 
    React.createElement('View', { testID, ref, ...props })
  );
  
  return {
    MaterialCommunityIcons: MockIcon,
    Ionicons: MockIcon,
    AntDesign: MockIcon,
    Entypo: MockIcon,
    EvilIcons: MockIcon,
    Feather: MockIcon,
    FontAwesome: MockIcon,
    Foundation: MockIcon,
    MaterialIcons: MockIcon,
    Octicons: MockIcon,
    SimpleLineIcons: MockIcon,
    Zocial: MockIcon,
  };
});

import '@testing-library/jest-native/extend-expect';

// Suppress noisy console warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  
  if (message.includes('react-test-renderer is deprecated') ||
      message.includes('Tried to use the icon') ||
      message.includes('none of the required icon libraries are installed') ||
      message.includes('An error occurred in the') ||
      message.includes('Consider adding an error boundary') ||
      message.includes('error boundary to your tree to customize error handling')) {
    return;
  }
  originalConsoleWarn(...args);
};

// Mock external APIs that should be mocked in all test types
jest.mock('./services/tmdb', () => ({
  tmdbService: {
    searchShows: jest.fn().mockResolvedValue({ results: [], total_pages: 0 }),
    getShowDetails: jest.fn().mockResolvedValue({}),
    getPopularShows: jest.fn().mockResolvedValue({ results: [], total_pages: 0 }),
    getTrendingShows: jest.fn().mockResolvedValue({ results: [], total_pages: 0 }),
    getSeasonEpisodes: jest.fn().mockResolvedValue([]),
    getImageUrl: jest.fn().mockReturnValue('https://example.com/image.jpg'),
  },
}));

// NOTE: Removed broad global mock of './services/database'.
// Rationale:
// - Global full mocks hid real logic and reduced test confidence.
// - Tests should explicitly mock only what they rely on.
// Light helper below allows targeted mocking when needed.
// (Kept here instead of re-exporting to avoid circular jest.mock calls.)
// Usage in a test:
//   import { localDB } from '../services/database';
//   import { withDBMocks } from '../setupTests.shared';
//   const restore = withDBMocks({ getUserShows: jest.fn().mockResolvedValue([]) });
//   ... test ...
//   restore(); // optional cleanup
// Only add helpers that encourage explicitness; avoid blanket mocks.
import { localDB } from './services/database';
type PartialLocalDB = Partial<Record<keyof typeof localDB, any>>;
export function withDBMocks(partial: PartialLocalDB) {
  const originals: Array<[any, string, any]> = [];
  for (const key of Object.keys(partial) as (keyof typeof localDB)[]) {
    // @ts-ignore - dynamic spy
    const original = (localDB as any)[key];
    originals.push([localDB, key as string, original]);
    // @ts-ignore
    (localDB as any)[key] = partial[key];
  }
  return () => {
    for (const [obj, k, orig] of originals) {
      obj[k] = orig;
    }
  };
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(), 
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(() => ({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
    })),
  };
});

// Mock Expo SQLite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  SQLiteDatabase: jest.fn(),
}));

// (Removed duplicate database mock above; consolidated into single definition.)

// Mock localAuth service
jest.mock('./services/localAuth', () => ({
  localAuth: {
    init: jest.fn().mockResolvedValue(undefined),
    signIn: jest.fn().mockResolvedValue({ user: null, error: 'Not implemented in mock' }),
    signUp: jest.fn().mockResolvedValue({ user: null, error: 'Not implemented in mock' }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    isAuthenticated: jest.fn().mockResolvedValue(false),
    getCurrentUser: jest.fn().mockReturnValue(null),
    getCurrentUserId: jest.fn().mockReturnValue(null),
  },
}));

// Mock Expo SQLite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));
