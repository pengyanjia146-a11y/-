import { Song, MusicSource } from "../types";

// --- Mock Data Fallback (Used if Backend is offline) ---
const getCover = (id: number) => `https://picsum.photos/300/300?random=${id}`;
const MOCK_LYRICS = `[00:00.00] UniStream Music
[00:02.00] 后端未连接 / Backend Disconnected
[00:05.00] 请运行 node server.js 启动后端服务
[00:08.00] 手机端请确保连接到电脑 IP
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
 * Tries to connect to Backend.
 * Falls back to local mock data if fetch fails.
 */
export class HybridMusicService {
  
  // 重要：在 Android 真机上，localhost 指向的是手机本身。
  // 打包 APK 前，请将此处的 IP 更改为您电脑的局域网 IP (例如 192.168.1.5:3001)
  private API_BASE_URL = 'http://localhost:3001/api';

  constructor() {
    console.log("Hybrid Music Service Initialized");
  }
  
  // 允许在运行时修改 API 地址 (例如从设置页面)
  setBaseUrl(url: string) {
      this.API_BASE_URL = url;
  }

  async searchMusic(query: string): Promise<Song[]> {
    try {
        console.log(`Searching: ${query} via Backend (${this.API_BASE_URL})...`);
        const response = await fetch(`${this.API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) throw new Error("Backend Error");

        const data = await response.json();
        
        if (data.songs) {
             return data.songs.map((s: any) => ({
                 ...s,
                 coverUrl: s.coverUrl || getCover(Math.floor(Math.random() * 100)),
                 audioUrl: s.audioUrl || '', 
                 lyric: MOCK_LYRICS 
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

  async generateLocalRecommendation(tag: string): Promise<{ name: string; description: string; songs: Song[] }> {
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