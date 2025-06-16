// Environment configuration
export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  tmdb: {
    apiKey: process.env.EXPO_PUBLIC_TMDB_API_KEY || '',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
};

// Validation helpers
export const isConfigValid = () => {
  const { supabase, tmdb } = config;
  
  if (!supabase.url || !supabase.anonKey) {
    console.warn('Supabase configuration is missing. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.');
    return false;
  }
  
  if (!tmdb.apiKey) {
    console.warn('TMDB API key is missing. Please add EXPO_PUBLIC_TMDB_API_KEY to your environment.');
    return false;
  }
  
  return true;
};

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
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
