// Import shared setup first
import './setupTests.shared';

/**
 * INTEGRATION TEST WARNING SUPPRESSION STRATEGY
 * 
 * Integration tests are designed to test real component interactions and navigation flows,
 * which means they use actual Zustand stores and async operations. This creates expected
 * warnings that don't indicate actual problems:
 * 
 * 1. REACT ACT() WARNINGS:
 *    - Zustand stores update component state asynchronously
 *    - These updates happen outside React's render cycle during tests
 *    - React Testing Library can't automatically wrap these in act()
 *    - Suppressing these warnings keeps output clean while preserving test integrity
 * 
 * 2. ERROR SCENARIO LOGS:
 *    - Tests that verify error handling intentionally trigger errors
 *    - These error messages are expected output, not test failures
 *    - Suppressing them prevents confusion while maintaining error handling verification
 * 
 * 3. PHILOSOPHY:
 *    - Integration tests should test real behavior, not mocked behavior
 *    - Warning suppression allows us to test realistic scenarios without noise
 *    - Only expected warnings are suppressed; unexpected errors still appear
 *    - This approach maintains test value while providing clean CI output
 */

// Integration test specific setup - minimal additional mocking
// Integration tests use real navigation and more realistic component behavior

// Suppress act() warnings for integration tests
// These warnings are expected when testing real async Zustand store behavior
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // Suppress specific act() warnings that are expected in integration tests
  // WHY WE SUPPRESS THESE:
  // 1. Zustand stores perform async operations that update component state
  // 2. These async updates happen after the test's await calls but before the test completes
  // 3. React Testing Library's act() can't wrap these Zustand state updates automatically
  // 4. These warnings don't indicate actual problems - they're expected in integration tests
  // 5. The alternative would be to mock everything, defeating the purpose of integration tests
  if (message.includes('An update to') && message.includes('inside a test was not wrapped in act')) {
    return;
  }
  
  // Suppress expected error messages from error test scenarios
  // WHY WE SUPPRESS THESE:
  // 1. These are intentional error messages from tests that verify error handling
  // 2. They appear in tests like "handles database errors" where we simulate failures
  // 3. The errors are expected behavior, not actual test failures
  // 4. Suppressing them keeps test output clean while preserving error handling verification
  if (message.includes('Failed to load user shows: Error: Database error') ||
      message.includes('Failed to load user shows') ||
      message.includes('Database error')) {
    return;
  }
  
  // Allow all other console.error messages
  // Any unexpected errors will still be shown, helping identify real issues
  originalConsoleError(...args);
};

// No additional mocks needed for integration tests
// The shared setup already handles:
// - React Native internal components that cause ES module issues
// - @expo/vector-icons mocking
// - External API mocking (TMDB)
// - Console warning suppression

// Integration tests intentionally use real navigation to test navigation flows