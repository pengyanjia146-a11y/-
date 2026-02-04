import { Song, MusicSource } from "../types";

// Helper to get simulated cover art
const getCover = (id: number) => `https://picsum.photos/300/300?random=${id}`;

// A pool of distinct mock audio files to ensure variety
const AUDIO_POOL = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
];

const MOCK_LYRICS = `[00:00.00] UniStream Music (Local)
[00:02.00] 纯本地逻辑，无 API 延迟
[00:05.00] 
[00:10.00] (Music Starts...)
[00:15.50] 这是一首演示歌曲
[00:18.00] 所有的音源都通过插件直连
[00:22.00] 不需要服务器中转
[00:25.00] 也不需要昂贵的 AI 费用
[00:30.00] 
[00:32.00] 支持 MusicFree 插件格式
[00:36.00] 自由导入，无限扩展
[00:40.00] 网易云、YouTube、Bilibili...
[00:45.00] 只要有插件，就能听
[00:50.00] 
[00:55.00] (Solo...)
[01:05.00] 享受音乐的纯粹
[01:10.00] Enjoy the rhythm
[01:15.00] UniStream Player`;

// Deterministically pick an audio file based on string hash
const getMockAudioUrl = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AUDIO_POOL.length;
  return AUDIO_POOL[index];
};

/**
 * Replaced GeminiService with LocalMusicService
 * No more API calls, purely local mock data generation.
 */
export class LocalMusicService {
  
  constructor() {
    console.log("Local Music Service Initialized (Zero Latency Mode)");
  }

  // Purely random recommendation logic, no AI cost
  async generateLocalRecommendation(tag: string): Promise<{ name: string; description: string; songs: Song[] }> {
    const timestamp = Date.now();
    const count = 5 + Math.floor(Math.random() * 5);
    const songs: Song[] = [];

    const artists = ["周杰伦", "陈奕迅", "林俊杰", "Taylor Swift", "The Weeknd", "G.E.M. 邓紫棋"];
    const sources = [MusicSource.NETEASE, MusicSource.YOUTUBE];

    for (let i = 0; i < count; i++) {
        const artist = artists[Math.floor(Math.random() * artists.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const title = `推荐歌曲 ${i + 1}`;
        songs.push({
            id: `rec-${timestamp}-${i}`,
            title: title,
            artist: artist,
            album: "每日推荐",
            coverUrl: getCover(i + 500),
            source: source,
            duration: 180 + Math.floor(Math.random() * 120),
            audioUrl: getMockAudioUrl(title + artist),
            lyric: MOCK_LYRICS,
            isGray: Math.random() > 0.8 // 20% chance to simulate gray song
        });
    }

    return {
        name: `今日${tag}精选`,
        description: "基于本地算法随机生成的歌单，无 API 调用。",
        songs
    };
  }

  async searchMusic(query: string): Promise<Song[]> {
    // Instant search result simulation
    const results: Song[] = [
        { id: `s-1-${query}`, title: `${query}`, artist: "未知艺术家", album: "搜索结果", source: MusicSource.YOUTUBE, coverUrl: getCover(10), duration: 240, audioUrl: getMockAudioUrl(query+'1'), lyric: MOCK_LYRICS },
        { id: `s-2-${query}`, title: `${query} (Live)`, artist: "现场版", album: "Live Collection", source: MusicSource.NETEASE, coverUrl: getCover(11), duration: 300, audioUrl: getMockAudioUrl(query+'2'), lyric: MOCK_LYRICS },
        { id: `s-3-${query}`, title: `${query} (Remix)`, artist: "DJ Mix", album: "Club Mix", source: MusicSource.PLUGIN, coverUrl: getCover(12), duration: 180, audioUrl: getMockAudioUrl(query+'3'), lyric: MOCK_LYRICS },
        { id: `s-4-${query}`, title: `关于${query}的一切`, artist: "Podcast", album: "电台", source: MusicSource.NETEASE, coverUrl: getCover(13), duration: 600, audioUrl: getMockAudioUrl(query+'4'), lyric: MOCK_LYRICS },
    ];
    return results;
  }
}

export const musicService = new LocalMusicService();