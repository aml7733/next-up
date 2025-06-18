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
  const React = require('react');
  const ActualReactNative = jest.requireActual('react-native');
  
  return {
    ...ActualReactNative,
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
  const ActualReactNavigation = jest.requireActual('@react-navigation/native');
  
  return {
    ...ActualReactNavigation,
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

// Mock react-native-paper with React Native components for better integration testing
// These use actual RN components so getByText and other queries work naturally
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { Text: RNText, View, TouchableOpacity, TextInput } = jest.requireActual('react-native');
  
  return {
    // Use simple div with testID preservation for text elements
    Text: ({ children, variant, style, testID, ...props }: any) => {
      return React.createElement('div', { 
        ...props, 
        testID: testID || undefined,
        'data-testid': testID || undefined, // Add both for maximum compatibility
        style: {
          fontSize: variant === 'headlineMedium' ? 24 : variant === 'titleLarge' ? 20 : 16,
          fontWeight: variant === 'headlineMedium' ? 'bold' : 'normal',
          ...style
        },
      }, children);
    },
    
    Button: ({ children, mode, onPress, style, testID, ...props }: any) => 
      React.createElement(
        'button', 
        { 
          ...props, 
          onClick: onPress, 
          testID: testID || 'paper-button',        // React Native style
          'data-testid': testID || 'paper-button', // HTML style  
          'data-mode': mode,
          style: {
            padding: '12px',
            backgroundColor: mode === 'contained' ? '#6200ea' : 'transparent',
            borderWidth: mode === 'outlined' ? '1px' : '0',
            borderColor: '#6200ea',
            borderRadius: '4px',
            cursor: 'pointer',
            ...style
          },
        }, 
        children
      ),
    
    Card: Object.assign(
      ({ children, style, testID, ...props }: any) => 
        React.createElement('div', { 
          ...props, 
          testID: testID || 'paper-card',
          'data-testid': testID || 'paper-card',
          style: {
            backgroundColor: '#ffffff', 
            borderRadius: 8, 
            elevation: 2,
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            padding: 8,
            ...style
          },
        }, children),
      {
        Content: ({ children, style, testID, ...props }: any) => 
          React.createElement('div', { 
            ...props, 
            testID: testID || 'paper-card-content',
            'data-testid': testID || 'paper-card-content',
            style: { padding: 16, ...style },
          }, children),
      }
    ),
    
    Avatar: {
      Text: ({ label, size, style, testID, ...props }: any) => 
        React.createElement('div', { 
          ...props, 
          testID: testID || 'paper-avatar-text',
          'data-testid': testID || 'paper-avatar-text',
          style: {
            width: size || 40,
            height: size || 40,
            borderRadius: (size || 40) / 2,
            backgroundColor: '#6200ea',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ffffff', 
            fontSize: (size || 40) / 3,
            ...style
          },
        }, label),
    },
    
    Divider: ({ style, testID, ...props }: any) => 
      React.createElement('div', { 
        ...props, 
        testID: testID || 'paper-divider',
        'data-testid': testID || 'paper-divider',
        style: { 
          height: 1, 
          backgroundColor: '#cccccc',
          ...style
        },
      }),
    
    Searchbar: ({ placeholder, value, onChangeText, onSubmitEditing, style, testID, ...props }: any) => 
      React.createElement('input', { 
        ...props, 
        placeholder,
        value,
        testID: testID || 'paper-searchbar',        // React Native style
        'data-testid': testID || 'paper-searchbar', // HTML style
        onChange: (e: any) => onChangeText && onChangeText(e.target.value),
        onKeyPress: (e: any) => {
          if (e.key === 'Enter' && onSubmitEditing) {
            onSubmitEditing();
          }
        },
        style: {
          padding: '12px',
          borderRadius: '4px',
          backgroundColor: '#f5f5f5',
          borderWidth: '1px',
          borderColor: '#cccccc',
          ...style
        },
      }),
    
    Chip: ({ children, mode, style, testID, ...props }: any) => 
      React.createElement('div', { 
        ...props, 
        testID: testID || 'paper-chip',
        'data-testid': testID || 'paper-chip',
        style: {
          display: 'inline-block',
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 6,
          paddingBottom: 6,
          borderRadius: 16,
          backgroundColor: mode === 'outlined' ? 'transparent' : '#6200ea',
          borderWidth: mode === 'outlined' ? 1 : 0,
          borderStyle: 'solid',
          borderColor: '#6200ea',
          color: mode === 'outlined' ? '#6200ea' : '#ffffff',
          fontSize: 12,
          ...style
        },
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
