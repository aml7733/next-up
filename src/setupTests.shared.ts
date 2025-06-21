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
  if (typeof args[0] === 'string' && (
    args[0].includes('react-test-renderer is deprecated') ||
    args[0].includes('Tried to use the icon') ||
    args[0].includes('none of the required icon libraries are installed')
  )) {
    return;
  }
  originalConsoleWarn(...args);
};

// Mock external APIs that should be mocked in all test types
jest.mock('./services/tmdb', () => ({
  searchShows: jest.fn(),
  getShowDetails: jest.fn(),
  getTrendingShows: jest.fn(),
}));

// Mock the local database
jest.mock('./services/database', () => ({
  localDB: {
    init: jest.fn(),
    createUser: jest.fn(),
    getUserByUsername: jest.fn(),
    getUserById: jest.fn(),
    getAllUsers: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    addUserShow: jest.fn(),
    getUserShows: jest.fn(),
    updateUserShow: jest.fn(),
    deleteUserShow: jest.fn(),
    getUserShowByShowId: jest.fn(),
    addShow: jest.fn(),
    getShow: jest.fn(),
    searchShows: jest.fn(),
    updateShow: jest.fn(),
    close: jest.fn(),
  },
}));

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

// Mock Expo SQLite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  SQLiteDatabase: jest.fn(),
}));

// Mock database service
jest.mock('./services/database', () => ({
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
    deleteUserShow: jest.fn(),
  },
}));

// Mock Expo SQLite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));
