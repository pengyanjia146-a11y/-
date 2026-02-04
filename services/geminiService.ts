import { CapacitorHttp } from '@capacitor/core';
import { Song, MusicSource, AudioQuality } from "../types";

// Define a richer return type for playback details
interface SongPlayDetails {
    url: string;
    lyric?: string;
    coverUrl?: string; // Update cover if higher quality found
}

export class ClientSideService {

  // Privacy: Removed Hardcoded Cookies.
  // Privacy: We generate random NMTID and DeviceID for guests to mimic real traffic.
  private baseHeaders = {
    'Referer': 'https://music.163.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Real-IP': '115.239.211.112', 
    'X-Forwarded-For': '115.239.211.112'
  };

  private invidiousInstances = [
      'https://inv.tux.pizza',
      'https://vid.uff.net',
      'https://inv.nadeko.net',
      'https://invidious.jing.rocks',
      'https://yt.artemislena.eu'
  ];
  private currentInvInstance = this.invidiousInstances[0];
  private customInvInstance = '';
  
  private plugins: any[] = [];
  
  // Guest Identity
  private guestCookie = '';

  constructor() {
    this.currentInvInstance = this.invidiousInstances[Math.floor(Math.random() * this.invidiousInstances.length)];
    this.generateGuestHeaders();
  }
  
  // Generate random Hex string
  private randomHex(length: number) {
      let result = '';
      const characters = '0123456789abcdef';
      for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
  }

  private generateGuestHeaders() {
      // Mimic NMTID and DeviceId for better guest access rates
      const nmtid = this.randomHex(32);
      const deviceId = this.randomHex(16);
      this.guestCookie = `os=pc; appver=2.9.7; NMTID=${nmtid}; DeviceId=${deviceId};`;
  }

  setCustomInvidiousUrl(url: string) {
      this.customInvInstance = url ? url.replace(/\/$/, '') : '';
  }

  // --- 智能 Headers 构造 ---
  private getHeaders() {
      const savedUser = localStorage.getItem('unistream_user');
      let cookieStr = this.guestCookie; // Default to guest

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

      return {
          ...this.baseHeaders,
          'Cookie': cookieStr
      };
  }

