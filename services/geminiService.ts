import { Song, MusicSource } from "../types";

export class HybridMusicService {
  
  // APK 调试时，请确保此 IP 是电脑的局域网 IP
  private API_BASE_URL = 'http://localhost:3001/api';

  constructor() {
    console.log("Hybrid Music Service Initialized");
  }
  
  setBaseUrl(url: string) {
      this.API_BASE_URL = url;
  }

  // Helper to get cookie from local storage if logged in
  private getCookie() {
      const savedUser = localStorage.getItem('unistream_user');
      if (savedUser) {
          const user = JSON.parse(savedUser);
          return user.cookie || '';
      }
      return '';
  }

  async searchMusic(query: string): Promise<Song[]> {
    try {
        const cookie = this.getCookie();
        const response = await fetch(`${this.API_BASE_URL}/search?q=${encodeURIComponent(query)}&cookie=${encodeURIComponent(cookie)}`);
        
        if (!response.ok) throw new Error("Backend Error");

        const data = await response.json();
        if (data.songs) return data.songs;
        return [];
    } catch (e) {
        console.warn("Search failed", e);
        return [];
    }
  }

  async getRealAudioUrl(song: Song): Promise<string> {
      // If song already has a full http url (not a mock one), return it.
      // But for YouTube source from our backend, it might need a refresh or token.
      
      try {
          const cookie = this.getCookie();
          const response = await fetch(`${this.API_BASE_URL}/url?id=${song.id}&source=${song.source}&cookie=${encodeURIComponent(cookie)}`);
          if (response.ok) {
              const data = await response.json();
              if (data.url) return data.url;
          }
      } catch (e) {
          console.warn("Failed to fetch real URL", e);
      }
      return ''; // Return empty string to let player handle error
  }

  // --- Login APIs ---

  async getLoginKey() {
      const res = await fetch(`${this.API_BASE_URL}/login/qr/key?timerstamp=${Date.now()}`);
      return await res.json();
  }

  async createLoginQR(key: string) {
      const res = await fetch(`${this.API_BASE_URL}/login/qr/create?key=${key}&timerstamp=${Date.now()}`);
      return await res.json();
  }

  async checkLoginQR(key: string) {
      const res = await fetch(`${this.API_BASE_URL}/login/qr/check?key=${key}&timerstamp=${Date.now()}`);
      return await res.json();
  }

  async getUserStatus(cookie: string) {
      // We pass cookie as query param for this simple implementation
      const res = await fetch(`${this.API_BASE_URL}/login/status?cookie=${encodeURIComponent(cookie)}&timerstamp=${Date.now()}`);
      return await res.json();
  }

  async generateLocalRecommendation(tag: string): Promise<{ name: string; description: string; songs: Song[] }> {
      // Keep existing mock logic for simple recommendations for now
       return {
          name: `今日${tag}精选`,
          description: "基于本地算法随机生成的歌单。",
          songs: []
      };
  }
}

export const musicService = new HybridMusicService();