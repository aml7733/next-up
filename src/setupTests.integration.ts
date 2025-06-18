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

// Integration tests use real navigation - no navigation mocking
// Only mock external APIs that we can't test end-to-end