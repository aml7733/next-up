import * as SQLite from 'expo-sqlite';
import { Show, UserShow, Episode, User, WatchStatus } from '../types';

// Database name and version
const DB_NAME = 'nextup.db';
const DB_VERSION = 1;

class LocalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      console.log('Database initialized successfully');
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
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (show_id) REFERENCES shows (id)
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

    console.log('Database tables created successfully');
  }

  // User operations
  async createUser(username: string, email?: string): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.runAsync(
      'INSERT INTO users (id, username, email) VALUES (?, ?, ?)',
      [id, username, email || '']
    );

    return {
      id,
      username,
      email: email || '',
      created_at: new Date().toISOString(),
      preferences: {}
    };
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
      JOIN shows s ON us.show_id = s.id
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

  // Data export/import for backup
  async exportData(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const users = await this.db.getAllAsync('SELECT * FROM users');
    const shows = await this.db.getAllAsync('SELECT * FROM shows');
    const userShows = await this.db.getAllAsync('SELECT * FROM user_shows');
    const episodes = await this.db.getAllAsync('SELECT * FROM episodes');
    const userEpisodes = await this.db.getAllAsync('SELECT * FROM user_episodes');

    return {
      version: DB_VERSION,
      exported_at: new Date().toISOString(),
      users,
      shows,
      user_shows: userShows,
      episodes,
      user_episodes: userEpisodes
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
}

// Singleton instance
export const localDB = new LocalDatabase();
