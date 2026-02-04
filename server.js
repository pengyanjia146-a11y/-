const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const os = require('os');
const axios = require('axios');
const { 
  search, 
  song_url, 
  login_qr_key, 
  login_qr_create, 
  login_qr_check,
  user_account
} = require('NeteaseCloudMusicApi');
const ytSearch = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = 3001;

// 允许跨域和Cookie
app.use(cors({
  origin: true, 
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

/**
 * Universal Proxy Function
 * Handles Range requests to satisfy Android MediaPlayer
 */
async function streamProxy(targetUrl, req, res, extraHeaders = {}) {
    // Basic headers to look like a browser
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...extraHeaders
    };

    // Forward Range header (Crucial for seeking and Android playback)
    if (req.headers.range) {
        headers['Range'] = req.headers.range;
    }

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: headers,
            validateStatus: status => status >= 200 && status < 400 // Accept 200 and 206
        });

        // Copy key headers to response
        res.status(response.status);
        const keysToForward = [
            'content-type', 
            'content-length', 
            'content-range', 
            'accept-ranges', 
            'last-modified',
            'date'
        ];
        
        keysToForward.forEach(key => {
            if (response.headers[key]) {
                res.setHeader(key, response.headers[key]);
            }
        });

        // Pipe data
        response.data.pipe(res);
        
        response.data.on('error', (err) => {
            console.error('[StreamProxy] Data Error:', err.message);
            res.end();
        });

    } catch (e) {
        console.error(`[StreamProxy] Error fetching ${targetUrl}:`, e.message);
        if (!res.headersSent) {
            res.status(502).send('Proxy Error');
        } else {
            res.end();
        }
    }
}


// --- API Endpoints ---

// 1. Search API
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  const cookie = req.query.cookie || ''; 
  
  if (!q) return res.status(400).json({ error: 'Query is required' });

  try {
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

// 2. Get Audio URL
app.get('/api/url', async (req, res) => {
  const { id, source, cookie } = req.query;
  const host = req.get('host'); 
  const protocol = req.protocol;

  if (source === 'NETEASE') {
      try {
          // Standard then Exhigh
          let result = await song_url({ id: id, level: 'standard', cookie: cookie || '' });
          let url = result.body?.data?.[0]?.url;

          if (!url) {
             result = await song_url({ id: id, level: 'exhigh', cookie: cookie || '' });
             url = result.body?.data?.[0]?.url;
          }

          if (!url) {
              return res.status(404).json({ error: 'VIP required or Unavailable' });
          }

          // Use our generic proxy endpoint
          const proxyUrl = `${protocol}://${host}/api/proxy?url=${encodeURIComponent(url)}`;
          return res.json({ url: proxyUrl });

      } catch (error) {
          console.error("Netease URL Error", error);
          return res.status(500).json({ error: 'Failed to fetch Netease URL' });
      }
  } else if (source === 'YOUTUBE') {
      // Direct to our YT stream endpoint
      const streamUrl = `${protocol}://${host}/api/yt/play?id=${id}`;
      return res.json({ url: streamUrl });
  }

  res.status(404).json({ error: 'Source not supported' });
});

// 3. YouTube Play Handler (Resolve URL + Proxy)
app.get('/api/yt/play', async (req, res) => {
    const { id } = req.query;
    if(!id) return res.status(400).end();

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${id}`;
        
        // 1. Get Info
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    // Cookie helps with age restricted content sometimes, but we skip for now
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }
            }
        });

        // 2. Choose Format (Prefer m4a/mp4 for Android compatibility)
        const format = ytdl.chooseFormat(info.formats, { 
            filter: 'audioonly',
            quality: 'lowestaudio' 
        });

        if (!format || !format.url) {
            return res.status(404).send('No audio format found');
        }

        // 3. Proxy the googlevideo URL
        // YouTube requires the original headers usually, or at least nothing suspicious. 
        // We pass the global headers from our proxy function.
        await streamProxy(format.url, req, res);

    } catch (e) {
        console.error("YouTube Play Error:", e.message);
        res.status(500).end();
    }
});

// 4. Generic Proxy Endpoint (for Netease)
app.get('/api/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL provided');

    // Netease needs Referer
    const extraHeaders = {
        'Referer': 'https://music.163.com/'
    };

    await streamProxy(decodeURIComponent(url), req, res, extraHeaders);
});

// --- Netease Login API ---

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
  Network: http://${ip}:${PORT}
  
  [IMPORTANT for Android]
  1. Ensure Phone and PC are on the same Wi-Fi.
  2. In the App, go to Settings -> API Address.
  3. Enter: http://${ip}:${PORT}/api
  ===========================================================
  `);
});