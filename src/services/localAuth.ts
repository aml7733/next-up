import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { localDB } from './database';

const CURRENT_USER_KEY = '@nextup:current_user';

class LocalAuthService {
  private currentUser: User | null = null;

  async init(): Promise<void> {
    try {
      // Load current user from storage
      const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  }

  async signUp(username: string, email?: string): Promise<{ user: User | null; error: string | null }> {
    try {
      // Check if username already exists
      const existingUser = await localDB.getUserByUsername(username);
      if (existingUser) {
        return { user: null, error: 'Username already exists' };
      }

      // Create new user
      const user = await localDB.createUser(username, email);
      
      // Set as current user
      await this.setCurrentUser(user);
      
      return { user, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error: 'Failed to create account' };
    }
  }

  async signIn(username: string): Promise<{ user: User | null; error: string | null }> {
    try {
      // Find user by username
      const user = await localDB.getUserByUsername(username);
      if (!user) {
        return { user: null, error: 'User not found' };
      }

      // Set as current user
      await this.setCurrentUser(user);
      
      return { user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: 'Failed to sign in' };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      this.currentUser = null;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: 'Failed to sign out' };
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    if (this.currentUser) return true;
    
    try {
      const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return true;
      }
    } catch (error) {
      console.error('Failed to check authentication:', error);
    }
    
    return false;
  }

  private async setCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  // Helper method to get current user ID (commonly needed)
  getCurrentUserId(): string | null {
    return this.currentUser?.id || null;
  }

  // Helper method to switch users (for testing or multi-user support)
  async switchUser(username: string): Promise<{ user: User | null; error: string | null }> {
    return this.signIn(username);
  }

  // Get all local users (for user switching UI)
  async getAllUsers(): Promise<User[]> {
    try {
      // This would require adding a getAllUsers method to the database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }
}

// Singleton instance
export const localAuth = new LocalAuthService();
