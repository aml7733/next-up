// Test file to verify status update functionality
import { localDB } from '../services/database';
import { useShowsStore } from '../store/showsStore';

export async function testStatusUpdate() {
  try {
    console.log('Testing status update functionality...');
    
    // Test data
    const userId = 'test-user';
    const showId = 123;
    
    // First add a test show
    const testShow = {
      id: showId,
      tmdb_id: showId,
      title: 'Test Show',
      overview: 'Test overview',
      poster_path: '/test.jpg',
      backdrop_path: '/test-bg.jpg',
      first_air_date: '2023-01-01',
      vote_average: 8.5,
      genre_ids: [18]
    };
    
    console.log('Initializing database...');
    await localDB.init();
    
    console.log('Caching test show...');
    await localDB.cacheShow(testShow);
    
    console.log('Adding user show with want_to_watch status...');
    await localDB.addUserShow(userId, showId, 'want_to_watch');
    
    console.log('Getting user shows...');
    const userShows = await localDB.getUserShows(userId);
    console.log('User shows before update:', userShows);
    
    console.log('Updating show status to watching...');
    await localDB.updateUserShowStatus(userId, showId, 'watching');
    
    console.log('Getting user shows after update...');
    const updatedUserShows = await localDB.getUserShows(userId);
    console.log('User shows after update:', updatedUserShows);
    
    console.log('Status update test completed successfully!');
    return true;
  } catch (error) {
    console.error('Status update test failed:', error);
    return false;
  }
}
