import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const authService = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },
};

// Database functions
export const dbService = {
  // User shows operations
  getUserShows: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_shows')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  addUserShow: async (userShow: any) => {
    const { data, error } = await supabase
      .from('user_shows')
      .insert(userShow)
      .select();
    return { data, error };
  },

  updateUserShow: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_shows')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  deleteUserShow: async (id: string) => {
    const { error } = await supabase
      .from('user_shows')
      .delete()
      .eq('id', id);
    return { error };
  },
};
