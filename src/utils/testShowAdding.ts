// Test script to verify show adding functionality
// Run this in the app's browser console or create a debug screen

import { useAuthStore } from '../store/authStore';
import { useShowsStore } from '../store/showsStore';

export const testShowAdding = async () => {
  console.log('🧪 Testing show adding functionality...');
  
  const { user, isAuthenticated } = useAuthStore.getState();
  const { addShow, userShows } = useShowsStore.getState();
  
  if (!isAuthenticated || !user) {
    console.log('❌ User not authenticated. Please sign in first.');
    return;
  }
  
  console.log(`✅ User authenticated: ${user.username || user.email}`);
  
  // Test show data (Breaking Bad)
  const testShow = {
    id: 1396,
    tmdb_id: 1396,
    title: 'Breaking Bad',
    poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live.',
    first_air_date: '2008-01-20',
    vote_average: 9.5,
    genre_ids: [18, 80]
  };
  
  try {
    console.log('📺 Adding Breaking Bad to tracking...');
    await addShow(user.id, testShow, 'want_to_watch');
    
    console.log('✅ Show added successfully!');
    console.log('📊 Current user shows:', useShowsStore.getState().userShows);
    
  } catch (error) {
    console.error('❌ Failed to add show:', error);
  }
};

// For easy copy-paste testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testShowAdding = testShowAdding;
  console.log('🔧 Test function available as window.testShowAdding()');
}
