// 🟢 修改：使用字符串联合类型，兼容新代码的 'netease' | 'youtube' 写法
export type MusicSource = 'netease' | 'youtube' | 'bilibili' | 'local' | 'plugin';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  
  // 🟢 兼容性修复：新代码使用 cover，旧定义使用 coverUrl
  // 我们同时保留两者，或者在获取数据时做映射
  cover: string;     // 新代码 (App.tsx) 使用这个
  coverUrl?: string; // 保留旧定义，设为可选
  
  source: MusicSource;
  
  // 其他原有字段保留
  artistId?: string;
  duration?: number;
  audioUrl?: string; 
  mvId?: string;
  isGray?: boolean;
  fee?: number; // 0: free, 1: VIP
  vip?: boolean; // 新代码使用的字段
  lyric?: string;
}

// --- 以下是你原有的定义 (全部保留) ---

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
