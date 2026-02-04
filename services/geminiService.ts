import { CapacitorHttp } from '@capacitor/core';
import { Song, MusicSource, MusicPlugin } from "../types";

export class ClientSideService {

  // 🔥 核心修改：已植入你刚才提供的完整 Cookie
  // 这意味着 APK 安装后，无需登录就能直接通过这串 Cookie 连上网易云
  private readonly HARDCODED_COOKIE = "timing_user_id=time_elZm3bF8uD; JSESSIONID-WYYY=mjKNOji%2FlwcdosEi%5CqC%2B9bt60DIBZtQ%5CWO56WO1IyAzzdijPuWCD7qWgcS2d%5CobRfu%5CppR8%2FDee%2BGnswVQIMVP5npHYaWjX66QpjPdU37WhBomduAi1ONsrY91aTBkwR0pm4j1%2BJnDAKuZxxyA7ouIJaCHzkAAwB4CP4sKelDNIbeP4u%3A1770186113816; _iuqxldmzr_=32; _ntes_nnid=b2e34ff09bafbd360016e8a8b7724332,1770184313828; _ntes_nuid=b2e34ff09bafbd360016e8a8b7724332; NMTID=00ODqYHGWZ-0OohjURepF7EDHDU6hMAAAGcJzUHPw; Hm_lvt_1483fb4774c02a30ffa6f0e2945e9b70=1770184314; HMACCOUNT=41458308C1CB6389; WEVNSM=1.0.0; WNMCID=etdtpn.1770184315714.01.0; WM_NI=zWpAjZ1U5gdPfYYFUIred5DO7%2B3KC8XN2B25i%2Bt8f4LuZO5zaLZHI5nmHBOvDlTHchgU2Gd46W%2BNtyjp7Vu%2Bg7%2B7USsJ%2FbdCJHDzVp7gUGLJ6DkKeExRxDRw87FqDBHZMkE%3D; WM_NIKE=9ca17ae2e6ffcda170e2e6ee8df93df29782b8d15290968ea6d45e878a9b86db8086f0bfb9ec469c95a5d3f22af0fea7c3b92aba89c0a2e952f38bfb88e75ca68797a7d843b2bbacd6c745f5f5fdacc2349c92fea3b13fabf5bcd9e54090ab96b0b872a39496a9cc3faeb388a3ce7e88b49ca9e264a58bfea8e740f689e5aff773aab0f9b7f821a5e9e5d8d859b196e183e7498a988c9bd57cf5b99ba8cf42f69ca5ace84fbc8eb8a5d17dfce98a92c74a8c86838cc837e2a3; __snaker__id=SAj3YRxHOZJ1HymL; WM_TID=sH2r08IOBKVEEBEQRUKDtAk%2BHyZB7aiV; gdxidpyhxdE=Xj0qjTMZi%5CdTmMT9zw0ULE1iUZBSGUIxCDuDfAWzDxA2ChwfAwm08dKR197aGR8ovfC%5CBBS3SPzE0t6gf3o86vgl2mY70rQNb2hxB6LvrltRZV22A%2FJU9815ilZNZsAuqv3mx2B%2Bu18H8mjzkhs%2Fc%5CrwXkcT6M3NSyHJig8khzo3Vp%5CD%3A1770185218496; ntes_utid=tid._.NHyDHgoX8w5EQ0BEAUfW4AxrGnZDkyIO._.0; sDeviceId=YD-Ullvu9%2B5ylZFQgQFQELH5FkuDiMG1zMK; __csrf=93a39bcfc71908259dcf8fc68dc126a9; MUSIC_U=00557997FFC7FB5B75FA463550159AC9AFF13E19663728E1CD5C4480084BFFF82E7441C12AD0FD20FB960AA9B0B96F141CEEE5B4153BA74FF3C7A17C533E310F446F3652FC97767C2A6AF2E50421864EB537E19346E27F7031E250AD7FA1E132104590BA88161CF09243C1FC0F97F76A5396220B397EE61499220B8BBDA833EC461262285E6E2F40AD8B59C38CBEF0B5D49F7084E4319C89382C4EB805986AEEA25A7FB10F016C8FC75C392BEF261AC090335E365AF8A0EC7890C1691A1CF1950D7382318451EE494D85877F8DF2A5F49E9AD93362C12A43C90B639AB9FF0FCA3CB4C8A3F8A9B3374F1BC4B8537EDBDA982E28B9F6AB2EA62AD343BFABA6696207F2689BB012581906D4C81CDBB6E4E20BB2B95144529DFD450A529691B6BE17F3434B0C0C6353A791BAAB31B46BF2216586F9AC16E861014E97FE1D416E613E6207C6639FD3B1C1FFD97F0323E4288D2A68845994CD1117EA40BC712096E6CA7EF1D056B0E35BB05D7BA6156878116B0AD829B42929975CE7BBC715D7E0AFE0D7B35CDAEA3244B742E16A66A94B37A633; ntes_kaola_ad=1; Hm_lpvt_1483fb4774c02a30ffa6f0e2945e9b70=1770184366";

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

