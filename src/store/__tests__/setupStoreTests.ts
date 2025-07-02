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
  searchShows: jest.fn(),
  getShowDetails: jest.fn(),
}));
