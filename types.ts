// 使用常量对象模拟枚举，兼容性更好
export const MusicSource = {
  NETEASE: 'netease',
  YOUTUBE: 'youtube',
  BILIBILI: 'bilibili',
  LOCAL: 'local',
  PLUGIN: 'plugin'
} as const;

export type MusicSource = typeof MusicSource[keyof typeof MusicSource];

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;       // 统一使用 cover
  coverUrl?: string;   // 兼容字段
  source: MusicSource;
  duration?: number;
  artistId?: string;
  audioUrl?: string; 
  mvId?: string;
  isGray?: boolean;
  fee?: number; 
  vip?: boolean;
  lyric?: string;
}

export interface Artist {
  id: string;
  name: string;
  coverUrl: string;
  description?: string;
  songSize?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: Song[];
  coverUrl?: string;
  isSystem?: boolean;
  creatorId?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl: string;
  isVip: boolean;
  platform: 'netease' | 'guest';
  cookie?: string;
}

export interface MusicPlugin {
    id: string;
    name: string;
    version: string;
    author: string;
    sources: string[];
    status: 'active' | 'disabled';
    srcUrl?: string;
}

export type ViewState = 'HOME' | 'SEARCH' | 'LIBRARY' | 'LABS' | 'SETTINGS' | 'ARTIST_DETAIL';
export type AudioQuality = 'standard' | 'exhigh' | 'lossless';
