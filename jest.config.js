module.exports = {
  displayName: 'NextUp Media Tracker',
  projects: [
    // Unit tests with mocking
    {
      displayName: 'unit',
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: [
        '.*\\.integration\\.test\\..*',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@testing-library|@react-navigation|@expo|expo|react-native-paper|react-native-vector-icons|@expo/vector-icons|react-native-safe-area-context)',
      ],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
        '^react-native$': 'react-native-web',
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
      },
    },
    // Integration tests with minimal mocking
    {
      displayName: 'integration',
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.integration.ts'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.{js,jsx,ts,tsx}',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@testing-library|@react-navigation|@expo|expo|react-native-paper|react-native-vector-icons|@expo/vector-icons|react-native-safe-area-context)',
      ],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
        '^react-native$': 'react-native-web',
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
      },
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/setupTests*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
  ],
};
