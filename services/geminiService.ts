import { CapacitorHttp } from '@capacitor/core';
import { Song, MusicSource } from "../types";

export class ClientSideService {

  // Netease Headers to mimic a browser
  private neteaseHeaders = {
    'Referer': 'https://music.163.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': 'os=pc'
  };

  // Invidious Instances (Public YouTube APIs)
  // Use a pool of instances to avoid rate limits or downtime
  private invidiousInstances = [
      'https://inv.tux.pizza',
      'https://vid.uff.net',
      'https://inv.nadeko.net',
      'https://invidious.jing.rocks',
      'https://yt.artemislena.eu'
  ];
  private currentInvInstance = this.invidiousInstances[0];

  constructor() {
    console.log("Client-Side Service Initialized (No Backend Mode)");
    // Pick a random instance on startup to distribute load
    this.currentInvInstance = this.invidiousInstances[Math.floor(Math.random() * this.invidiousInstances.length)];
  }
  
  setBaseUrl(url: string) {
      // No-op
  }

  // --- Search Logic ---

  async searchMusic(query: string): Promise<Song[]> {
    try {
        const [neteaseSongs, youtubeSongs] = await Promise.all([
            this.searchNetease(query),
            this.searchYouTube(query)
        ]);
        return [...neteaseSongs, ...youtubeSongs];
    } catch (e) {
        console.warn("Search failed", e);
        return [];
    }
  }

  private async searchNetease(keyword: string): Promise<Song[]> {
      try {
          const url = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(keyword)}&type=1&offset=0&total=true&limit=10`;
          
          const response = await CapacitorHttp.get({
              url: url,
              headers: this.neteaseHeaders
          });

          if (response.status === 200 && response.data?.result?.songs) {
              return response.data.result.songs.map((item: any) => ({
                  id: String(item.id),
                  title: item.name,
                  artist: item.artists ? item.artists.map((a: any) => a.name).join('/') : 'Unknown',
                  album: item.album ? item.album.name : '',
                  // Fix Cover HTTPs
                  coverUrl: item.album?.picUrl ? item.album.picUrl.replace(/^http:/, 'https:') : '',
                  source: MusicSource.NETEASE,
                  duration: Math.floor(item.duration / 1000),
                  isGray: false
              }));
          }
      } catch (e) {
          console.error("Netease Direct Search Error", e);
      }
      return [];
  }

  private async searchYouTube(keyword: string): Promise<Song[]> {
      try {
          const url = `${this.currentInvInstance}/api/v1/search?q=${encodeURIComponent(keyword)}&type=video`;
          const response = await CapacitorHttp.get({ url });

          if (response.status === 200 && Array.isArray(response.data)) {
              return response.data.slice(0, 5).map((item: any) => ({
                  id: item.videoId,
                  title: item.title,
                  artist: item.author,
                  album: 'YouTube',
                  coverUrl: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                  source: MusicSource.YOUTUBE,
                  duration: item.lengthSeconds,
                  isGray: false
              }));
          }
      } catch (e) {
          console.error("YouTube Direct Search Error", e);
          this.rotateInstance();
      }
      return [];
  }

  private rotateInstance() {
      const idx = this.invidiousInstances.indexOf(this.currentInvInstance);
      this.currentInvInstance = this.invidiousInstances[(idx + 1) % this.invidiousInstances.length];
      console.log("Rotated Invidious Instance to:", this.currentInvInstance);
  }

  // --- Audio URL Logic ---

  async getRealAudioUrl(song: Song): Promise<string> {
      if (song.source === MusicSource.NETEASE) {
          return this.getNeteaseUrl(song.id);
      } else if (song.source === MusicSource.YOUTUBE) {
          return this.getYouTubeUrl(song.id);
      }
      return '';
  }

  private async getNeteaseUrl(id: string): Promise<string> {
      try {
           const url = `https://music.163.com/api/song/enhance/player/url?id=${id}&ids=[${id}]&br=320000`;
           
           const response = await CapacitorHttp.get({
               url: url,
               headers: this.neteaseHeaders
           });

           if (response.status === 200 && response.data?.data?.[0]?.url) {
               // CRITICAL FIX: Android WebView blocks mixed content (http audio on https app).
               // We MUST replace http with https.
               return response.data.data[0].url.replace(/^http:/, 'https:');
           }
      } catch (e) {
          console.error("Netease URL fetch failed", e);
      }
      return '';
  }

  private async getYouTubeUrl(id: string): Promise<string> {
      // Use 'local=true' to force the traffic through the Invidious instance (acting as proxy)
      // This bypasses Google's direct IP checks and CORS issues.
      // We use 'latest_version' endpoint which redirects to the actual stream.
      return `${this.currentInvInstance}/latest_version?id=${id}&itag=140&local=true`;
  }

  // --- Mock Login APIs ---

  async getLoginKey(): Promise<any> { return { code: 500 }; }
  async createLoginQR(key: string): Promise<any> { return { code: 500 }; }
  async checkLoginQR(key: string): Promise<any> { return { code: 500 }; }
  async getUserStatus(cookie: string): Promise<any> { return { code: 500 }; }

  async generateLocalRecommendation(tag: string): Promise<{ name: string; description: string; songs: Song[] }> {
       return {
          name: `今日${tag}精选`,
          description: "基于本地算法随机生成的歌单。",
          songs: []
      };
  }
}

export const musicService = new ClientSideService();