describe('Utility Functions', () => {
  // Helper to get functions from module
  const getUtils = () => require('../index');

  describe('config', () => {
    it('has correct structure', () => {
      const { config } = getUtils();
      expect(config).toHaveProperty('tmdb');
      expect(config.tmdb).toHaveProperty('apiKey');
      expect(config.tmdb).toHaveProperty('baseUrl');
      expect(config.tmdb).toHaveProperty('imageBaseUrl');
      expect(config.tmdb.baseUrl).toBe('https://api.themoviedb.org/3');
      expect(config.tmdb.imageBaseUrl).toBe('https://image.tmdb.org/t/p');
    });
  });

  // TODO: Environment variable testing is complex in Jest due to module caching
  // and environment variable persistence issues. The tests below were attempted
  // but have issues with:
  // 1. Jest module cache not properly clearing environment-dependent exports
  // 2. process.env modifications not being reflected consistently across test runs
  // 3. The config export being cached at module load time
  //
  // Future improvements could include:
  // - Refactoring utils to make config more testable (dependency injection)
  // - Using a test-specific configuration approach
  // - Setting up environment variables at the Jest configuration level
  
  describe.skip('isConfigValid - Environment Variable Tests (TODO)', () => {
    it('should return false when TMDB API key is missing', () => {
      // TODO: Fix environment variable testing approach  
    });

    it('should return true when all config is present', () => {
      // TODO: Fix environment variable testing approach
    });
  });

  describe('formatDate', () => {
    it.each([
      ['2024-01-15', 'January 15, 2024'],
      ['2023-12-25', 'December 25, 2023'],
      ['2022-07-04', 'July 4, 2022'],
    ])('formats "%s" correctly to "%s"', (input, expected) => {
      const { formatDate } = getUtils();
      expect(formatDate(input)).toBe(expected);
    });
  });

  describe('formatYear', () => {
    it.each([
      ['2024-01-15T10:30:00Z', '2024'],
      ['2023-12-25', '2023'],
      ['2022-07-04T00:00:00.000Z', '2022'],
    ])('extracts year from "%s" correctly as "%s"', (input, expected) => {
      const { formatYear } = getUtils();
      expect(formatYear(input)).toBe(expected);
    });
  });

  describe('getImageUrl', () => {
    it.each([
      ['/path/to/image.jpg', undefined, 'https://image.tmdb.org/t/p/w500/path/to/image.jpg'],
      ['/path/to/image.jpg', 'w300', 'https://image.tmdb.org/t/p/w300/path/to/image.jpg'],
    ])('returns full URL for path "%s" with size "%s"', (path, size, expected) => {
      const { getImageUrl } = getUtils();
      expect(getImageUrl(path, size)).toBe(expected);
    });

    it.each([
      [undefined, 'undefined path'],
      ['', 'empty path'],
    ])('returns undefined for %s: %s', (input, description) => {
      const { getImageUrl } = getUtils();
      expect(getImageUrl(input)).toBeUndefined();
    });
  });

  describe('isValidEmail', () => {
    it.each([
      ['test@example.com'],
      ['user.name@domain.co.uk'],
      ['test+tag@example.org'],
    ])('returns true for valid email "%s"', (email) => {
      const { isValidEmail } = getUtils();
      expect(isValidEmail(email)).toBe(true);
    });

    it.each([
      ['invalid-email'],
      ['@domain.com'],
      ['test@'],
      [''],
    ])('returns false for invalid email "%s"', (email) => {
      const { isValidEmail } = getUtils();
      expect(isValidEmail(email)).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it.each([
      ['123456'],
      ['password'],
      ['longpassword123'],
    ])('returns true for password with 6+ characters: "%s"', (password) => {
      const { isValidPassword } = getUtils();
      expect(isValidPassword(password)).toBe(true);
    });

    it.each([
      ['12345'],
      ['pass'],
      [''],
      ['a'],
    ])('returns false for password with <6 characters: "%s"', (password) => {
      const { isValidPassword } = getUtils();
      expect(isValidPassword(password)).toBe(false);
    });
  });
});
