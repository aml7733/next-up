import { create } from 'zustand';
import { User } from '../types';
import { localAuth } from '../services/localAuth';
import { localDB } from '../services/database';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (username: string) => Promise<{ error: string | null }>;
  signUp: (username: string, email?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  
  initialize: async () => {
    set({ isLoading: true });
    try {
      // Initialize database
      await localDB.init();
      
      // Initialize auth and check for existing user
      await localAuth.init();
      const isAuth = await localAuth.isAuthenticated();
      const currentUser = localAuth.getCurrentUser();
      
      set({ 
        user: currentUser, 
        isAuthenticated: isAuth,
        isInitialized: true 
      });
    } catch (error) {
      console.error('App initialization error:', error);
      set({ isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },
  
  signIn: async (username: string) => {
    set({ isLoading: true });
    try {
      const { user, error } = await localAuth.signIn(username);
      if (error) {
        return { error };
      }
      
      set({ user, isAuthenticated: true });
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Failed to sign in' };
    } finally {
      set({ isLoading: false });
    }
  },
  
  signUp: async (username: string, email?: string) => {
    set({ isLoading: true });
    try {
      const { user, error } = await localAuth.signUp(username, email);
      if (error) {
        return { error };
      }
      
      set({ user, isAuthenticated: true });
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Failed to create account' };
    } finally {
      set({ isLoading: false });
    }
  },
  
  signOut: async () => {
    set({ isLoading: true });
    try {
      await localAuth.signOut();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));
