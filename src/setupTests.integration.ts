// Import shared setup first
import './setupTests.shared';

// Integration test specific setup - minimal additional mocking
// Integration tests use real navigation and more realistic component behavior

// No additional mocks needed for integration tests
// The shared setup already handles:
// - React Native internal components that cause ES module issues
// - @expo/vector-icons mocking
// - External API mocking (TMDB)
// - Console warning suppression

// Integration tests intentionally use real navigation to test navigation flows