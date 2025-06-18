// Core Types for Media Tracker App

export interface Show {
  id: number;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  tmdb_id: number;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string;
  still_path?: string;
}

export interface UserShow {
  id: string;
  user_id: string;
  show_id: number;
  status: WatchStatus;
  current_season: number;
  current_episode: number;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type WatchStatus = 'watching' | 'completed' | 'paused' | 'dropped' | 'plan-to-watch';

export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  ShowDetails: { showId: number };
  EpisodeDetails: { showId: number; seasonNumber: number; episodeNumber: number };
};

export type MainTabParamList = {
  CurrentlyWatching: undefined;
  Search: undefined;
  Profile: undefined;
};
