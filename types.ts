export enum MusicSource {
  NETEASE = 'NETEASE',
  YOUTUBE = 'YOUTUBE',
  LOCAL = 'LOCAL',
  PLUGIN = 'PLUGIN' // For MusicFree style plugins
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  source: MusicSource;
  duration: number; // in seconds
  audioUrl?: string; 
  isGray?: boolean;
  lyric?: string; // LRC format string
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: Song[];
  coverUrl?: string;
  isSystem?: boolean; // e.g. "My Favorites"
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl: string;
  isVip: boolean;
  platform: 'netease' | 'guest';
  cookie?: string; // Store session cookie
}

export interface MusicPlugin {
    id: string;
    name: string;
    version: string;
    author: string;
    sources: string[]; // e.g., ['kugou', 'bilibili']
    status: 'active' | 'disabled';
}

export type ViewState = 'HOME' | 'SEARCH' | 'LIBRARY' | 'LABS' | 'SETTINGS';