const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const os = require('os');
const { 
  search, 
  song_url, 
  login_qr_key, 
  login_qr_create, 
  login_qr_check,
  user_account
} = require('NeteaseCloudMusicApi');
const ytSearch = require('yt-search');
const ytdl = require('@distube/ytdl-core'); // Use maintained fork

const app = express();
const PORT = 3001;

// 允许跨域和Cookie
app.use(cors({
  origin: true, // 允许所有来源，方便调试
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- Helper: Get LAN IP ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// --- Helper Functions ---
const mapNeteaseSong = (item) => ({
  id: String(item.id),
  title: item.name,
  artist: item.ar ? item.ar.map(a => a.name).join('/') : 'Unknown',
  album: item.al ? item.al.name : '',
  coverUrl: item.al ? item.al.picUrl : '',
  source: 'NETEASE',
  duration: Math.floor(item.dt / 1000),
  isGray: false 
});

const mapYoutubeSong = (item) => ({
  id: item.videoId,
  title: item.title,
  artist: item.author.name,
  album: 'YouTube',
  coverUrl: item.thumbnail,
  source: 'YOUTUBE',
  duration: item.seconds,
  isGray: false
});

// --- API Endpoints ---

// 1. Search API (Hybrid)
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  const cookie = req.query.cookie || ''; 
  
  if (!q) return res.status(400).json({ error: 'Query is required' });

  console.log(`[Search] Query: ${q}`);

  try {
    // Parallel search
    const [neteaseRes, ytRes] = await Promise.allSettled([
        search({ keywords: q, type: 1, limit: 10, cookie }),
        ytSearch(q)
    ]);

    let songs = [];

    // Netease
    if (neteaseRes.status === 'fulfilled' && neteaseRes.value.body.result?.songs) {
        songs = [...songs, ...neteaseRes.value.body.result.songs.map(mapNeteaseSong)];
    }

    // YouTube
    if (ytRes.status === 'fulfilled' && ytRes.value.videos) {
        songs = [...songs, ...ytRes.value.videos.slice(0, 5).map(mapYoutubeSong)];
    }
    
    res.json({ songs });
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// 2. Audio URL API
app.get('/api/url', async (req, res) => {
  const { id, source, cookie } = req.query;
  
  console.log(`[GetURL] ID: ${id}, Source: ${source}`);

  if (source === 'NETEASE') {
      try {
          const result = await song_url({ id: id, level: 'standard', cookie: cookie || '' });
          if (result.body && result.body.data && result.body.data[0]) {
              const url = result.body.data[0].url;
              if (!url) return res.status(404).json({ error: 'VIP only or unavailable' });
              return res.json({ url });
          }
      } catch (error) {
          return res.status(500).json({ error: 'Failed to fetch Netease URL' });
      }
  } else if (source === 'YOUTUBE') {
      const host = req.get('host'); // e.g., 192.168.1.5:3001
      const protocol = req.protocol;
      const streamUrl = `${protocol}://${host}/api/yt/stream?id=${id}`;
      return res.json({ url: streamUrl });
  }

  res.status(404).json({ error: 'Source not supported' });
});

// 3. YouTube Stream Proxy
app.get('/api/yt/stream', async (req, res) => {
    const { id } = req.query;
    if(!id) return res.status(400).end();

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${id}`;
        
        if (!ytdl.validateID(id)) return res.status(400).send('Invalid ID');

        res.header('Content-Type', 'audio/mpeg');
        
        // Using @distube/ytdl-core with default agent options
        ytdl(videoUrl, { 
            filter: 'audioonly', 
            quality: 'lowestaudio',
            highWaterMark: 1 << 25,
            liveBuffer: 4000
        }).pipe(res);

    } catch (e) {
        console.error("YouTube Stream Error:", e.message);
        res.status(500).end();
    }
});

// --- Netease Login API (QR Code Flow) ---

app.get('/api/login/qr/key', async (req, res) => {
    try {
        const result = await login_qr_key({ timestamp: Date.now() });
        res.json(result.body);
    } catch(e) { res.status(500).json({error: e}); }
});

app.get('/api/login/qr/create', async (req, res) => {
    try {
        const { key } = req.query;
        const result = await login_qr_create({ key, qrimg: true, timestamp: Date.now() });
        res.json(result.body);
    } catch(e) { res.status(500).json({error: e}); }
});

app.get('/api/login/qr/check', async (req, res) => {
    try {
        const { key } = req.query;
        const result = await login_qr_check({ key, timestamp: Date.now() });
        // CRITICAL FIX: Return the cookie which is on the result object, not inside body
        res.json({ ...result.body, cookie: result.cookie });
    } catch(e) { res.status(500).json({error: e}); }
});

app.get('/api/login/status', async (req, res) => {
    try {
        const { cookie } = req.query;
        const result = await user_account({ cookie });
        res.json(result.body);
    } catch(e) { res.status(500).json({error: e}); }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`
  ===========================================================
  🚀 UniStream Backend Running
  
  Local:   http://localhost:${PORT}
  Network: http://${ip}:${PORT}  <-- 在手机App设置中填入此地址
  ===========================================================
  `);
});