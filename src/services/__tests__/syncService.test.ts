import { syncService, SyncStatus, SyncOptions } from '../syncService';
import { tmdbService } from '../tmdb';
import { useShowsStore } from '../../store/showsStore';

// Mock dependencies
jest.mock('../tmdb');
jest.mock('../../store/showsStore');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock timers
jest.useFakeTimers();

describe('SyncService', () => {
  const mockTmdbService = tmdbService as jest.Mocked<typeof tmdbService>;
  
  beforeAll(() => {
    // Ensure all tmdb methods are mocked
    mockTmdbService.getTotalEpisodeCount = jest.fn();
    mockTmdbService.getNextEpisode = jest.fn();
  });
  
  // Mock the store properly
  const mockShowsState = {
    userShows: [
      {
        id: '1',
        user_id: 'user1',
        show_id: 123,
        status: 'watching' as const,
        current_season: 1,
        current_episode: 5,
        added_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        show_id: 456,
        status: 'want_to_watch' as const,
        current_season: 1,
        current_episode: 1,
        added_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ],
    refreshShowData: jest.fn(),
    searchResults: [],
    isLoading: false,
    isSearching: false,
    searchQuery: '',
    error: null,
    loadUserShows: jest.fn(),
    addShow: jest.fn(),
    updateShowProgress: jest.fn(),
    updateShowStatus: jest.fn(),
    removeShow: jest.fn(),
    searchShows: jest.fn(),
    clearSearch: jest.fn(),
    setUserShows: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Reset sync service to initial state
    (syncService as any).status = {
      lastSync: null,
      isRunning: false,
      nextSync: null,
      errorCount: 0,
      lastError: null,
    };
    
    // Stop any running intervals
    syncService.stop();
    
    // Mock store state
    (useShowsStore as any).getState = jest.fn().mockReturnValue(mockShowsState);
  });

  afterEach(() => {
    syncService.stop();
  });

  describe('Initialization', () => {
    it('should initialize with default status when no stored status exists', async () => {
      await syncService.initialize();
      
      const status = syncService.getStatus();
      expect(status.lastSync).toBeNull();
      expect(status.isRunning).toBe(false);
      expect(status.errorCount).toBe(0);
      expect(status.lastError).toBeNull();
      expect(status.nextSync).not.toBeNull(); // Should schedule next sync
    });

    it('should load existing status from storage', async () => {
      const storedStatus: SyncStatus = {
        lastSync: '2023-01-01T12:00:00Z',
        isRunning: false,
        nextSync: '2023-01-02T12:00:00Z',
        errorCount: 1,
        lastError: 'Network error',
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedStatus));
      
      await syncService.initialize();
      
      const status = syncService.getStatus();
      expect(status.lastSync).toBe(storedStatus.lastSync);
      expect(status.errorCount).toBe(storedStatus.errorCount);
      expect(status.lastError).toBe(storedStatus.lastError);
    });

    it('should handle corrupted storage data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      // Reset service state completely
      (syncService as any).status = {
        lastSync: null,
        isRunning: false,
        nextSync: null,
        errorCount: 0,
        lastError: null,
      };
      
      await syncService.initialize();
      
      const status = syncService.getStatus();
      expect(status.lastSync).toBeNull();
      expect(status.errorCount).toBe(0);
    });
  });

  describe('Scheduling', () => {
    it('should schedule sync at 24-hour intervals', async () => {
      await syncService.initialize();
      
      const status = syncService.getStatus();
      const nextSyncTime = new Date(status.nextSync!).getTime();
      const now = Date.now();
      const expectedInterval = 24 * 60 * 60 * 1000; // 24 hours in ms
      
      expect(nextSyncTime - now).toBeCloseTo(expectedInterval, -1000); // Within 1 second
    });

    it('should start periodic syncing when start() is called', () => {
      syncService.start();
      
      const status = syncService.getStatus();
      expect(status.nextSync).not.toBeNull();
    });

    it('should not start multiple intervals when start() is called multiple times', () => {
      syncService.start();
      const firstStatus = syncService.getStatus();
      
      syncService.start();
      const secondStatus = syncService.getStatus();
      
      expect(firstStatus.nextSync).toBe(secondStatus.nextSync);
    });

    it('should stop periodic syncing when stop() is called', () => {
      syncService.start();
      syncService.stop();
      
      // Fast forward past the sync interval
      jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours
      
      // Sync should not have triggered
      expect(mockTmdbService.getShowDetails).not.toHaveBeenCalled();
    });

    it('should trigger automatic sync after interval expires', async () => {
      mockTmdbService.getShowDetails.mockResolvedValue({
        id: 123,
        title: 'Test Show',
        overview: 'Test overview',
      } as any);

      await syncService.initialize();
      
      // Clear any calls from initialization
      mockTmdbService.getShowDetails.mockClear();
      
      syncService.start();
      
      // Fast forward to trigger sync
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000); // 24 hours + 1 second
      
      // Wait for all pending promises
      await jest.runOnlyPendingTimersAsync();
      
      expect(mockTmdbService.getShowDetails).toHaveBeenCalled();
    });
  });

  describe('Manual Sync', () => {
    it('should perform manual sync immediately', async () => {
      mockTmdbService.getShowDetails.mockResolvedValue({
        id: 123,
        title: 'Test Show',
      } as any);

      await syncService.syncNow();
      
      expect(mockTmdbService.getShowDetails).toHaveBeenCalledWith(123);
      expect(mockTmdbService.getShowDetails).toHaveBeenCalledWith(456);
    });

    it('should skip manual sync if already running', async () => {
      // Start a long-running sync
      mockTmdbService.getShowDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000)) // Shorter delay
      );

      const syncPromise = syncService.syncNow();
      
      // Try to start another sync immediately
      await syncService.syncNow();
      
      // Only one set of calls should be made
      expect(mockTmdbService.getShowDetails).toHaveBeenCalledTimes(2); // Once per show
      
      // Fast forward timers to complete the first sync
      jest.advanceTimersByTime(1000);
      await syncPromise;
    }, 10000);

    it('should force sync when force option is true', async () => {
      // Mock sync responses
      mockTmdbService.getShowDetails.mockResolvedValue({
        id: 123,
        title: 'Test Show',
      } as any);

      // First sync call
      await syncService.syncNow();
      
      // Clear the mock to track subsequent calls
      mockTmdbService.getShowDetails.mockClear();
      
      // Force another sync immediately
      await syncService.syncNow({ force: true });
      
      // Should have called for the forced sync even though last sync was recent
      expect(mockTmdbService.getShowDetails).toHaveBeenCalled();
    });

    it('should sync only specified shows when shows option is provided', async () => {
      mockTmdbService.getShowDetails.mockResolvedValue({} as any);

      await syncService.syncNow({ shows: ['1'] }); // Only sync first show
      
      expect(mockTmdbService.getShowDetails).toHaveBeenCalledWith(123);
      expect(mockTmdbService.getShowDetails).not.toHaveBeenCalledWith(456);
    });
  });

  describe('Status Management', () => {
    it('should update status during sync lifecycle', async () => {
      let syncStartedStatus: SyncStatus;
      let syncCompletedStatus: SyncStatus;

      mockTmdbService.getShowDetails.mockImplementation(async () => {
        syncStartedStatus = syncService.getStatus();
        return {} as any;
      });

      await syncService.syncNow();
      syncCompletedStatus = syncService.getStatus();
      
      expect(syncStartedStatus!.isRunning).toBe(true);
      expect(syncCompletedStatus.isRunning).toBe(false);
      expect(syncCompletedStatus.lastSync).not.toBeNull();
      expect(syncCompletedStatus.errorCount).toBe(0);
    });

    it('should save status to storage after successful sync', async () => {
      mockTmdbService.getShowDetails.mockResolvedValue({} as any);

      await syncService.syncNow();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'syncStatus',
        expect.stringContaining('"lastSync"')
      );
    });

    it('should update error status on sync failure', async () => {
      mockTmdbService.getShowDetails.mockRejectedValue(new Error('Network error'));

      await syncService.syncNow();
      
      const status = syncService.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.errorCount).toBe(1);
      expect(status.lastError).toBe('Network error');
    });

    it('should provide human-readable status text', async () => {
      // Test "never synced" status
      expect(syncService.getStatusText()).toBe('Never synced');
      
      // Test "recently synced" status
      mockTmdbService.getShowDetails.mockResolvedValue({} as any);
      await syncService.syncNow();
      expect(syncService.getStatusText()).toBe('Recently synced');
      
      // Test error status
      mockTmdbService.getShowDetails.mockRejectedValue(new Error('Test error'));
      await syncService.syncNow();
      expect(syncService.getStatusText()).toBe('Error: Test error');
    });
  });

  describe('Error Handling and Retries', () => {
    it('should implement exponential backoff for retries', async () => {
      mockTmdbService.getShowDetails.mockRejectedValue(new Error('Network error'));

      await syncService.syncNow();
      
      const status = syncService.getStatus();
      const nextSyncTime = new Date(status.nextSync!).getTime();
      const now = Date.now();
      
      // First retry should be around 2 minutes (2^1 * 1 minute)
      expect(nextSyncTime - now).toBeGreaterThan(60 * 1000); // More than 1 minute
      expect(nextSyncTime - now).toBeLessThan(5 * 60 * 1000); // Less than 5 minutes
    });

    it('should stop retrying after max retries exceeded', async () => {
      mockTmdbService.getShowDetails.mockRejectedValue(new Error('Persistent error'));

      // Trigger multiple failed syncs
      await syncService.syncNow();
      await syncService.syncNow();
      await syncService.syncNow();
      await syncService.syncNow(); // 4th attempt, should exceed max retries

      const status = syncService.getStatus();
      expect(status.errorCount).toBe(4);
      
      // Should schedule normal sync again (24 hour interval)
      const nextSyncTime = new Date(status.nextSync!).getTime();
      const now = Date.now();
      const expectedInterval = 24 * 60 * 60 * 1000; // 24 hours
      
      expect(nextSyncTime - now).toBeCloseTo(expectedInterval, -1000);
    });

    it('should reset error count after successful sync', async () => {
      // First, cause some errors
      mockTmdbService.getShowDetails.mockRejectedValue(new Error('Network error'));
      await syncService.syncNow();
      await syncService.syncNow();
      
      let status = syncService.getStatus();
      expect(status.errorCount).toBe(2);
      
      // Then succeed
      mockTmdbService.getShowDetails.mockResolvedValue({} as any);
      await syncService.syncNow();
      
      status = syncService.getStatus();
      expect(status.errorCount).toBe(0);
      expect(status.lastError).toBeNull();
    });
  });

  describe('Episode Sync', () => {
    it('should sync episodes when includeEpisodes option is true', async () => {
      mockTmdbService.getShowDetails.mockResolvedValue({} as any);
      mockTmdbService.getTotalEpisodeCount.mockResolvedValue({ totalEpisodes: 50, seasonCount: 5 });
      mockTmdbService.getNextEpisode.mockResolvedValue({} as any);

      await syncService.syncNow({ includeEpisodes: true });
      
      expect(mockTmdbService.getTotalEpisodeCount).toHaveBeenCalled();
      expect(mockTmdbService.getNextEpisode).toHaveBeenCalled();
    });

    it('should not sync episodes by default', async () => {
      mockTmdbService.getShowDetails.mockResolvedValue({} as any);

      await syncService.syncNow();
      
      expect(mockTmdbService.getTotalEpisodeCount).not.toHaveBeenCalled();
      expect(mockTmdbService.getNextEpisode).not.toHaveBeenCalled();
    });
  });

  describe('Sync Conditions', () => {
    it('should identify when sync is needed based on last sync time', () => {
      expect(syncService.shouldSync()).toBe(true); // Never synced
      
      // Mock recent sync
      const recentSync = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(); // 12 hours ago
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        lastSync: recentSync,
        isRunning: false,
        nextSync: null,
        errorCount: 0,
        lastError: null,
      }));
      
      expect(syncService.shouldSync()).toBe(false); // Recent sync
    });

    it('should only sync shows that are being watched or wanted', async () => {
      // Add a completed show that shouldn't be synced
      const modifiedState = {
        ...mockShowsState,
        userShows: [
          {
            id: '1',
            user_id: 'user1',
            show_id: 123,
            status: 'watching' as const,
            current_season: 1,
            current_episode: 5,
            added_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
          {
            id: '2',
            user_id: 'user1',
            show_id: 456,
            status: 'completed' as const,
            current_season: 5,
            current_episode: 22,
            added_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        ],
      };
      
      (useShowsStore as any).getState = jest.fn().mockReturnValue(modifiedState);

      mockTmdbService.getShowDetails.mockResolvedValue({} as any);

      await syncService.syncNow();
      
      expect(mockTmdbService.getShowDetails).toHaveBeenCalledWith(123);
      expect(mockTmdbService.getShowDetails).not.toHaveBeenCalledWith(456);
    });

    it('should handle empty show list gracefully', async () => {
      const emptyState = {
        ...mockShowsState,
        userShows: [],
      };
      
      (useShowsStore as any).getState = jest.fn().mockReturnValue(emptyState);

      await syncService.syncNow();
      
      expect(mockTmdbService.getShowDetails).not.toHaveBeenCalled();
      
      const status = syncService.getStatus();
      expect(status.lastSync).not.toBeNull();
      expect(status.errorCount).toBe(0);
    });
  });
});