  // --- Latency / Ping Test ---
  async getPings(): Promise<{ netease: number; youtube: number }> {
      const start = Date.now();
      let netease = -1;
      let youtube = -1;

      try {
          await CapacitorHttp.get({ 
              url: 'https://music.163.com/api/search/hot', 
              headers: this.getHeaders() 
          });
          netease = Date.now() - start;
      } catch (e) { netease = -1; }

      const ytStart = Date.now();
      const targetYt = this.customInvInstance || this.currentInvInstance;
      try {
           await CapacitorHttp.get({ url: `${targetYt}/api/v1/stats`, connectTimeout: 3000 });
           youtube = Date.now() - ytStart;
      } catch (e) { 
           youtube = -1; 
           if (!this.customInvInstance) this.rotateInstance();
      }
      return { netease, youtube };
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

  // --- Playlist Import Logic ---
  async importNeteasePlaylist(playlistId: string): Promise<Song[]> {
      try {
          // Use the Detail API which often contains trackIds
          const url = `https://music.163.com/api/v3/playlist/detail?id=${playlistId}&n=1000&s=8`;
          const response = await CapacitorHttp.get({
              url: url,
              headers: this.getHeaders()
          });

          let data = response.data;
          if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) {} }

          if (data && data.playlist && data.playlist.tracks) {
              return data.playlist.tracks.map((item: any) => ({
                  id: String(item.id),
                  title: item.name,
                  artist: item.ar ? item.ar.map((a: any) => a.name).join('/') : 'Unknown',
                  album: item.al ? item.al.name : '',
                  coverUrl: item.al?.picUrl ? item.al.picUrl.replace(/^http:/, 'https:') : '',
                  source: MusicSource.NETEASE,
                  duration: Math.floor(item.dt / 1000),
                  isGray: false,
                  fee: item.fee
              }));
          }
      } catch (e) {
          console.error("Playlist Import Error", e);
      }
      return [];
  }

  // --- Search Logic ---
  async searchMusic(query: string): Promise<Song[]> {
    const promises = [
        this.searchNetease(query),
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

  private async searchNetease(keyword: string): Promise<Song[]> {
      try {
          let url = 'https://music.163.com/api/cloudsearch/pc';
          let data = `s=${encodeURIComponent(keyword)}&type=1&offset=0&limit=20&total=true`;

          const response = await CapacitorHttp.post({
              url: url,
              headers: this.getHeaders(),
              data: data
          });

          let resData = response.data;
          if (typeof resData === 'string') { try { resData = JSON.parse(resData); } catch(e) {} }

          if (resData?.result?.songs) {
              return resData.result.songs.map((item: any) => ({
                  id: String(item.id),
                  title: item.name,
                  artist: item.ar ? item.ar.map((a: any) => a.name).join('/') : (item.artists ? item.artists.map((a: any) => a.name).join('/') : 'Unknown'),
                  album: item.al ? item.al.name : (item.album ? item.album.name : ''),
                  coverUrl: item.al?.picUrl ? item.al.picUrl.replace(/^http:/, 'https:') : (item.album?.picUrl ? item.album.picUrl.replace(/^http:/, 'https:') : ''),
                  source: MusicSource.NETEASE,
                  duration: Math.floor(item.dt / 1000),
                  isGray: false,
                  fee: item.fee
              }));
          }
      } catch (e) { console.error("Netease Search Error", e); }
      return [];
  }

  private async searchYouTube(keyword: string): Promise<Song[]> {
      const targetHost = this.customInvInstance || this.currentInvInstance;
      try {
          const url = `${targetHost}/api/v1/search?q=${encodeURIComponent(keyword)}&type=video`;
          // Increased timeout to 20s as requested to reduce failures
          const response = await CapacitorHttp.get({ url, connectTimeout: 20000 });

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
          if (!this.customInvInstance) this.rotateInstance();
      }
      return [];
  }

  private rotateInstance() {
      const idx = this.invidiousInstances.indexOf(this.currentInvInstance);
      this.currentInvInstance = this.invidiousInstances[(idx + 1) % this.invidiousInstances.length];
  }

  // --- Audio Details Logic ---
  
  async getSongDetails(song: Song, quality: AudioQuality = 'standard'): Promise<SongPlayDetails> {
      if (song.source === MusicSource.NETEASE) {
          return this.getNeteaseDetails(song, quality);
      } else if (song.source === MusicSource.YOUTUBE) {
          const url = await this.getYouTubeUrl(song.id);
          return { url };
      } else if (song.source === MusicSource.PLUGIN && (song as any).pluginId) {
          const plugin = this.plugins.find(p => p.id === (song as any).pluginId);
          if (plugin && plugin.getMediaUrl) {
              const url = await plugin.getMediaUrl(song);
              return { url };
          }
      } else if (song.source === MusicSource.LOCAL && song.audioUrl) {
          return { url: song.audioUrl };
      }
      return { url: '' };
  }

  // Keeping this for reference, though new download uses window.open
  async downloadSongBlob(url: string): Promise<Blob | null> {
    try {
        const response = await CapacitorHttp.get({
            url,
            responseType: 'blob',
            headers: this.baseHeaders
        });
        
        if (response.status === 200 && response.data) {
            return response.data;
        }
    } catch (e) {
        console.error("Download Blob Failed", e);
    }
    return null;
  }

  async getRealAudioUrl(song: Song): Promise<string> {
      const details = await this.getSongDetails(song);
      return details.url;
  }

  private async getNeteaseDetails(song: Song, quality: AudioQuality): Promise<SongPlayDetails> {
      let playUrl = '';
      let lyric = '';
      
      try {
           const id = song.id;
           let br = 128000;
           let level = 'standard';
           if (quality === 'exhigh') { br = 320000; level = 'exhigh'; }
           if (quality === 'lossless') { br = 999000; level = 'lossless'; }

           const urlApi = `https://music.163.com/api/song/enhance/player/url`;
           const data = `id=${id}&ids=[${id}]&br=${br}&level=${level}`; 
           
           const response = await CapacitorHttp.post({
               url: urlApi,
               headers: this.getHeaders(),
               data: data
           });

           let resData = response.data;
           if (typeof resData === 'string') { try { resData = JSON.parse(resData); } catch(e) {} }
           const songData = resData?.data?.[0];

           if (response.status === 200 && songData) {
               if (!songData.url || songData.code !== 200 || songData.freeTrialInfo) {
                   throw new Error("VIP_REQUIRED");
               }
               playUrl = songData.url.replace(/^http:/, 'https:');
           }

           const lyricApi = `https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`;
           const lyricRes = await CapacitorHttp.get({
               url: lyricApi,
               headers: this.getHeaders()
           });
           
           let lyricData = lyricRes.data;
           if (typeof lyricData === 'string') { try { lyricData = JSON.parse(lyricData); } catch(e) {} }
           if (lyricData?.lrc?.lyric) {
               lyric = lyricData.lrc.lyric;
           }

      } catch (e: any) { 
          if (e.message === "VIP_REQUIRED") throw e;
          console.error("Netease Detail Fetch failed", e); 
      }
      return { url: playUrl, lyric };
  }

  private async getYouTubeUrl(id: string): Promise<string> {
      const targetHost = this.customInvInstance || this.currentInvInstance;
      return `${targetHost}/latest_version?id=${id}&itag=140&local=true`;
  }

  // --- Login ---
  async getUserStatus(cookieInput: string): Promise<any> { 
      try {
          let finalCookie = cookieInput.trim();
          const musicUMatch = cookieInput.match(/MUSIC_U=([0-9a-zA-Z]+)/);
          if (musicUMatch) {
              finalCookie = musicUMatch[1]; 
          } else if (cookieInput.length > 50 && !cookieInput.includes('=')) {
              finalCookie = cookieInput;
          }

          const testHeader = `os=pc; appver=2.9.7; MUSIC_U=${finalCookie};`;

          const response = await CapacitorHttp.post({
              url: 'https://music.163.com/api/w/nuser/account/get',
              headers: { ...this.baseHeaders, 'Cookie': testHeader }
          });
          
          let resData = response.data;
          if (typeof resData === 'string') { try { resData = JSON.parse(resData); } catch(e) {} }
          
          if (resData && resData.code === 200) {
              resData._cleanedCookie = finalCookie;
          }
          
          return resData;
      } catch(e) {
          return { code: 500 };
      }
  }

  async getLoginKey(): Promise<any> { return { code: 500 }; }
  async createLoginQR(key: string): Promise<any> { return { code: 500 }; }
  async checkLoginQR(key: string): Promise<any> { return { code: 500 }; }
}

export const musicService = new ClientSideService();