// Unmock the database to use the real implementation
jest.unmock('../database');

import { localDB } from '../database';
import { User, Show, UserShow } from '../../types';

// Get the mock that's already set up by the shared configuration
const mockExpoSQLite = require('expo-sqlite');

// Create a SQL.js-based database class
class SQLJSDatabase {
  private db: any = null;
  private initialized = false;
  
  async ensureInitialized() {
    if (!this.initialized) {
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();
      this.db = new SQL.Database();
      this.initialized = true;
    }
  }

  async execAsync(sql: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      this.db.exec(sql);
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  async runAsync(sql: string, params: any[] = []): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      
      // Bind parameters if provided
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      stmt.run();
      stmt.free();
    } catch (error) {
      throw error;
    }
  }

  async getFirstAsync(sql: string, params: any[] = []): Promise<any | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      
      // Bind parameters if provided
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      // Check if statement has results
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result;
      } else {
        stmt.free();
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async getAllAsync(sql: string, params: any[] = []): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      
      // Bind parameters if provided
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      const results: any[] = [];
      
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      
      stmt.free();
      return results;
    } catch (error) {
      return [];
    }
  }

  async closeAsync(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Override the existing mock with our SQL.js implementation
mockExpoSQLite.openDatabaseAsync.mockImplementation(async () => {
  return new SQLJSDatabase();
});

describe('LocalDatabase', () => {
  beforeEach(async () => {
    // Ensure each test gets a fresh database by re-initializing
    await localDB.close();
    await localDB.init();
  });

  afterEach(async () => {
    // Close the database after each test
    await localDB.close();
  });

  // Helper to create mock user
  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
    preferences: {},
    ...overrides,
  });

  // Helper to create mock show
  const createMockShow = (overrides: Partial<Show> = {}): Show => ({
    id: 1,
    tmdb_id: 1,
    title: 'Test Show',
    poster_path: '/test.jpg',
    backdrop_path: '/test_backdrop.jpg',
    overview: 'Test overview',
    first_air_date: '2024-01-01',
    vote_average: 8.5,
    genre_ids: [1, 2],
    ...overrides,
  });

  describe('User operations', () => {
    describe('createUser', () => {
      it('should create user successfully', async () => {
        const result = await localDB.createUser('testuser', 'test@example.com');

        expect(result.username).toBe('testuser');
        expect(result.email).toBe('test@example.com');
        expect(result.id).toBeDefined();
        expect(result.created_at).toBeDefined();
        expect(result.preferences).toEqual({});
      });

      it('should create user without email', async () => {
        const result = await localDB.createUser('testuser2');

        expect(result.username).toBe('testuser2');
        expect(result.email).toBe('');
        expect(result.id).toBeDefined();
      });

      it('should handle duplicate username', async () => {
        await localDB.createUser('duplicateuser', 'test@example.com');
        
        // This should throw due to SQLite constraint error
        await expect(async () => {
          await localDB.createUser('duplicateuser', 'other@example.com');
        }).rejects.toThrow();
      });
    });

    describe('getUserByUsername', () => {
      it('should return user when found', async () => {
        const createdUser = await localDB.createUser('findme', 'find@example.com');

        const result = await localDB.getUserByUsername('findme');

        expect(result).toBeTruthy();
        expect(result?.username).toBe('findme');
        expect(result?.email).toBe('find@example.com');
        expect(result?.id).toBe(createdUser.id);
      });

      it('should return null when user not found', async () => {
        const result = await localDB.getUserByUsername('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('getUser', () => {
      it('should return user when found by ID', async () => {
        const createdUser = await localDB.createUser('iduser', 'id@example.com');

        const result = await localDB.getUser(createdUser.id);

        expect(result).toBeTruthy();
        expect(result?.username).toBe('iduser');
        expect(result?.email).toBe('id@example.com');
        expect(result?.id).toBe(createdUser.id);
      });

      it('should return null when user not found', async () => {
        const result = await localDB.getUser('nonexistent-id');

        expect(result).toBeNull();
      });
    });
  });

  describe('Show operations', () => {
    describe('cacheShow', () => {
      it('should cache show successfully', async () => {
        const mockShow = createMockShow();

        // Should not throw
        await localDB.cacheShow(mockShow);

        // Verify it was cached
        const result = await localDB.getShow(mockShow.tmdb_id);
        expect(result).toBeTruthy();
        expect(result?.tmdb_id).toBe(mockShow.tmdb_id);
        expect(result?.title).toBe(mockShow.title);
      });

      it('should update existing show', async () => {
        const mockShow = createMockShow();
        await localDB.cacheShow(mockShow);

        // Update the show
        const updatedShow = { ...mockShow, title: 'Updated Title' };
        await localDB.cacheShow(updatedShow);

        // Get updated show
        const result = await localDB.getShow(mockShow.tmdb_id);
        expect(result?.title).toBe('Updated Title');
      });
    });

    describe('getShow', () => {
      it('should return show when found', async () => {
        const mockShow = createMockShow();
        await localDB.cacheShow(mockShow);

        const result = await localDB.getShow(mockShow.tmdb_id);

        expect(result).toBeTruthy();
        expect(result?.tmdb_id).toBe(mockShow.tmdb_id);
        expect(result?.title).toBe(mockShow.title);
        expect(result?.overview).toBe(mockShow.overview);
      });

      it('should return null when show not found', async () => {
        const result = await localDB.getShow(999);

        expect(result).toBeNull();
      });
    });
  });

  describe('UserShow operations', () => {
    let user: User;
    let show: Show;

    beforeEach(async () => {
      user = await localDB.createUser('showsuser', 'shows@example.com');
      show = createMockShow({tmdb_id: 123});
      await localDB.cacheShow(show);
    });

    describe('addUserShow', () => {
      it('should add user show successfully', async () => {
        const result = await localDB.addUserShow(user.id, show.tmdb_id, 'watching');

        expect(result.user_id).toBe(user.id);
        expect(result.show_id).toBe(show.tmdb_id);
        expect(result.status).toBe('watching');
        expect(result.current_season).toBe(1);
        expect(result.current_episode).toBe(1);
        expect(result.id).toBeDefined();
      });

      it('should add user show with default status', async () => {
        const result = await localDB.addUserShow(user.id, show.tmdb_id);

        expect(result.status).toBe('want_to_watch');
      });
    });

    describe('getUserShows', () => {
      it('should return user shows', async () => {
        await localDB.addUserShow(user.id, show.tmdb_id, 'watching');
        
        const result = await localDB.getUserShows(user.id);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].user_id).toBe(user.id);
        expect(result[0].status).toBe('watching');
      });

      it('should return empty array when no shows', async () => {
        const emptyUser = await localDB.createUser('emptyuser', 'empty@example.com');
        const result = await localDB.getUserShows(emptyUser.id);

        expect(result).toHaveLength(0);
      });

      it('should return only shows for specific user', async () => {
        const otherUser = await localDB.createUser('otheruser', 'other@example.com');
        
        await localDB.addUserShow(user.id, show.tmdb_id, 'watching');
        await localDB.addUserShow(otherUser.id, show.tmdb_id, 'completed');

        const userShows = await localDB.getUserShows(user.id);
        const otherUserShows = await localDB.getUserShows(otherUser.id);

        expect(userShows.length).toBeGreaterThan(0);
        expect(userShows[0].status).toBe('watching');
        
        expect(otherUserShows.length).toBeGreaterThan(0);
        expect(otherUserShows[0].status).toBe('completed');
      });
    });
  });

  describe('Database integrity', () => {
    it('should maintain data across operations', async () => {
      // Create user
      const user = await localDB.createUser('integrityuser', 'integrity@example.com');
      
      // Cache show
      const show = createMockShow({tmdb_id: 456});
      await localDB.cacheShow(show);
      
      // Add user show
      await localDB.addUserShow(user.id, show.tmdb_id, 'watching');
      
      // Verify all data is still accessible
      const retrievedUser = await localDB.getUser(user.id);
      const retrievedShow = await localDB.getShow(show.tmdb_id);
      const userShows = await localDB.getUserShows(user.id);
      
      expect(retrievedUser).toBeTruthy();
      expect(retrievedShow).toBeTruthy();
      expect(userShows.length).toBeGreaterThan(0);
    });
  });
});
