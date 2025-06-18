import '@testing-library/jest-native/extend-expect';

// Suppress react-test-renderer deprecation warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('react-test-renderer is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Define global variables needed by React Native/Expo
(global as any).__DEV__ = true;

// Add missing globals for react-native-web
(global as any).process = process;
(global as any).process.env = { ...process.env, EXPO_OS: 'web' };

// Minimal setup for integration tests - only mock what we absolutely must

// Mock React Native Platform (simpler approach)
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const React = require('react');
  
  return {
    ...RN,
    Platform: {
      OS: 'web',
      select: (obj: any) => obj.web || obj.default || obj.android || obj.ios,
    },
    // Mock native component utilities that don't exist in Jest
    requireNativeComponent: jest.fn(() => 'View'),
    
    // Mock React Native components to preserve testIDs and structure
    View: ({ children, style, testID, ...props }: any) => 
      React.createElement('div', { 
        ...props, 
        style, 
        testID,
        'data-component': 'view'
      }, children),
    
    ScrollView: ({ children, style, testID, contentContainerStyle, ...props }: any) => 
      React.createElement('div', { 
        ...props, 
        style: { ...style, ...contentContainerStyle }, 
        testID,
        'data-component': 'scrollview'
      }, children),
    
    Text: ({ children, style, ...props }: any) => 
      React.createElement('span', { 
        ...props, 
        style,
        'data-component': 'text'
      }, children),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 0, height: 0 }),
}));

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

jest.mock('expo-modules-core', () => ({
  NativeModule: jest.fn(),
  Platform: {
    OS: 'web',
    select: (obj: any) => obj.web || obj.default,
  },
}));

// Mock @expo/vector-icons completely
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  Feather: 'Feather',
  Ionicons: 'Ionicons',
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
    NavigationContainer: ({ children }: any) => children,
  };
});

// Mock bottom tab navigator for integration tests
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock native stack navigator for integration tests
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

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

// Mock react-native-paper with integration-friendly components
// These are more realistic than unit test mocks but still testable
jest.mock('react-native-paper', () => {
  const React = require('react');
  
  return {
    // Text component that directly exposes text content for getByText queries
    Text: ({ children, variant, style, testID, ...props }: any) => {
      // Use a span element that React Testing Library can easily find
      return React.createElement('span', { 
        ...props, 
        testID,
        'data-variant': variant, 
        style,
      }, children);
    },
    
    Button: ({ children, mode, onPress, style, ...props }: any) => 
      React.createElement(
        'button', 
        { 
          ...props, 
          onClick: onPress, 
          'data-mode': mode,
          style,
          role: 'button',
          'data-testid': 'paper-button'
        }, 
        children
      ),
    
    Card: Object.assign(
      ({ children, style, ...props }: any) => 
        React.createElement('div', { 
          ...props, 
          'data-component': 'card', 
          style,
          'data-testid': 'paper-card'
        }, children),
      {
        Content: ({ children, style, ...props }: any) => 
          React.createElement('div', { 
            ...props, 
            'data-component': 'card-content', 
            style,
            'data-testid': 'paper-card-content'
          }, children),
      }
    ),
    
    Avatar: {
      Text: ({ label, size, style, ...props }: any) => 
        React.createElement('span', { 
          ...props, 
          'data-component': 'avatar-text', 
          'data-size': size,
          style,
          'data-testid': 'paper-avatar-text',
          'data-label': label
        }, label),
    },
    
    Divider: ({ style, ...props }: any) => 
      React.createElement('hr', { 
        ...props, 
        'data-component': 'divider', 
        style,
        'data-testid': 'paper-divider'
      }),
    
    Searchbar: ({ placeholder, value, onChangeText, onSubmitEditing, style, testID, ...props }: any) => 
      React.createElement('input', { 
        ...props, 
        placeholder,
        value,
        testID,
        onChange: (e: any) => onChangeText && onChangeText(e.target.value),
        onKeyPress: (e: any) => {
          if (e.key === 'Enter' && onSubmitEditing) {
            onSubmitEditing();
          }
        },
        style,
        'data-component': 'searchbar'
      }),
    
    Chip: ({ children, mode, style, testID, ...props }: any) => 
      React.createElement('span', { 
        ...props, 
        testID,
        'data-mode': mode,
        style,
      }, children),
    
    useTheme: () => ({
      colors: {
        background: '#ffffff',
        surface: '#ffffff',
        primary: '#6200ea',
        text: '#000000',
        onSurfaceVariant: '#666666',
        onSurface: '#333333',
        outline: '#cccccc',
      },
    }),
    
    PaperProvider: ({ children }: any) => children,
  };
});
