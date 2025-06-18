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

// Mock React Native core components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const React = require('react');
  
  return {
    ...RN,
    View: React.forwardRef((props: any, ref: any) => 
      React.createElement('View', { ...props, ref, testID: props.testID })
    ),
    Text: React.forwardRef((props: any, ref: any) => 
      React.createElement('Text', { ...props, ref, testID: props.testID }, props.children)
    ),
    ScrollView: React.forwardRef((props: any, ref: any) => 
      React.createElement('ScrollView', { ...props, ref, testID: props.testID }, props.children)
    ),
    TextInput: React.forwardRef((props: any, ref: any) => {
      const { placeholder, value, onChangeText, testID, ...otherProps } = props;
      return React.createElement('TextInput', { 
        ...otherProps,
        ref, 
        testID,
        placeholder,
        value,
        onChangeText
      });
    }),
    TouchableOpacity: React.forwardRef((props: any, ref: any) => 
      React.createElement('TouchableOpacity', { ...props, ref, testID: props.testID }, props.children)
    ),
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => {
        if (Array.isArray(style)) {
          return style.reduce((acc, s) => ({ ...acc, ...s }), {});
        }
        return style || {};
      },
    },
  };
});

// Mock react-native-paper components as React components
jest.mock('react-native-paper', () => {
  const React = require('react');
  const RN = require('react-native');
  
  return {
    Button: React.forwardRef((props: any, ref: any) => {
      const { children, onPress, testID, ...otherProps } = props;
      return React.createElement(
        RN.TouchableOpacity,
        { 
          ...otherProps,
          ref, 
          testID,
          onPress 
        }, 
        React.createElement(RN.Text, { testID: testID ? `${testID}-text` : undefined }, children)
      );
    }),
    Text: React.forwardRef((props: any, ref: any) => 
      React.createElement(RN.Text, { ...props, ref, testID: props.testID }, props.children)
    ),
    View: React.forwardRef((props: any, ref: any) => 
      React.createElement(RN.View, { ...props, ref, testID: props.testID }, props.children)
    ),
    ActivityIndicator: React.forwardRef((props: any, ref: any) => 
      React.createElement('ActivityIndicator', { ...props, ref, testID: props.testID })
    ),
    PaperProvider: React.forwardRef(({ children, ...props }: any, ref: any) => 
      React.createElement(RN.View, { ...props, ref }, children)
    ),
    Portal: ({ children }: { children: React.ReactNode }) => children,
    Card: Object.assign(
      React.forwardRef((props: any, ref: any) => 
        React.createElement(RN.View, { ...props, ref, testID: props.testID }, props.children)
      ),
      {
        Title: React.forwardRef((props: any, ref: any) => 
          React.createElement(RN.Text, { ...props, ref, testID: props.testID }, props.children)
        ),
        Content: React.forwardRef((props: any, ref: any) => 
          React.createElement(RN.View, { ...props, ref, testID: props.testID }, props.children)
        ),
      }
    ),
    Avatar: {
      Text: React.forwardRef((props: any, ref: any) => {
        const { children, testID, label, ...otherProps } = props;
        // Avatar.Text uses `label` prop for the text content
        const displayText = label || children;
        return React.createElement(
          RN.Text, 
          { ...otherProps, ref, testID }, 
          displayText
        );
      }),
    },
    TextInput: React.forwardRef((props: any, ref: any) => {
      const { placeholder, value, onChangeText, testID, ...otherProps } = props;
      return React.createElement('TextInput', { 
        ...otherProps,
        ref, 
        testID,
        placeholder,
        value,
        onChangeText
      });
    }),
    Searchbar: React.forwardRef((props: any, ref: any) => {
      const { placeholder, value, onChangeText, testID, ...otherProps } = props;
      return React.createElement('TextInput', { 
        ...otherProps,
        ref, 
        testID,
        placeholder,
        value,
        onChangeText
      });
    }),
    ScrollView: React.forwardRef((props: any, ref: any) => 
      React.createElement(RN.ScrollView, { ...props, ref, testID: props.testID }, props.children)
    ),
    Divider: React.forwardRef((props: any, ref: any) => 
      React.createElement(RN.View, { ...props, ref, testID: props.testID }, 
        React.createElement(RN.Text, {}, '---')
      )
    ),
    Chip: React.forwardRef((props: any, ref: any) => {
      const { children, testID, onPress, ...otherProps } = props;
      return React.createElement(
        RN.TouchableOpacity, 
        { ...otherProps, ref, testID, onPress }, 
        React.createElement(RN.Text, {}, children)
      );
    }),
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
      goBack: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      popToTop: jest.fn(),
      reset: jest.fn(),
      setParams: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
      key: 'test-route',
      name: 'TestRoute',
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
  };
});

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        SUPABASE_URL: 'test-url',
        SUPABASE_ANON_KEY: 'test-key',
        TMDB_API_KEY: 'test-tmdb-key',
      },
    },
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock Zustand with a simple approach
jest.mock('zustand', () => ({
  create: (fn: any) => {
    let store = fn(
      (partial: any, replace?: boolean) => {
        if (replace) {
          // Only replace state properties, keep action functions
          const stateKeys = ['userShows', 'isLoading', 'error', 'user', 'isAuthenticated'];
          stateKeys.forEach(key => {
            if (key in store) delete store[key];
          });
          const newState = typeof partial === 'function' ? partial({}) : partial;
          Object.assign(store, newState);
        } else {
          // Merge with existing state
          Object.assign(store, typeof partial === 'function' ? partial(store) : partial);
        }
      },
      () => store
    );
    
    const hook = () => store;
    hook.getState = () => store;
    hook.setState = (partial: any, replace?: boolean) => {
      if (replace) {
        // Only replace state properties, keep action functions
        const stateKeys = ['userShows', 'isLoading', 'error', 'user', 'isAuthenticated'];
        stateKeys.forEach(key => {
          if (key in store) delete store[key];
        });
        const newState = typeof partial === 'function' ? partial({}) : partial;
        Object.assign(store, newState);
      } else {
        // Merge with existing state
        Object.assign(store, typeof partial === 'function' ? partial(store) : partial);
      }
    };
    hook.subscribe = () => () => {};
    
    return hook;
  },
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  })),
}));

// Mock fetch for TMDB API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      results: [
        {
          id: 1,
          name: 'Test Show',
          poster_path: '/test-poster.jpg',
          overview: 'Test overview',
          first_air_date: '2023-01-01',
        },
      ],
    }),
  })
) as jest.Mock;

// Mock Expo vector icons
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    return React.createElement('Text', { ...props, ref, testID: props.testID }, props.name);
  });
});
