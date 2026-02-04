import express from 'express';
import cors from 'cors';
import ytSearch from 'yt-search';
import ytdl from '@distube/ytdl-core';
import NeteaseCloudMusicApi from 'NeteaseCloudMusicApi';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import { bootstrap } from 'global-agent';

// --- 🟢 代理配置 (解决搜索慢/无法连接) ---
// 请根据你的 VPN 软件修改端口：Clash 通常是 7890，v2ray 是 10809
const PROXY_URL = 'http://127.0.0.1:7890'; 

// 仅在开发环境或本地运行时启用代理
if (process.env.NODE_ENV !== 'production') {
  process.env.GLOBAL_AGENT_HTTP_PROXY = PROXY_URL;
  process.env.GLOBAL_AGENT_HTTPS_PROXY = PROXY_URL;
  bootstrap();
  console.log(`[Proxy] Global agent enabled on ${PROXY_URL}`);
}

const app = express();
const port = 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// 网易云 API 包装 (解决 IP 限制)
const neteaseRequest = async (apiFunc, query, req) => {
  try {
    return await apiFunc({
      ...query,
      cookie: req.cookies,
      realIP: '114.114.114.114', // 伪造国内 IP
      proxy: undefined
    });
  } catch (error) {
    throw error;
  }
};

// --- API 路由 ---

// 1. YouTube 搜索
app.get('/api/search/youtube', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: 'Missing keyword' });

    const r = await ytSearch(keyword);
    const videos = r.videos.slice(0, 10).map(v => ({
      id: v.videoId,
      title: v.title,
      artist: v.author.name,
      album: 'YouTube',
      duration: v.timestamp,
      cover: v.thumbnail,
      source: 'youtube'
    }));
    res.json(videos);
  } catch (error) {
    console.error('YT Search Error:', error);
    res.status(500).json({ error: 'YouTube search failed' });
  }
});

// 2. Bilibili 搜索 (新增)
app.get('/api/search/bilibili', async (req, res) => {
  try {
    const { keyword } = req.query;
    // B站搜索 API (需要伪装 User-Agent)
    const response = await axios.get(`http://api.bilibili.com/x/web-interface/search/type`, {
      params: { keyword: keyword, search_type: 'video' },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com/'
      }
    });

    if (response.data.code === 0 && response.data.data.result) {
      const videos = response.data.data.result.slice(0, 10).map(v => ({
        id: v.bvid,
        title: v.title.replace(/<[^>]+>/g, ''), // 去除高亮标签
        artist: v.author,
        album: 'Bilibili',
        duration: v.duration,
        cover: v.pic.startsWith('http') ? v.pic : `http:${v.pic}`,
        source: 'bilibili'
      }));
      res.json(videos);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Bilibili Search Error:', error);
    res.status(500).json({ error: 'Bilibili search failed' });
  }
});

// 3. 网易云搜索
app.get('/api/search/netease', async (req, res) => {
  try {
    const { keyword } = req.query;
    const result = await neteaseRequest(NeteaseCloudMusicApi.cloudsearch, { keywords: keyword, type: 1 }, req);
    const songs = result.body.result.songs.map(s => ({
      id: s.id,
      title: s.name,
      artist: s.ar.map(a => a.name).join('/'),
      album: s.al.name,
      cover: s.al.picUrl,
      source: 'netease',
      vip: s.fee === 1
    }));
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: 'Netease search failed' });
  }
});

// 4. YouTube 播放链接
app.get('/api/play/youtube', async (req, res) => {
  try {
    const { id } = req.query;
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${id}`);
    const format = ytdl.filterFormats(info.formats, 'audioonly').find(f => f.container === 'm4a');
    res.json({ url: format ? format.url : info.formats[0].url });
  } catch (error) {
    res.status(500).json({ error: 'YT Play failed' });
  }
});

// 5. 网易云播放链接
app.get('/api/play/netease', async (req, res) => {
  try {
    const { id } = req.query;
    const result = await neteaseRequest(NeteaseCloudMusicApi.song_url, { id: id, level: 'standard' }, req);
    res.json({ url: result.body.data[0].url });
  } catch (error) {
    res.status(500).json({ error: 'Netease Play failed' });
  }
});

// 6. Bilibili 播放链接 (基础实现)
app.get('/api/play/bilibili', async (req, res) => {
  // 注意：B站音频通常需要 Referer 头才能播放，前端可能无法直接播放
  // 这里暂时返回占位逻辑，完整实现需要后端代理流
  res.status(501).json({ error: 'Bilibili direct playback requires stream proxy' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
