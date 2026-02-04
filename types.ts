// 🟢 核心修复：使用 const as const 模拟枚举
// 这样既可以用 MusicSource.NETEASE (值)，也可以当做 string 类型使用
export const MusicSource = {
  NETEASE: 'netease',
  YOUTUBE: 'youtube',
  BILIBILI: 'bilibili',
  LOCAL: 'local',
  PLUGIN: 'plugin'
} as const;

// 导出类型：'netease' | 'youtube' | ...
export type MusicSource = typeof MusicSource[keyof typeof MusicSource];

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  
  // 🟢 核心修复：统一使用 cover (App.tsx 要求的)
  cover: string;     
  coverUrl?: string; // 兼容旧代码，可选
  
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

// 保留其他定义
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
