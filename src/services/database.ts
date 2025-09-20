import * as SQLite from 'expo-sqlite';
import { Show, UserShow, Episode, User, WatchStatus } from '../types';

// Database name and version
const DB_NAME = 'nextup.db';
// Increment DB_VERSION when adding a new migration. Keep migrations array in sync.
const DB_VERSION = 2;

interface Migration {
  toVersion: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

// Ordered list of migrations. Each moves schema from previous version to toVersion.
const migrations: Migration[] = [
  {
    toVersion: 2,
    up: async (db) => {
      // Helper to add column only if it doesn't already exist
      const addColumnIfNotExists = async (table: string, column: string, ddl: string) => {
        try {
          const cols = await db.getAllAsync(`PRAGMA table_info(${table});`) as any[];
          const exists = cols.some(c => c.name === column);
          if (!exists) {
            await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${ddl};`);
          }
        } catch (e) {
          console.warn(`addColumnIfNotExists failed for ${table}.${column}:`, e);
        }
      };

      // Add new columns to user_shows if they don't exist (quietly)
      await addColumnIfNotExists('user_shows', 'watched_count', 'watched_count INTEGER DEFAULT 0');
      await addColumnIfNotExists('user_shows', 'last_watched_at', 'last_watched_at TEXT');
      await addColumnIfNotExists('user_shows', 'has_new_season', 'has_new_season INTEGER DEFAULT 0');

      // show_seasons meta cache
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS show_seasons (
          id INTEGER PRIMARY KEY,
          show_id INTEGER NOT NULL,
            season_number INTEGER NOT NULL,
            episode_count INTEGER DEFAULT 0,
            last_air_date TEXT,
            last_synced_at TEXT,
            UNIQUE(show_id, season_number)
        );
      `);

      // activity log
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS activity (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          show_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          season INTEGER,
          episode INTEGER,
          meta TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (show_id) REFERENCES shows (tmdb_id)
        );
      `);
    }
  }
];

class LocalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
  await this.createTables();
  await this.runMigrations();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Users table (local auth)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        preferences TEXT DEFAULT '{}'
      );
    `);

    // Shows table (cached from TMDB)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS shows (
        id INTEGER PRIMARY KEY,
        tmdb_id INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        poster_path TEXT,
        backdrop_path TEXT,
        overview TEXT,
        first_air_date TEXT,
        status TEXT,
        seasons INTEGER DEFAULT 0,
        vote_average REAL DEFAULT 0,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

  // User shows (tracking)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_shows (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        show_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'want_to_watch',
        current_episode INTEGER DEFAULT 1,
        current_season INTEGER DEFAULT 1,
        rating INTEGER,
        notes TEXT,
        added_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    watched_count INTEGER DEFAULT 0,
    last_watched_at TEXT,
    has_new_season INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (show_id) REFERENCES shows (tmdb_id),
        UNIQUE(user_id, show_id)
      );
    `);

  // Episodes table (cached from TMDB)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY,
        tmdb_id INTEGER,
        show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        name TEXT,
        overview TEXT,
        air_date TEXT,
        still_path TEXT,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (show_id) REFERENCES shows (id),
        UNIQUE(show_id, season_number, episode_number)
      );
    `);

  // User episode progress
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_episodes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        watched BOOLEAN DEFAULT FALSE,
        watched_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (show_id) REFERENCES shows (id),
        UNIQUE(user_id, show_id, season_number, episode_number)
      );
    `);
  }

  private async getCurrentUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
    // Use PRAGMA user_version to store schema version
    const row = await db.getFirstAsync('PRAGMA user_version;') as any;
    return row?.user_version ? Number(row.user_version) : 0;
  }

  private async setUserVersion(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
    await db.execAsync(`PRAGMA user_version = ${version};`);
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db;
    try {
      const current = await this.getCurrentUserVersion(db);
      if (current >= DB_VERSION) {
        return; // Up to date
      }
      // Apply migrations in order
      for (const m of migrations) {
        if (m.toVersion > current && m.toVersion <= DB_VERSION) {
          console.log(`Applying migration to version ${m.toVersion}`);
          await m.up(db);
          await this.setUserVersion(db, m.toVersion);
        }
      }
      console.log('Migrations complete');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // User operations
  async createUser(username: string, email?: string): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.runAsync(
      'INSERT INTO users (id, username, email) VALUES (?, ?, ?)',
      [id, username, email || '']
    );

    const user = {
      id,
      username,
      email: email || '',
      created_at: new Date().toISOString(),
      preferences: {}
    };
    
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM users WHERE id = ?',
      [id]
    ) as any;

    if (!result) return null;

    return {
      id: result.id,
      username: result.username,
      email: result.email,
      created_at: result.created_at,
      preferences: JSON.parse(result.preferences || '{}')
    };
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM users WHERE username = ?',
      [username]
    ) as any;

    if (!result) return null;

    return {
      id: result.id,
      username: result.username,
      email: result.email,
      created_at: result.created_at,
      preferences: JSON.parse(result.preferences || '{}')
    };
  }

  // Show operations
  async cacheShow(show: Show): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      INSERT OR REPLACE INTO shows 
      (tmdb_id, title, poster_path, backdrop_path, overview, first_air_date, status, seasons, vote_average, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      show.tmdb_id,
      show.title,
      show.poster_path || '',
      show.backdrop_path || '',
      show.overview,
      show.first_air_date,
      'unknown', // We'll update this with more detailed status later
      0, // We'll update this with season count
      show.vote_average
    ]);
  }

  async getShow(tmdbId: number): Promise<Show | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM shows WHERE tmdb_id = ?',
      [tmdbId]
    ) as any;

    if (!result) return null;

    return {
      id: result.id,
      tmdb_id: result.tmdb_id,
      title: result.title,
      poster_path: result.poster_path,
      backdrop_path: result.backdrop_path,
      overview: result.overview,
      first_air_date: result.first_air_date,
      vote_average: result.vote_average,
      genre_ids: [] // We'll add genre caching later
    };
  }

  async searchCachedShows(query: string): Promise<Show[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(
      'SELECT * FROM shows WHERE title LIKE ? ORDER BY vote_average DESC LIMIT 20',
      [`%${query}%`]
    ) as any[];

    return results.map(result => ({
      id: result.id,
      tmdb_id: result.tmdb_id,
      title: result.title,
      poster_path: result.poster_path,
      backdrop_path: result.backdrop_path,
      overview: result.overview,
      first_air_date: result.first_air_date,
      vote_average: result.vote_average,
      genre_ids: []
    }));
  }

  // User show tracking operations
  async addUserShow(userId: string, showId: number, status: WatchStatus = 'want_to_watch'): Promise<UserShow> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `user_show_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.runAsync(`
      INSERT OR REPLACE INTO user_shows 
      (id, user_id, show_id, status, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, userId, showId, status]);

    return {
      id,
      user_id: userId,
      show_id: showId,
      status,
      current_episode: 1,
      current_season: 1,
      rating: undefined,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async getUserShows(userId: string): Promise<UserShow[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT us.*, s.title, s.poster_path, s.tmdb_id
      FROM user_shows us
      JOIN shows s ON us.show_id = s.tmdb_id
      WHERE us.user_id = ?
      ORDER BY us.updated_at DESC
    `, [userId]) as any[];

    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      show_id: result.show_id,
      status: result.status,
      current_episode: result.current_episode,
      current_season: result.current_season,
      rating: result.rating,
      notes: result.notes || '',
      created_at: result.added_at, // Map added_at to created_at
      updated_at: result.updated_at,
      // Include show details for convenience
      show: {
        id: result.show_id,
        tmdb_id: result.tmdb_id,
        title: result.title,
        poster_path: result.poster_path,
        backdrop_path: '',
        overview: '',
        first_air_date: '',
        vote_average: 0,
        genre_ids: []
      }
    }));
  }

  async updateUserShowProgress(userId: string, showId: number, season: number, episode: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      UPDATE user_shows 
      SET current_season = ?, current_episode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND show_id = ?
    `, [season, episode, userId, showId]);
  }

  async updateUserShowStatus(userId: string, showId: number, status: WatchStatus): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      UPDATE user_shows 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND show_id = ?
    `, [status, userId, showId]);
  }

  async deleteUserShow(userId: string, showId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      DELETE FROM user_shows 
      WHERE user_id = ? AND show_id = ?
    `, [userId, showId]);
  }

  // Data export/import for backup
  async exportData(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const users = await this.db.getAllAsync('SELECT * FROM users');
    const shows = await this.db.getAllAsync('SELECT * FROM shows');
    const userShows = await this.db.getAllAsync('SELECT * FROM user_shows');
    const episodes = await this.db.getAllAsync('SELECT * FROM episodes');
    const userEpisodes = await this.db.getAllAsync('SELECT * FROM user_episodes');
    let showSeasons: any[] = [];
    let activity: any[] = [];
    try { showSeasons = await this.db.getAllAsync('SELECT * FROM show_seasons'); } catch {}
    try { activity = await this.db.getAllAsync('SELECT * FROM activity'); } catch {}

    return {
      version: DB_VERSION,
      exported_at: new Date().toISOString(),
      users,
      shows,
      user_shows: userShows,
      episodes,
      user_episodes: userEpisodes,
      show_seasons: showSeasons,
      activity
    };
  }

  async importData(data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // TODO: Implement data import with conflict resolution
    console.log('Data import not yet implemented', data);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  async cacheSeasonEpisodes(showId: number, seasonNumber: number, episodes: Episode[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const insertStmt = `INSERT OR REPLACE INTO episodes 
      (tmdb_id, show_id, season_number, episode_number, name, overview, air_date, still_path, cached_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    for (const ep of episodes) {
      await this.db.runAsync(insertStmt, [
        ep.id,
        showId,
        seasonNumber,
        ep.episode_number,
        ep.name,
        ep.overview,
        ep.air_date,
        ep.still_path || ''
      ]);
    }
    // Persist season metadata (episode_count, last_air_date, last_synced_at) if table exists
    try {
      const lastAir = episodes
        .map(e => e.air_date)
        .filter(Boolean)
        .sort()
        .pop() || null;
      await this.db.runAsync(
        `INSERT OR REPLACE INTO show_seasons (show_id, season_number, episode_count, last_air_date, last_synced_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [showId, seasonNumber, episodes.length, lastAir]
      );
    } catch (e) {
      // Table might not exist on older schema; ignore
      console.warn('show_seasons upsert failed (non-fatal):', e);
    }
  }

  async getSeasonEpisodes(showId: number, seasonNumber: number): Promise<Episode[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.db.getAllAsync(
      `SELECT * FROM episodes WHERE show_id = ? AND season_number = ? ORDER BY episode_number ASC`,
      [showId, seasonNumber]
    ) as any[];
    return rows.map(r => ({
      id: r.tmdb_id || r.id,
      episode_number: r.episode_number,
      season_number: r.season_number,
      name: r.name || '',
      overview: r.overview || '',
      air_date: r.air_date || '',
      still_path: r.still_path || ''
    }));
  }

  async getSeasonMeta(showId: number, seasonNumber: number): Promise<{ episode_count: number; last_synced_at: string | null } | null> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const row = await this.db.getFirstAsync(
        `SELECT episode_count, last_synced_at FROM show_seasons WHERE show_id = ? AND season_number = ?`,
        [showId, seasonNumber]
      ) as any;
      if (!row) return null;
      return { episode_count: row.episode_count || 0, last_synced_at: row.last_synced_at || null };
    } catch {
      return null;
    }
  }

  async markEpisodeWatched(userId: string, showId: number, season: number, episode: number, watchedAt = new Date()): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const id = `ue_${userId}_${showId}_${season}_${episode}`;
    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_episodes (id, user_id, show_id, season_number, episode_number, watched, watched_at)
       VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
      [id, userId, showId, season, episode, watchedAt.toISOString()]
    );
  }

  async getWatchedEpisodes(userId: string, showId: number): Promise<{ season_number: number; episode_number: number; watched_at: string }[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.db.getAllAsync(
      `SELECT season_number, episode_number, watched_at
       FROM user_episodes
       WHERE user_id = ? AND show_id = ? AND watched = TRUE
       ORDER BY season_number ASC, episode_number ASC`,
      [userId, showId]
    ) as any[];
    return rows.map(r => ({
      season_number: r.season_number,
      episode_number: r.episode_number,
      watched_at: r.watched_at || ''
    }));
  }

  async updateUserShowDerivedFields(userId: string, showId: number, watchedCount: number, lastWatchedAt: string | null): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      `UPDATE user_shows
       SET watched_count = ?, last_watched_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND show_id = ?`,
      [watchedCount, lastWatchedAt, userId, showId]
    );
  }

  /**
   * Compute the highest contiguous (season, episode) pointer starting at (1,1)
   * given the set of watched episodes. Assumes seasons increment by 1 and
   * episode numbers start at 1. Stops at first gap.
   */
  computeContiguousPointer(watched: { season_number: number; episode_number: number }[], currentSeason: number, currentEpisode: number): { season: number; episode: number } {
    // If empty, keep existing pointer
    if (!watched.length) {
      return { season: currentSeason, episode: currentEpisode };
    }
    let expectedSeason = 1;
    let expectedEpisode = 1;
    let pointer = { season: currentSeason, episode: currentEpisode };
    for (const w of watched) {
      if (w.season_number === expectedSeason && w.episode_number === expectedEpisode) {
        // Advance pointer to this watched episode (contiguous)
        pointer = { season: w.season_number, episode: w.episode_number };
        // Move expected forward
        expectedEpisode += 1;
      } else if (w.season_number === expectedSeason && w.episode_number > expectedEpisode) {
        // Gap in same season
        break;
      } else if (w.season_number > expectedSeason) {
        // Move to next season only if we ended exactly at end-of-season; we don't know season lengths here so stop.
        break;
      }
      // Season rollover heuristic: if too many episodes? Lacking season length we stop at gaps anyway.
      // More robust logic will require season episode counts.
    }
    return pointer;
  }

  async getWatchedEpisodesCount(userId: string, showId: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.db.getFirstAsync(
      `SELECT COUNT(*) as cnt FROM user_episodes WHERE user_id = ? AND show_id = ? AND watched = TRUE`,
      [userId, showId]
    ) as any;
    return row?.cnt ? Number(row.cnt) : 0;
  }

  async getNextEpisodeFromCache(showId: number, currentSeason: number, currentEpisode: number, skipUnaired = true): Promise<Episode | null> {
    if (!this.db) throw new Error('Database not initialized');

    // Try next episode in same season
    let row = await this.db.getFirstAsync(
      `SELECT * FROM episodes WHERE show_id = ? AND season_number = ? AND episode_number = ?`,
      [showId, currentSeason, currentEpisode + 1]
    ) as any;

    const now = new Date();
    const isAired = (r: any) => !skipUnaired || !r?.air_date || new Date(r.air_date) <= now;

    if (row && isAired(row)) {
      return {
        id: row.tmdb_id || row.id,
        episode_number: row.episode_number,
        season_number: row.season_number,
        name: row.name || '',
        overview: row.overview || '',
        air_date: row.air_date || '',
        still_path: row.still_path || ''
      };
    }

    // Find first episode of next season that is aired
    row = await this.db.getFirstAsync(
      `SELECT * FROM episodes WHERE show_id = ? AND season_number = ? AND episode_number = 1`,
      [showId, currentSeason + 1]
    ) as any;

    if (row && isAired(row)) {
      return {
        id: row.tmdb_id || row.id,
        episode_number: row.episode_number,
        season_number: row.season_number,
        name: row.name || '',
        overview: row.overview || '',
        air_date: row.air_date || '',
        still_path: row.still_path || ''
      };
    }

    return null;
  }
}

// Singleton instance
export const localDB = new LocalDatabase();
