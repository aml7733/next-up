// Environment configuration getter
export const getConfig = () => ({
  tmdb: {
    apiKey: process.env.EXPO_PUBLIC_TMDB_API_KEY || '',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
});

// Environment configuration - backwards compatibility
export const config = getConfig();

// Validation helpers
export const isConfigValid = () => {
  const { tmdb } = getConfig();
  
  if (!tmdb.apiKey) {
    console.warn('TMDB API key is missing. Please add EXPO_PUBLIC_TMDB_API_KEY to your environment.');
    return false;
  }
  
  return true;
};

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  // Parse the date string and ensure we get the correct date regardless of timezone
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatYear = (dateString: string): string => {
  const date = new Date(dateString);
  return date.getFullYear().toString();
};

// Image URL helpers
export const getImageUrl = (path: string | undefined, size: string = 'w500'): string | undefined => {
  if (!path) return undefined;
  const config = getConfig();
  return `${config.tmdb.imageBaseUrl}/${size}${path}`;
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};
