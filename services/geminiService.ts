import { Song, MusicSource } from "../types";

// --- Mock Data Fallback (Used if Backend is offline) ---
const getCover = (id: number) => `https://picsum.photos/300/300?random=${id}`;
const MOCK_LYRICS = `[00:00.00] UniStream Music
[00:02.00] 后端未连接 / Backend Disconnected
[00:05.00] 请运行 node server.js 启动后端服务
[00:10.00] 当前为本地 Mock 模式`;

const MOCK_AUDIO_POOL = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
];

const getMockAudioUrl = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return MOCK_AUDIO_POOL[Math.abs(hash) % MOCK_AUDIO_POOL.length];
};

/**
 * Hybrid Service
 * Tries to connect to localhost:3001 (Real Backend).
 * Falls back to local mock data if fetch fails.
 */
export class HybridMusicService {
  
  private API_BASE_URL = 'http://localhost:3001/api';

  constructor() {
    console.log("Hybrid Music Service Initialized");
  }

  async searchMusic(query: string): Promise<Song[]> {
    try {
        console.log(`Searching: ${query} via Backend...`);
        // Attempt to fetch from real backend
        const response = await fetch(`${this.API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) throw new Error("Backend Error");

        const data = await response.json();
        
        if (data.songs) {
             // Enhance backend data with audio URL fetching logic if needed, 
             // or just map it directly. Here we assume we need to fetch URLs lazily or they are not provided.
             // For list display, we don't need audio URL yet.
             return data.songs.map((s: any) => ({
                 ...s,
                 // If backend didn't return cover, use random
                 coverUrl: s.coverUrl || getCover(Math.floor(Math.random() * 100)),
                 // If backend didn't return audioUrl, we will fetch it when playing
                 audioUrl: s.audioUrl || '', 
                 lyric: MOCK_LYRICS // Backend integration for lyrics is a future task
             }));
        }
    } catch (e) {
        console.warn("Backend unavailable, using local mock data.", e);
    }

    // Fallback Mock Logic
    return [
        { id: `s-1-${query}`, title: `${query}`, artist: "未知艺术家", album: "Mock结果", source: MusicSource.NETEASE, coverUrl: getCover(10), duration: 240, audioUrl: getMockAudioUrl(query+'1'), lyric: MOCK_LYRICS },
        { id: `s-2-${query}`, title: `关于${query}的Mock`, artist: "UniStream", album: "本地演示", source: MusicSource.YOUTUBE, coverUrl: getCover(11), duration: 300, audioUrl: getMockAudioUrl(query+'2'), lyric: MOCK_LYRICS },
    ];
  }

  // New method to fetch real audio URL before playing
  async getRealAudioUrl(song: Song): Promise<string> {
      if (song.audioUrl && song.audioUrl.startsWith('http')) return song.audioUrl;
      
      try {
          const response = await fetch(`${this.API_BASE_URL}/url?id=${song.id}&source=${song.source}`);
          if (response.ok) {
              const data = await response.json();
              if (data.url) return data.url;
          }
      } catch (e) {
          console.warn("Failed to fetch real URL", e);
      }
      return getMockAudioUrl(song.title);
  }

  // Generate recommendations (Keep mocked for now to save API calls)
  async generateLocalRecommendation(tag: string): Promise<{ name: string; description: string; songs: Song[] }> {
      // ... same mock logic as before for recommendations ...
      const timestamp = Date.now();
      const songs: Song[] = [];
      const artists = ["周杰伦", "陈奕迅", "林俊杰"];
      for (let i = 0; i < 6; i++) {
        const artist = artists[Math.floor(Math.random() * artists.length)];
        songs.push({
            id: `rec-${timestamp}-${i}`,
            title: `推荐歌曲 ${i + 1}`,
            artist: artist,
            album: "每日推荐",
            coverUrl: getCover(i + 500),
            source: MusicSource.NETEASE,
            duration: 200,
            audioUrl: getMockAudioUrl(String(i)),
            lyric: MOCK_LYRICS
        });
      }
      return {
          name: `今日${tag}精选`,
          description: "基于本地算法随机生成的歌单。",
          songs
      };
  }
}

export const musicService = new HybridMusicService();