  constructor() {
    console.log("Client-Side Service Initialized");
    this.currentInvInstance = this.invidiousInstances[Math.floor(Math.random() * this.invidiousInstances.length)];
  }

  setCustomInvidiousUrl(url: string) {
      this.customInvInstance = url ? url.replace(/\/$/, '') : '';
  }

  // --- Dynamic Headers Construction ---
  private getHeaders() {
      const savedUser = localStorage.getItem('unistream_user');
      let cookieStr = 'os=pc; appver=2.9.7;'; 

      // 默认使用内置的保底 Cookie
      let targetCookie = this.HARDCODED_COOKIE;

      if (savedUser) {
          try {
              const userData = JSON.parse(savedUser);
              if (userData.cookie && userData.cookie.length > 20) {
                  targetCookie = userData.cookie;
              }
          } catch(e) {}
      }

      // 智能处理：判断是“完整串”还是“仅值”
      if (targetCookie.includes('=')) {
          // 包含等号，认为是完整串 (如 "MUSIC_U=xxx; JSESSIONID=...")
          cookieStr += ` ${targetCookie}`;
      } else {
          // 不含等号，认为是仅值 (如 "0055799...")
          cookieStr += ` MUSIC_U=${targetCookie};`;
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
          // 使用 Search 接口 Ping，同时验证 Cookie 是否有效
          await CapacitorHttp.get({ 
              url: 'https://music.163.com/api/search/hot', 
              headers: this.getHeaders() // 使用带 Cookie 的头
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
          let data = `s=${encodeURIComponent(keyword)}&type=1&offset=0&limit=10&total=true`;

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
                  artist: item.artists ? item.artists.map((a: any) => a.name).join('/') : 'Unknown',
                  album: item.album ? item.album.name : '',
                  coverUrl: item.album?.picUrl ? item.album.picUrl.replace(/^http:/, 'https:') : '',
                  source: MusicSource.NETEASE,
                  duration: Math.floor(item.duration / 1000),
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
          const response = await CapacitorHttp.get({ url, connectTimeout: 8000 });

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

  // --- Audio URL Logic ---
  async getRealAudioUrl(song: Song): Promise<string> {
      if (song.source === MusicSource.NETEASE) return this.getNeteaseUrl(song);
      else if (song.source === MusicSource.YOUTUBE) return this.getYouTubeUrl(song.id);
      else if (song.source === MusicSource.PLUGIN && (song as any).pluginId) {
          const plugin = this.plugins.find(p => p.id === (song as any).pluginId);
          if (plugin && plugin.getMediaUrl) return await plugin.getMediaUrl(song);
      }
      return '';
  }

  private async getNeteaseUrl(song: Song): Promise<string> {
      try {
           const id = song.id;
           const url = `https://music.163.com/api/song/enhance/player/url`;
           const data = `id=${id}&ids=[${id}]&br=320000`;
           
           const response = await CapacitorHttp.post({
               url: url,
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
               return songData.url.replace(/^http:/, 'https:');
           }
      } catch (e: any) { 
          if (e.message === "VIP_REQUIRED") throw e;
          console.error("Netease URL failed", e); 
      }
      return '';
  }

  private async getYouTubeUrl(id: string): Promise<string> {
      const targetHost = this.customInvInstance || this.currentInvInstance;
      return `${targetHost}/latest_version?id=${id}&itag=140&local=true`;
  }

  // --- Login 验证逻辑 (修正版) ---
  // 智能识别：无论传入什么格式，都尝试构造正确的测试请求
  async getUserStatus(cookieValue: string): Promise<any> { 
      try {
          let testCookie = 'os=pc; appver=2.9.7;';
          if (cookieValue.includes('=')) {
              testCookie += ` ${cookieValue}`;
          } else {
              testCookie += ` MUSIC_U=${cookieValue};`;
          }

          const response = await CapacitorHttp.post({
              url: 'https://music.163.com/api/w/nuser/account/get',
              headers: { ...this.baseHeaders, 'Cookie': testCookie }
          });
          
          let resData = response.data;
          if (typeof resData === 'string') { try { resData = JSON.parse(resData); } catch(e) {} }
          
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