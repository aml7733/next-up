import { tmdbService } from './tmdb';
import { useShowsStore } from '../store/showsStore';

export interface SyncStatus {
  lastSync: string | null;
  isRunning: boolean;
  nextSync: string | null;
  errorCount: number;
  lastError: string | null;
}

export interface SyncOptions {
  force?: boolean;
  shows?: string[]; // Specific show IDs to sync
  includeEpisodes?: boolean;
}

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly HOURS_TO_MS = 1000 * 60 * 60; // Milliseconds in an hour
  private readonly SYNC_INTERVAL_HOURS = 24; // Sync interval in hours
  private readonly SYNC_INTERVAL = this.HOURS_TO_MS * this.SYNC_INTERVAL_HOURS; // 24 hours
  private readonly MAX_RETRIES = 3;
  
  private status: SyncStatus = {
    lastSync: null,
    isRunning: false,
    nextSync: null,
    errorCount: 0,
    lastError: null,
  };

  /**
   * Initialize the sync service and start periodic syncing
   */
  async initialize(): Promise<void> {
    try {
      // Load last sync status from storage
      const stored = await this.loadSyncStatus();
      if (stored) {
        this.status = stored;
      }

      // Schedule next sync
      this.scheduleNextSync();
      
      console.log('SyncService initialized', this.status);
    } catch (error) {
      console.error('Failed to initialize SyncService:', error);
      // Reset to default status on any initialization error
      this.status = {
        lastSync: null,
        isRunning: false,
        nextSync: null,
        errorCount: 0,
        lastError: null,
      };
      this.scheduleNextSync();
    }
  }

  /**
   * Start periodic syncing
   */
  start(): void {
    if (this.syncInterval) {
      return; // Already running
    }

    this.scheduleNextSync();
  }

  /**
   * Stop periodic syncing
   */
  stop(): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Manually trigger a sync
   */
  async syncNow(options: SyncOptions = {}): Promise<void> {
    if (this.status.isRunning && !options.force) {
      console.log('Sync already running, skipping...');
      return;
    }

    await this.performSync(options);
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(options: SyncOptions = {}): Promise<void> {
    console.log('Starting background sync...', options);
    
    this.status.isRunning = true;
    this.status.lastError = null;

    try {
      const { userShows } = useShowsStore.getState();
      
      // Get shows to sync
      const showsToSync = options.shows 
        ? userShows.filter(us => options.shows!.includes(us.id))
        : userShows.filter(us => us.status === 'watching' || us.status === 'want_to_watch');

      if (showsToSync.length === 0) {
        console.log('No shows to sync');
        this.updateSyncStatus(true);
        return;
      }

      console.log(`Syncing ${showsToSync.length} shows...`);

      // Sync each show and track failures
      const syncPromises = showsToSync.map(userShow => 
        this.syncShow(userShow.show_id, options.includeEpisodes)
      );

      const results = await Promise.allSettled(syncPromises);
      
      // Check if any syncs failed
      const failures = results.filter(result => result.status === 'rejected');
      
      if (failures.length > 0) {
        const firstFailure = failures[0] as PromiseRejectedResult;
        throw new Error(firstFailure.reason?.message || 'Show sync failed');
      }

      this.updateSyncStatus(true);
      console.log('Background sync completed successfully');

    } catch (error) {
      console.error('Background sync failed:', error);
      this.updateSyncStatus(false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Sync individual show data
   */
  private async syncShow(showId: number, includeEpisodes = false): Promise<void> {
    try {
      // Get latest show details
      const showDetails = await tmdbService.getShowDetails(showId);
      
      // Update show in store if needed
      const { userShows, refreshShowData } = useShowsStore.getState();
      const userShow = userShows.find(us => us.show_id === showId);
      
      if (userShow) {
        await refreshShowData(userShow.show_id);
      }

      // Sync episodes if requested
      if (includeEpisodes) {
        await this.syncShowEpisodes(showId);
      }

      console.log(`Synced show ${showId}`);
    } catch (error) {
      console.error(`Failed to sync show ${showId}:`, error);
      throw error;
    }
  }

  /**
   * Sync episodes for a show
   */
  private async syncShowEpisodes(showId: number): Promise<void> {
    try {
      // Get total episode count and next episode
      const [episodeData, nextEpisode] = await Promise.all([
        tmdbService.getTotalEpisodeCount(showId),
        tmdbService.getNextEpisode(showId, 1, 1) // This will be improved with actual progress
      ]);

      // Store episode data (future: in episodes table)
      console.log(`Synced episodes for show ${showId}:`, episodeData);
    } catch (error) {
      console.error(`Failed to sync episodes for show ${showId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule the next sync
   */
  private scheduleNextSync(): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
    }

    const nextSyncTime = Date.now() + this.SYNC_INTERVAL;
    this.status.nextSync = new Date(nextSyncTime).toISOString();

    this.syncInterval = setTimeout(() => {
      this.performSync({ includeEpisodes: true });
    }, this.SYNC_INTERVAL);

    console.log(`Next sync scheduled for: ${this.status.nextSync}`);
  }

  /**
   * Update sync status and save to storage
   */
  private updateSyncStatus(success: boolean, error?: string): void {
    this.status.isRunning = false;
    this.status.lastSync = new Date().toISOString();

    if (success) {
      this.status.errorCount = 0;
      this.status.lastError = null;
      this.scheduleNextSync();
    } else {
      this.status.errorCount++;
      this.status.lastError = error || 'Unknown error';
      
      // Exponential backoff for retries
      const backoffDelay = Math.min(1000 * 60 * Math.pow(2, this.status.errorCount), 1000 * 60 * 60); // Max 1 hour
      const nextRetryTime = Date.now() + backoffDelay;
      this.status.nextSync = new Date(nextRetryTime).toISOString();

      setTimeout(() => {
        if (this.status.errorCount < this.MAX_RETRIES) {
          this.performSync({ includeEpisodes: true });
        } else {
          console.error('Max sync retries exceeded, stopping automatic sync');
          this.scheduleNextSync(); // Resume normal schedule
        }
      }, backoffDelay);
    }

    // Save status to storage
    this.saveSyncStatus();
  }

  /**
   * Load sync status from storage
   */
  private async loadSyncStatus(): Promise<SyncStatus | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('syncStatus');
        return stored ? JSON.parse(stored) : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to load sync status:', error);
      return null;
    }
  }

  /**
   * Save sync status to storage
   */
  private async saveSyncStatus(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('syncStatus', JSON.stringify(this.status));
      }
    } catch (error) {
      console.error('Failed to save sync status:', error);
    }
  }

  /**
   * Check if a sync is needed based on last sync time
   */
  shouldSync(): boolean {
    // Reload status from storage first
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('syncStatus');
        if (stored) {
          const storedStatus = JSON.parse(stored);
          if (storedStatus.lastSync) {
            const lastSyncTime = new Date(storedStatus.lastSync).getTime();
            const now = Date.now();
            return now - lastSyncTime >= this.SYNC_INTERVAL;
          }
        }
      }
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
    
    // Fallback to current status
    if (!this.status.lastSync) {
      return true; // Never synced
    }

    const lastSyncTime = new Date(this.status.lastSync).getTime();
    const now = Date.now();
    return now - lastSyncTime >= this.SYNC_INTERVAL;
  }

  /**
   * Get human-readable sync status
   */
  getStatusText(): string {
    if (this.status.isRunning) {
      return 'Syncing...';
    }

    if (this.status.lastError) {
      return `Error: ${this.status.lastError}`;
    }

    if (this.status.lastSync) {
      const lastSyncTime = new Date(this.status.lastSync);
      const now = new Date();
      const diffMs = now.getTime() - lastSyncTime.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        return 'Recently synced';
      } else if (diffHours < 24) {
        return `Synced ${diffHours}h ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `Synced ${diffDays}d ago`;
      }
    }

    return 'Never synced';
  }
}

export const syncService = new SyncService();
