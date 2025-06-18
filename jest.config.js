module.exports = {
  projects: [
    // Unit tests with more mocking  
    {
      displayName: 'unit',
      preset: 'react-native',
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: [
        '.*\\.integration\\.test\\..*',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native.*|react-native-.*|@react-navigation.*|@testing-library/react-native)/)',
      ],
    },
    // Integration tests with minimal mocking
    {
      displayName: 'integration',
      preset: 'react-native',
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.integration.ts'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.{js,jsx,ts,tsx}',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native.*|react-native-.*|@react-navigation.*|@testing-library/react-native)/)',
      ],
    },
  ],
};
