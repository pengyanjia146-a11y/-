import { CapacitorHttp } from '@capacitor/core';
import { Song, MusicSource, AudioQuality, Artist, Playlist } from "../types";

interface SongPlayDetails {
    url: string;
    lyric?: string;
    cover?: string;
    isMv?: boolean;
}

export class ClientSideService {
  private baseHeaders = {
    'Referer': 'https://music.163.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Real-IP': '115.239.211.112', 
    'X-Forwarded-For': '115.239.211.112'
  };
  
  private bilibiliHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com/'
  };

  private invidiousInstances = [
      'https://inv.tux.pizza',
      'https://vid.uff.net',
      'https://inv.nadeko.net',
      'https://invidious.jing.rocks',
  ];
  private currentInvInstance = this.invidiousInstances[0];
  private customInvInstance = '';
  private plugins: any[] = [];
  private requestTimeout = 15000;
  private guestCookie = '';

  constructor() {
    this.currentInvInstance = this.invidiousInstances[Math.floor(Math.random() * this.invidiousInstances.length)];
    this.generateGuestHeaders();
  }
  
  setSearchTimeout(ms: number) { this.requestTimeout = ms; }
  
  private randomHex(length: number) {
      let result = '';
      const characters = '0123456789abcdef';
      for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));
      return result;
  }

  private generateGuestHeaders() {
      const nmtid = this.randomHex(32);
      const deviceId = this.randomHex(16);
      this.guestCookie = `os=pc; appver=2.9.7; NMTID=${nmtid}; DeviceId=${deviceId};`;
  }

  setCustomInvidiousUrl(url: string) { this.customInvInstance = url ? url.replace(/\/$/, '') : ''; }

  private getHeaders() {
      const savedUser = localStorage.getItem('unistream_user');
      let cookieStr = this.guestCookie; 

      if (savedUser) {
          try {
              const userData = JSON.parse(savedUser);
              if (userData.cookie && userData.cookie.length > 5) {
                  let targetCookie = userData.cookie;
                  if (targetCookie.includes('MUSIC_U=')) {
                       if (!targetCookie.includes('os=pc')) cookieStr = `os=pc; appver=2.9.7; ${targetCookie}`;
                       else cookieStr = targetCookie; 
                  } else {
                       cookieStr = `os=pc; appver=2.9.7; MUSIC_U=${targetCookie};`;
                  }
              }
          } catch(e) {}
      }
      return { ...this.baseHeaders, 'Cookie': cookieStr };
  }

  async getPings(): Promise<{ netease: number; youtube: number }> {
      const start = Date.now();
      let netease = -1;
      let youtube = -1;
      try {
          await CapacitorHttp.get({ 
              url: 'https://music.163.com/api/search/hot', 
              headers: this.getHeaders(),
              connectTimeout: 5000 
          });
          netease = Date.now() - start;
      } catch (e) { netease = -1; }

      const ytStart = Date.now();
      const targetYt = this.customInvInstance || this.currentInvInstance;
      try {
           await CapacitorHttp.get({ url: `${targetYt}/api/v1/stats`, connectTimeout: 5000 });
           youtube = Date.now() - ytStart;
      } catch (e) { youtube = -1; }
      return { netease, youtube };
  }

  // --- Artist & Playlist ---
  
  async getUserPlaylists(uid: string): Promise<Playlist[]> {
      try {
          const url = `https://music.163.com/api/user/playlist?uid=${uid}&limit=100&offset=0`;
          const response = await CapacitorHttp.get({
              url: url,
              headers: this.getHeaders(),
              connectTimeout: this.requestTimeout
          });
          let data = response.data;
          if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) {} }

          if (data && data.code === 200 && data.playlist) {
              return data.playlist.map((pl: any) => ({
                  id: String(pl.id),
                  name: pl.name,
                  description: pl.description,
                  songs: [],
                  coverUrl: pl.coverImgUrl ? pl.coverImgUrl.replace(/^http:/, 'https:') : '',
                  isSystem: false,
                  creatorId: String(pl.creator?.userId)
              }));
          }
      } catch (e) { console.error("User Playlist Error", e); }
      return [];
  }

  async importNeteasePlaylist(playlistId: string): Promise<Song[]> {
      try {
          const url = `https://music.163.com/api/v3/playlist/detail?id=${playlistId}&n=1000&s=8`;
          const response = await CapacitorHttp.get({
              url: url,
              headers: this.getHeaders(),
              connectTimeout: this.requestTimeout
          });
          let data = response.data;
          if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) {} }

          if (data && data.playlist && data.playlist.tracks) {
              return data.playlist.tracks.map((item: any) => this.mapNeteaseSong(item));
          }
      } catch (e) { console.error("Playlist Import Error", e); }
      return [];
  }

  async getArtistDetail(artistId: string): Promise<{artist: Artist, songs: Song[]}> {
      try {
          const url = `https://music.163.com/api/artist/top/song?id=${artistId}`;
          const response = await CapacitorHttp.get({
              url: url,
              headers: this.getHeaders(),
              connectTimeout: this.requestTimeout
          });
          let data = response.data;
          if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) {} }

          if (data && data.code === 200) {
              const artistData = data.artist || {};
              const artist: Artist = {
                  id: String(artistData.id || artistId),
                  name: artistData.name || 'Unknown',
                  coverUrl: artistData.picUrl ? artistData.picUrl.replace(/^http:/, 'https:') : '',
                  description: artistData.briefDesc,
                  songSize: artistData.musicSize
              };
              const songs = (data.songs || []).map((item: any) => this.mapNeteaseSong(item));
              return { artist, songs };
          }
      } catch (e) {}
      return { artist: { id: artistId, name: 'Unknown', coverUrl: '' }, songs: [] };
  }

  // --- Search Logic ---
  async searchMusic(query: string): Promise<Song[]> {
    const promises = [
        this.searchNetease(query),
        this.searchBilibili(query),
        this.searchYouTube(query),
        ...this.plugins.map(p => this.searchPlugin(p, query))
    ];

    const results = await Promise.allSettled(promises);
    let allSongs: Song[] = [];
    results.forEach(res => {
        if (res.status === 'fulfilled') {
            allSongs = [...allSongs, ...res.value];
        }
    });
    return allSongs;
  }

  async getDailyRecommendSongs(): Promise<Song[]> {
      try {
          const url = `https://music.163.com/api/v3/discovery/recommend/songs`;
          const response = await CapacitorHttp.post({
              url: url,
              headers: this.getHeaders(),
              connectTimeout: this.requestTimeout
          });

          let data = response.data;
          if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) {} }
          
          if (data && data.code === 200 && data.data && data.data.dailySongs) {
               return data.data.dailySongs.map((item: any) => this.mapNeteaseSong(item));
          }
      } catch (e) { console.error("Daily Recommend Error", e); }
      return [];
  }

  // --- Plugin Management ---
  async installPluginFromUrl(url: string): Promise<boolean> {
      try {
          const response = await CapacitorHttp.get({ url });
          if (response.status === 200 && response.data) {
              return await this.importPlugin(response.data, url);
          }
      } catch (e) { console.error(e); }
      return false;
  }

  async importPlugin(code: string, srcUrl?: string): Promise<boolean> {
      try {
          const createPlugin = new Function('CapacitorHttp', `
              try {
                  ${code};
                  return typeof plugin !== 'undefined' ? plugin : (typeof module !== 'undefined' ? module.exports : {});
              } catch(e) { return null; }
          `);
          const plugin = createPlugin(CapacitorHttp);
          if (plugin && (plugin.search || plugin.platform)) {
              const existingIdx = this.plugins.findIndex(p => p.platform === plugin.platform);
              if (existingIdx !== -1) this.plugins.splice(existingIdx, 1);
              plugin.id = `plugin-${Date.now()}-${Math.floor(Math.random()*1000)}`;
              plugin.srcUrl = srcUrl;
              this.plugins.push(plugin);
              return true;
          }
      } catch (e) { console.error(e); }
      return false;
  }
  
  getPlugins() { return this.plugins; }
  removePlugin(id: string) { this.plugins = this.plugins.filter(p => p.id !== id); }

  private async searchPlugin(plugin: any, query: string): Promise<Song[]> {
      try {
          if (plugin.search) {
              const results = await plugin.search(query);
              return results.map((r: any) => ({ 
                  ...r, 
                  source: MusicSource.PLUGIN, 
                  pluginId: plugin.id, 
                  isGray: false 
              }));
          }
      } catch (e) {}
      return [];
  }

  private mapNeteaseSong(item: any): Song {
      const cover = item.al?.picUrl ? item.al.picUrl.replace(/^http:/, 'https:') : (item.album?.picUrl ? item.album.picUrl.replace(/^http:/, 'https:') : '');
      return {
          id: String(item.id),
          title: item.name,
          artist: item.ar ? item.ar.map((a: any) => a.name).join('/') : (item.artists ? item.artists.map((a: any) => a.name).join('/') : 'Unknown'),
          artistId: item.ar ? String(item.ar[0].id) : (item.artists ? String(item.artists[0].id) : undefined),
          album: item.al ? item.al.name : (item.album ? item.album.name : ''),
          cover: cover,
          coverUrl: cover,
          source: MusicSource.NETEASE,
          duration: Math.floor(item.dt / 1000),
          isGray: false,
          fee: item.fee,
          mvId: item.mv ? String(item.mv) : undefined
      };
  }

  private async searchNetease(keyword: string): Promise<Song[]> {
      try {
          let url = 'https://music.163.com/api/cloudsearch/pc';
          let data = `s=${encodeURIComponent(keyword)}&type=1&offset=0&limit=20&total=true`;
          const response = await CapacitorHttp.post({
              url: url,
              headers: this.getHeaders(),
              data: data,
              connectTimeout: this.requestTimeout
          });
          let resData = response.data;
          if (typeof resData === 'string') { try { resData = JSON.parse(resData); } catch(e) {} }
          if (resData?.result?.songs) {
              return resData.result.songs.map((item: any) => this.mapNeteaseSong(item));
