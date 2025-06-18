import { create } from 'zustand';
import { User, UserShow } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // TODO: Implement Supabase authentication
      console.log('Sign in:', email);
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  signUp: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // TODO: Implement Supabase authentication
      console.log('Sign up:', email);
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  signOut: async () => {
    set({ isLoading: true });
    try {
      // TODO: Implement Supabase sign out
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
