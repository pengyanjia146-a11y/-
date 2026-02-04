const express = require('express');
const cors = require('cors');
const { search, song_url } = require('NeteaseCloudMusicApi');

const app = express();
const PORT = 3001;

// Enable CORS for frontend access
app.use(cors());
app.use(express.json());

// Helper: Standardize Song Object
const mapNeteaseSong = (item) => ({
  id: String(item.id),
  title: item.name,
  artist: item.ar ? item.ar.map(a => a.name).join('/') : 'Unknown',
  album: item.al ? item.al.name : '',
  coverUrl: item.al ? item.al.picUrl : '',
  source: 'NETEASE',
  duration: Math.floor(item.dt / 1000),
  isGray: false // Simplified logic
});

// --- API Endpoints ---

// 1. Search API
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query is required' });

  console.log(`[Search] Query: ${q}`);

  try {
    // Call Netease Cloud Music API
    // type: 1 means search for songs
    const result = await search({ keywords: q, type: 1, limit: 10 });
    
    if (result.body && result.body.result && result.body.result.songs) {
        const songs = result.body.result.songs.map(mapNeteaseSong);
        return res.json({ source: 'netease', songs });
    }
    
    res.json({ source: 'netease', songs: [] });
  } catch (error) {
    console.error('Search Error:', error);
    // Fallback to empty if failed, let frontend handle it
    res.status(500).json({ error: 'Backend search failed', details: error.message });
  }
});

// 2. Audio URL API
app.get('/api/url', async (req, res) => {
  const { id, source } = req.query;
  if (!id) return res.status(400).json({ error: 'ID is required' });

  console.log(`[GetURL] ID: ${id}, Source: ${source}`);

  if (source === 'NETEASE') {
      try {
          // level: 'standard', 'higher', 'exhigh', 'lossless', 'hires'
          const result = await song_url({ id: id, level: 'standard' });
          if (result.body && result.body.data && result.body.data[0]) {
              const url = result.body.data[0].url;
              if (!url) {
                  return res.status(404).json({ error: 'Song might be VIP only or unavailable' });
              }
              return res.json({ url });
          }
      } catch (error) {
          console.error('Get URL Error:', error);
          return res.status(500).json({ error: 'Failed to fetch URL' });
      }
  }

  // YouTube placeholder (Needs extra setup with ytdl-core or API Key)
  if (source === 'YOUTUBE') {
      return res.status(501).json({ error: 'YouTube backend implementation requires API Key configuration' });
  }

  res.status(404).json({ error: 'Source not supported' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  🚀 UniStream Backend running at http://localhost:${PORT}
  
  To enable real data:
  1. Ensure 'NeteaseCloudMusicApi' is installed.
  2. Run 'node server.js'
  `);
});