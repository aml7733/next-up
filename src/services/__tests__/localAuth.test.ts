// Unmock the localAuth to use the real implementation
jest.unmock('../localAuth');

import { localAuth } from '../localAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDB } from '../database';
import { User } from '../../types';

// Unit tests for LocalAuthService
// Tests local authentication functionality without external dependencies

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../database');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockLocalDB = localDB as jest.Mocked<typeof localDB>;

// Set up mock implementations
beforeAll(() => {
  // Mock localDB methods
  mockLocalDB.init = jest.fn().mockResolvedValue(undefined);
  mockLocalDB.close = jest.fn().mockResolvedValue(undefined);
  mockLocalDB.getUserByUsername = jest.fn();
  mockLocalDB.createUser = jest.fn();
  mockLocalDB.getUser = jest.fn();
  mockLocalDB.cacheShow = jest.fn();
  mockLocalDB.getShow = jest.fn();
  mockLocalDB.addUserShow = jest.fn();
  mockLocalDB.getUserShows = jest.fn();
  mockLocalDB.updateUserShowProgress = jest.fn();
  mockLocalDB.searchCachedShows = jest.fn();
  mockLocalDB.exportData = jest.fn();
  mockLocalDB.importData = jest.fn();

  // Mock AsyncStorage methods
  mockAsyncStorage.getItem = jest.fn();
  mockAsyncStorage.setItem = jest.fn();
  mockAsyncStorage.removeItem = jest.fn();
});

describe('LocalAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localAuth state by setting currentUser to null
    (localAuth as any).currentUser = null;
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

  describe('init', () => {
    it('should initialize without current user', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await localAuth.init();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@nextup:current_user');
      expect(localAuth.getCurrentUser()).toBeNull();
    });

    it('should load existing user from storage', async () => {
      const userData = createMockUser();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(userData));

      await localAuth.init();

      expect(localAuth.getCurrentUser()).toEqual(userData);
    });

    it('should handle storage errors gracefully', async () => {
      // Explicitly reset state
      (localAuth as any).currentUser = null;
      
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await localAuth.init();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load current user:', expect.any(Error));
      expect(localAuth.getCurrentUser()).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('signUp', () => {
    it('should create new user successfully', async () => {
      const newUser = createMockUser({ username: 'newuser', email: 'new@example.com' });
      mockLocalDB.getUserByUsername.mockResolvedValue(null);
      mockLocalDB.createUser.mockResolvedValue(newUser);
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await localAuth.signUp('newuser', 'new@example.com');

      expect(result).toEqual({ user: newUser, error: null });
      expect(mockLocalDB.getUserByUsername).toHaveBeenCalledWith('newuser');
      expect(mockLocalDB.createUser).toHaveBeenCalledWith('newuser', 'new@example.com');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@nextup:current_user', 
        JSON.stringify(newUser)
      );
    });

    it('should handle existing username', async () => {
      const existingUser = createMockUser({ username: 'existinguser' });
      mockLocalDB.getUserByUsername.mockResolvedValue(existingUser);

      const result = await localAuth.signUp('existinguser', 'new@example.com');

      expect(result).toEqual({ user: null, error: 'Username already exists' });
      expect(mockLocalDB.createUser).not.toHaveBeenCalled();
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockLocalDB.getUserByUsername.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await localAuth.signUp('newuser', 'new@example.com');

      expect(result).toEqual({ user: null, error: 'Failed to create account' });
      expect(consoleSpy).toHaveBeenCalledWith('Sign up error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('signIn', () => {
    it('should sign in existing user successfully', async () => {
      const existingUser = createMockUser();
      mockLocalDB.getUserByUsername.mockResolvedValue(existingUser);
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await localAuth.signIn('testuser');

      expect(result).toEqual({ user: existingUser, error: null });
      expect(mockLocalDB.getUserByUsername).toHaveBeenCalledWith('testuser');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@nextup:current_user', 
        JSON.stringify(existingUser)
      );
    });

    it('should handle non-existent user', async () => {
      mockLocalDB.getUserByUsername.mockResolvedValue(null);

      const result = await localAuth.signIn('nonexistent');

      expect(result).toEqual({ user: null, error: 'User not found' });
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockLocalDB.getUserByUsername.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await localAuth.signIn('testuser');

      expect(result).toEqual({ user: null, error: 'Failed to sign in' });
      expect(consoleSpy).toHaveBeenCalledWith('Sign in error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('signOut', () => {
    it('should clear current user and storage', async () => {
      // Set up a current user first
      const user = createMockUser();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(user));
      await localAuth.init();

      mockAsyncStorage.removeItem.mockResolvedValue();

      await localAuth.signOut();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@nextup:current_user');
      expect(localAuth.getCurrentUser()).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await localAuth.signOut();

      expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));
      expect(localAuth.getCurrentUser()).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is signed in', () => {
      expect(localAuth.getCurrentUser()).toBeNull();
    });

    it('should return current user when signed in', async () => {
      const user = createMockUser();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(user));
      
      await localAuth.init();
      
      expect(localAuth.getCurrentUser()).toEqual(user);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is signed in', async () => {
      // Explicitly ensure no user is set and no storage data
      (localAuth as any).currentUser = null;
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await localAuth.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return true when user is signed in', async () => {
      const user = createMockUser();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(user));
      
      const result = await localAuth.isAuthenticated();
      
      expect(result).toBe(true);
    });
  });
});
