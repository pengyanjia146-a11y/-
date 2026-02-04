import React, { useState, useEffect, useRef } from 'react';
import { musicService } from './services/geminiService'; // Actually hybrid service now
import { Player } from './components/Player';
import { LoginModal } from './components/LoginModal';
import { HomeIcon, SearchIcon, LibraryIcon, NeteaseIcon, YouTubeIcon, PlayIcon, LabIcon, PlaylistAddIcon, PluginFileIcon, MoreVerticalIcon, HeartIcon, DownloadIcon, NextPlanIcon, SettingsIcon, FolderIcon } from './components/Icons';
import { Song, UserProfile, ViewState, MusicSource, Playlist, MusicPlugin } from './types';

// Initial Mock Data
const MOCK_LYRICS_CONTENT = `[00:00.00] 示例歌词
[00:05.00] 这是一个本地演示
[00:10.00] 享受音乐`;

const TRENDING_SONGS: Song[] = [
  { id: '1', title: '晴天', artist: '周杰伦', album: '叶惠美', coverUrl: 'https://picsum.photos/300?1', source: MusicSource.NETEASE, duration: 269, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', lyric: MOCK_LYRICS_CONTENT },
  { id: '2', title: '光年之外', artist: 'G.E.M. 邓紫棋', album: '摩天动物园', coverUrl: 'https://picsum.photos/300?2', source: MusicSource.YOUTUBE, duration: 235, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', lyric: MOCK_LYRICS_CONTENT },
  { id: '3', title: '十年', artist: '陈奕迅', album: '黑·白·灰', coverUrl: 'https://picsum.photos/300?3', source: MusicSource.NETEASE, duration: 205, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', lyric: MOCK_LYRICS_CONTENT },
  { id: '4', title: 'Shape of You', artist: 'Ed Sheeran', album: 'Divide', coverUrl: 'https://picsum.photos/300?4', source: MusicSource.YOUTUBE, duration: 233, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', lyric: MOCK_LYRICS_CONTENT },
];

export default function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>(TRENDING_SONGS);
  
  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>([
      { id: 'fav', name: '我喜欢的音乐', description: '红心收藏', songs: [], isSystem: true, coverUrl: 'https://picsum.photos/300?99' }
  ]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  // Plugins State (MusicFree Simulation)
  const [installedPlugins, setInstalledPlugins] = useState<MusicPlugin[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lab State
  const [labs, setLabs] = useState({
      autoUnblock: true, 
      directConnect: true, 
  });
  
  // Settings State
  const [settings, setSettings] = useState({
      apiUrl: 'http://localhost:3001/api', // Default for web
      downloadPath: 'Internal Storage/Music/UniStream',
      downloadQuality: 'lossless',
      autoDownloadLyrics: true,
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Active Context Menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    // Load User
    const savedUser = localStorage.getItem('unistream_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }

    // Load API URL
    const savedApiUrl = localStorage.getItem('unistream_api_url');
    if (savedApiUrl) {
        setSettings(prev => ({ ...prev, apiUrl: savedApiUrl }));
        musicService.setBaseUrl(savedApiUrl);
    }
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem('unistream_user', JSON.stringify(loggedInUser));
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('unistream_user');
  };

  const updateApiUrl = (url: string) => {
      setSettings(prev => ({ ...prev, apiUrl: url }));
      localStorage.setItem('unistream_api_url', url);
      musicService.setBaseUrl(url);
  };

  // UPDATED: Async playSong to fetch real URL
  const playSong = async (song: Song, newQueue?: Song[]) => {
    setIsPlaying(false);
    
    // Optimistic update
    setCurrentSong(song);
    
    if (newQueue) setQueue(newQueue);

    // Fetch real URL if it's empty or needs refreshing
    if (!song.audioUrl || song.audioUrl.length < 50) { // Simple check if it's a real url
        try {
            const realUrl = await musicService.getRealAudioUrl(song);
            const updatedSong = { ...song, audioUrl: realUrl };
            setCurrentSong(updatedSong);
            
            // Update queue as well so next time we play it, it has the URL
            setQueue(prev => prev.map(s => s.id === song.id ? updatedSong : s));
            if (view === 'SEARCH') {
                setSearchResults(prev => prev.map(s => s.id === song.id ? updatedSong : s));
            }
        } catch (e) {
            console.error("Failed to load song url", e);
        }
    }

    setIsPlaying(true);
  };

  const togglePlayPause = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    if (!currentSong) return;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    const nextSong = queue[(currentIndex + 1) % queue.length];
    if (nextSong) playSong(nextSong);
  };

  const handlePrev = () => {
    if (!currentSong) return;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    const prevSong = queue[(currentIndex - 1 + queue.length) % queue.length];
    if (prevSong) playSong(prevSong);
  };

  // --- New Features Actions ---

  const handleDownload = async (song: Song) => {
      // Ensure we have a URL before downloading
      let urlToDownload = song.audioUrl;
      if (!urlToDownload) {
          try {
             urlToDownload = await musicService.getRealAudioUrl(song);
          } catch(e) {
             alert("无法获取下载链接");
             return;
          }
      }

      if (!urlToDownload) {
          alert("下载失败：无音频链接");
          return;
      }
      
      const filename = `${song.title}-${song.artist}.mp3`;
      alert(`开始下载 ${filename} ...`);

      try {
        const response = await fetch(urlToDownload);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.warn("Direct blob download failed (CORS), falling back to link", e);
        const link = document.createElement('a');
        link.href = urlToDownload;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
  };

  const handleToggleLike = (song: Song) => {
      const favList = playlists.find(p => p.id === 'fav');
      if (!favList) return;

      const exists = favList.songs.some(s => s.id === song.id);
      let newSongs;
      if (exists) {
          newSongs = favList.songs.filter(s => s.id !== song.id);
      } else {
          newSongs = [song, ...favList.songs];
      }

      setPlaylists(playlists.map(p => p.id === 'fav' ? { ...p, songs: newSongs } : p));
  };

  const handlePlayNext = (song: Song) => {
      if (!currentSong) {
          playSong(song, [song]);
          return;
      }
      const currentIndex = queue.findIndex(s => s.id === currentSong.id);
      if (currentIndex === -1) {
           setQueue([...queue, song]);
      } else {
           const newQueue = [...queue];
           newQueue.splice(currentIndex + 1, 0, song);
           setQueue(newQueue);
      }
      alert(`已添加下一首播放: ${song.title}`);
  };

  const isLiked = (song: Song | null) => {
      if (!song) return false;
      return playlists.find(p => p.id === 'fav')?.songs.some(s => s.id === song.id) || false;
  };

  // ---------------------------

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!searchQuery.trim()) return;
      setSearchLoading(true);
      const results = await musicService.searchMusic(searchQuery);
      setSearchResults(results);
      setSearchLoading(false);
  };

  // Playlist Management
  const createPlaylist = () => {
      const name = prompt("请输入新歌单名称");
      if (name) {
          const newPl: Playlist = {
              id: `pl-${Date.now()}`,
              name,
              songs: [],
              coverUrl: 'https://picsum.photos/300?random=' + Date.now()
          };
          setPlaylists([...playlists, newPl]);
      }
  };

  const addToPlaylist = (song: Song, playlistId: string) => {
      setPlaylists(playlists.map(pl => {
          if (pl.id === playlistId) {
              // Check duplicate
              if (pl.songs.find(s => s.id === song.id)) return pl;
              return { ...pl, songs: [...pl.songs, song] };
          }
          return pl;
      }));
      alert(`已添加到 ${playlists.find(p => p.id === playlistId)?.name}`);
  };

  // Plugin Import Logic
  const handleImportPluginFileClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const fileName = file.name;
      // Simulate reading plugin metadata
      const newPlugin: MusicPlugin = {
          id: `local-${Date.now()}`,
          name: fileName.replace(/\.(js|json)$/i, ''),
          version: '1.0.0',
          author: 'Local Import',
          sources: ['local'],
          status: 'active'
      };
      setInstalledPlugins([...installedPlugins, newPlugin]);
      alert(`已从文件导入插件: ${newPlugin.name}`);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportPluginUrl = () => {
      const name = prompt("请输入插件名称:");
      if(!name) return;
      const url = prompt("请输入插件订阅 URL:");
      if (!url) return;

      const newPlugin: MusicPlugin = {
          id: `net-${Date.now()}`,
          name: name,
          version: 'latest',
          author: 'Network',
          sources: ['remote'],
          status: 'active'
      };
      setInstalledPlugins([...installedPlugins, newPlugin]);
      alert(`已添加网络订阅: ${name}`);
  };

  const songItemProps = (song: Song) => ({
      song,
      onClick: () => playSong(song, view === 'SEARCH' ? searchResults : (view === 'LIBRARY' && activePlaylist ? activePlaylist.songs : TRENDING_SONGS)),
      isCurrent: currentSong?.id === song.id,
      onToggleLike: () => handleToggleLike(song),
      onDownload: () => handleDownload(song),
      onPlayNext: () => handlePlayNext(song),
      isLiked: isLiked(song),
      isOpenMenu: openMenuId === song.id,
      setOpenMenu: (id: string | null) => setOpenMenuId(id)
  });

  // --- Views ---

  const renderHome = () => (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Banner */}
      <div className="relative h-48 md:h-64 rounded-2xl bg-gradient-to-r from-gray-900 to-primary overflow-hidden flex items-center p-6 shadow-2xl">
        <div className="relative z-10 w-full">
          <h1 className="text-3xl font-bold mb-2">本地直连模式</h1>
          <p className="text-gray-200 mb-4 max-w-md text-sm md:text-base">
            零延迟，无服务器中转。支持导入 MusicFree 插件。
          </p>
          {!user ? (
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <NeteaseIcon className="w-4 h-4" />
              登录同步歌单
            </button>
          ) : (
             <div className="flex items-center gap-3 bg-black/20 p-2 rounded-full pr-4 backdrop-blur-md w-fit">
                 <img src={user.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full border-2 border-primary" />
                 <div>
                     <p className="font-bold text-sm">{user.nickname}</p>
                 </div>
                 <button onClick={handleLogout} className="text-xs text-gray-300 hover:text-white underline ml-2">退出</button>
             </div>
          )}
        </div>
      </div>

      {/* Recommended */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            今日精选
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TRENDING_SONGS.map(song => (
            <SongItem key={song.id} {...songItemProps(song)} />
          ))}
        </div>
      </section>
    </div>
  );

  const renderLibrary = () => (
      <div className="pb-24 animate-fade-in">
          {!activePlaylist ? (
              <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">我的音乐</h2>
                    <button onClick={createPlaylist} className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors">
                        <PlaylistAddIcon className="w-4 h-4" /> 新建歌单
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {playlists.map(pl => (
                        <div key={pl.id} onClick={() => setActivePlaylist(pl)} className="group cursor-pointer">
                            <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-800 border border-white/5">
                                {pl.coverUrl && <img src={pl.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                {pl.id === 'fav' && <div className="absolute top-2 right-2 bg-netease/80 p-1.5 rounded-full"><HeartIcon size={12} fill="white" /></div>}
                            </div>
                            <h3 className="font-bold truncate">{pl.name}</h3>
                            <p className="text-xs text-gray-400">{pl.songs.length} 首歌曲</p>
                        </div>
                    ))}
                </div>
              </>
          ) : (
              <div>
                  <button onClick={() => setActivePlaylist(null)} className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">
                     ← 返回歌单列表
                  </button>
                  <div className="flex items-center gap-6 mb-8">
                      <img src={activePlaylist.coverUrl} className="w-32 h-32 rounded-xl shadow-lg" />
                      <div>
                          <h2 className="text-2xl font-bold mb-2">{activePlaylist.name}</h2>
                          <p className="text-gray-400 text-sm">{activePlaylist.description || '自建歌单'}</p>
                          <div className="mt-4 flex gap-2">
                            <button onClick={() => { if(activePlaylist.songs.length) playSong(activePlaylist.songs[0], activePlaylist.songs) }} className="bg-primary hover:bg-indigo-600 text-white px-6 py-2 rounded-full flex items-center gap-2">
                                <PlayIcon className="w-4 h-4 fill-current" /> 播放全部
                            </button>
                          </div>
                      </div>
                  </div>
                  <div className="space-y-1">
                      {activePlaylist.songs.length === 0 && <p className="text-gray-500 py-10 text-center">暂无歌曲，去搜索页添加吧</p>}
                      {activePlaylist.songs.map((song, idx) => (
                          <div key={idx} className="flex items-center group p-3 rounded-lg hover:bg-white/5 relative">
                              <span className="text-gray-500 w-8 text-center">{idx + 1}</span>
                              <div className="flex-1 cursor-pointer min-w-0 mr-12" onClick={() => playSong(song, activePlaylist.songs)}>
                                  <div className={`font-medium truncate ${currentSong?.id === song.id ? 'text-primary' : 'text-white'}`}>{song.title}</div>
                                  <div className="text-xs text-gray-400 truncate">{song.artist}</div>
                              </div>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                 <SongItemMenu song={song} isLiked={isLiked(song)} onToggleLike={() => handleToggleLike(song)} onDownload={() => handleDownload(song)} onPlayNext={() => handlePlayNext(song)} isOpen={openMenuId === song.id} setOpen={(v) => setOpenMenuId(v ? song.id : null)} />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
  );

  const renderSearch = () => (
      <div className="pb-24 animate-fade-in">
           <form onSubmit={handleSearch} className="mb-6 sticky top-0 bg-dark z-20 py-4">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                    <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索本地或插件音源..." 
                    className="w-full bg-dark-light border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
           </form>

           {searchLoading && (
               <div className="flex justify-center py-10">
                   <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               </div>
           )}

           <div className="space-y-2">
               {searchResults.map((song) => (
                   <SongItem key={song.id} {...songItemProps(song)} />
               ))}
           </div>
      </div>
  );

  const renderLabs = () => (
      <div className="pb-24 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <LabIcon className="text-primary" size={28} />
              实验室 & 插件 (MusicFree 模式)
          </h2>
          
          {/* Plugin Import Section */}
          <div className="bg-dark-light p-6 rounded-xl border border-white/5 mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <PluginFileIcon className="text-green-400" />
                  插件管理
              </h3>
              <p className="text-sm text-gray-400 mb-4">支持导入 `.js` 或 `.json` 格式的 MusicFree 插件来扩展音源 (B站、酷我、咪咕等)。所有请求将由客户端直接发起，无中转。</p>
              
              <div className="flex gap-4 mb-6">
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    accept=".js,.json" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  <button onClick={handleImportPluginFileClick} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10">
                      从文件导入...
                  </button>
                  <button onClick={handleImportPluginUrl} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10">
                      从网络链接导入...
                  </button>
              </div>

              {installedPlugins.length > 0 && (
                  <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase">已安装插件</p>
                      {installedPlugins.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                              <div>
                                  <div className="font-bold text-sm text-white">{p.name} <span className="text-xs text-gray-500 ml-1">v{p.version}</span></div>
                                  <div className="text-xs text-gray-500">作者: {p.author} • 源: {p.sources.join(', ')}</div>
                              </div>
                              <div className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">运行中</div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          <div className="grid gap-4">
              {/* Unlock Gray Songs Plugin */}
              <div className="bg-dark-light p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                      <h3 className="font-bold text-lg mb-1">自动解灰</h3>
                      <p className="text-sm text-gray-400">本地自动匹配可用源。</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${labs.autoUnblock ? 'bg-primary' : 'bg-gray-600'}`} onClick={() => setLabs({...labs, autoUnblock: !labs.autoUnblock})}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${labs.autoUnblock ? 'left-7' : 'left-1'}`}></div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderSettings = () => (
      <div className="pb-24 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <SettingsIcon className="text-gray-300" size={28} />
              应用设置
          </h2>

          <div className="space-y-6">
              {/* API Settings */}
              <div className="bg-dark-light p-5 rounded-xl border border-white/5">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <SearchIcon size={18} /> 后端连接
                  </h3>
                  <div>
                        <label className="block text-xs text-gray-400 mb-2">后端 API 地址 (手机端请填电脑IP，例如 http://192.168.x.x:3001/api)</label>
                        <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-white/10">
                            <span className="text-gray-500 text-xs">URL</span>
                            <input 
                            type="text" 
                            value={settings.apiUrl}
                            onChange={(e) => updateApiUrl(e.target.value)}
                            className="bg-transparent w-full text-sm text-gray-300 focus:outline-none font-mono"
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">修改后立即生效。请确保手机与电脑在同一 Wi-Fi 下。</p>
                    </div>
              </div>

              {/* Download Settings */}
              <div className="bg-dark-light p-5 rounded-xl border border-white/5">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <DownloadIcon size={18} /> 下载设置
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs text-gray-400 mb-2">下载目录 (仅供参考，受限于浏览器安全策略)</label>
                          <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-white/10">
                              <FolderIcon className="text-gray-500" />
                              <input 
                                type="text" 
                                value={settings.downloadPath}
                                onChange={(e) => setSettings({...settings, downloadPath: e.target.value})}
                                className="bg-transparent w-full text-sm text-gray-300 focus:outline-none"
                              />
                          </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                          <span className="text-sm">音质选择</span>
                          <select 
                            value={settings.downloadQuality}
                            onChange={(e) => setSettings({...settings, downloadQuality: e.target.value})}
                            className="bg-black/30 text-white text-sm border border-white/10 rounded px-3 py-1.5 focus:outline-none"
                          >
                              <option value="standard">标准 (128k)</option>
                              <option value="high">极高 (320k)</option>
                              <option value="lossless">无损 (FLAC)</option>
                          </select>
                      </div>

                      <div className="flex items-center justify-between">
                          <span className="text-sm">同时下载歌词</span>
                          <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${settings.autoDownloadLyrics ? 'bg-primary' : 'bg-gray-600'}`} onClick={() => setSettings({...settings, autoDownloadLyrics: !settings.autoDownloadLyrics})}>
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.autoDownloadLyrics ? 'left-5.5' : 'left-0.5'}`}></div>
                          </div>
                      </div>
                  </div>
              </div>

               {/* About */}
               <div className="bg-dark-light p-5 rounded-xl border border-white/5">
                  <h3 className="font-bold text-white mb-2">关于 UniStream</h3>
                  <p className="text-xs text-gray-400 mb-4">版本 v1.5.0 (Build 20240520)</p>
                  <p className="text-xs text-gray-500">
                      本项目仅供学习交流使用。所有音源来自第三方插件，请支持正版音乐。
                  </p>
               </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col md:flex-row">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col w-64 border-r border-white/5 p-6 bg-dark">
        <div className="flex items-center gap-2 mb-10 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">U</span>
            </div>
            UniStream
        </div>
        <nav className="space-y-2 flex-1">
          <NavBtn icon={<HomeIcon />} label="首页" active={view === 'HOME'} onClick={() => setView('HOME')} />
          <NavBtn icon={<SearchIcon />} label="搜索" active={view === 'SEARCH'} onClick={() => setView('SEARCH')} />
          <NavBtn icon={<LibraryIcon />} label="我的音乐" active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} />
          <div className="pt-4 pb-2 text-xs text-gray-500 font-bold px-4">扩展</div>
          <NavBtn icon={<LabIcon />} label="实验室" active={view === 'LABS'} onClick={() => setView('LABS')} />
          <NavBtn icon={<SettingsIcon />} label="设置" active={view === 'SETTINGS'} onClick={() => setView('SETTINGS')} />
        </nav>

        {/* Desktop Sidebar Login Button */}
        <div className="pt-4 border-t border-white/10">
          {user ? (
            <div className="flex items-center gap-3">
               <img src={user.avatarUrl} className="w-8 h-8 rounded-full" />
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user.nickname}</p>
               </div>
               <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">退出</button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="w-full bg-white/5 hover:bg-white/10 text-gray-300 text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <NeteaseIcon className="w-4 h-4" /> 登录
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto no-scrollbar relative">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {view === 'HOME' && renderHome()}
          {view === 'SEARCH' && renderSearch()}
          {view === 'LABS' && renderLabs()}
          {view === 'LIBRARY' && renderLibrary()}
          {view === 'SETTINGS' && renderSettings()}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-light/90 backdrop-blur-lg border-t border-white/5 flex justify-around items-center py-3 pb-safe z-50">
          <MobileNavBtn icon={<HomeIcon />} label="首页" active={view === 'HOME'} onClick={() => setView('HOME')} />
          <MobileNavBtn icon={<SearchIcon />} label="搜索" active={view === 'SEARCH'} onClick={() => setView('SEARCH')} />
          <MobileNavBtn icon={<LibraryIcon />} label="我的" active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} />
          <MobileNavBtn icon={<LabIcon />} label="实验室" active={view === 'LABS'} onClick={() => setView('LABS')} />
          <MobileNavBtn icon={<SettingsIcon />} label="设置" active={view === 'SETTINGS'} onClick={() => setView('SETTINGS')} />
      </div>

      {/* Sticky Player (Above Mobile Nav) */}
      <div className={`transition-all duration-300 ${currentSong ? 'mb-16 md:mb-0' : ''}`}>
         <Player 
            currentSong={currentSong} 
            isPlaying={isPlaying} 
            onPlayPause={togglePlayPause} 
            onNext={handleNext}
            onPrev={handlePrev}
            onToggleLike={handleToggleLike}
            onDownload={handleDownload}
            isLiked={isLiked(currentSong)}
         />
      </div>

      {showLogin && <LoginModal onLogin={handleLoginSuccess} onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// Sub-components used only in App
const NavBtn = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
  >
    {React.cloneElement(icon, { size: 20 })}
    <span>{label}</span>
  </button>
);

const MobileNavBtn = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center space-y-1 ${active ? 'text-white' : 'text-gray-500'}`}>
        {React.cloneElement(icon, { size: 20 })}
        <span className="text-[10px]">{label}</span>
    </button>
);

interface SongItemProps {
    song: Song;
    onClick: () => void;
    isCurrent: boolean;
    onToggleLike: () => void;
    onDownload: () => void;
    onPlayNext: () => void;
    isLiked: boolean;
    isOpenMenu: boolean;
    setOpenMenu: (id: string | null) => void;
}

const SongItem: React.FC<SongItemProps> = ({ song, onClick, isCurrent, onToggleLike, onDownload, onPlayNext, isLiked, isOpenMenu, setOpenMenu }) => (
  <div 
    onClick={onClick}
    className={`group flex items-center p-3 rounded-xl cursor-pointer transition-colors ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
  >
    <div className="relative w-12 h-12 rounded-lg overflow-hidden mr-4 flex-shrink-0">
      <img src={song.coverUrl} alt={song.title} className={`w-full h-full object-cover ${song.isGray ? 'grayscale opacity-50' : ''}`} />
      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isCurrent ? (
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"/>
          ) : (
              <PlayIcon size={16} className="text-white"/>
          )}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className={`font-medium text-sm truncate ${isCurrent ? 'text-primary' : (song.isGray ? 'text-gray-500' : 'text-white')}`}>
          {song.title}
          {song.isGray && <span className="ml-2 text-[9px] border border-gray-600 rounded px-1">无版权</span>}
      </h3>
      <p className="text-xs text-gray-400 truncate">{song.artist} • {song.album}</p>
    </div>
    
    <div className="flex items-center gap-2 ml-2" onClick={e => e.stopPropagation()}>
         {/* Context Menu Trigger */}
         <div className="relative">
             <button onClick={() => setOpenMenu(isOpenMenu ? null : song.id)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
                 <MoreVerticalIcon size={18} />
             </button>
             <SongItemMenu song={song} isLiked={isLiked} onToggleLike={onToggleLike} onDownload={onDownload} onPlayNext={onPlayNext} isOpen={isOpenMenu} setOpen={(v) => setOpenMenu(v ? song.id : null)} />
         </div>

        {song.source === MusicSource.NETEASE ? (
            <div title="网易云直连" className="hidden sm:block p-1 bg-gray-800 rounded opacity-80"><NeteaseIcon className="w-3 h-3 text-netease" /></div>
        ) : song.source === MusicSource.PLUGIN ? (
            <div title="插件直连" className="hidden sm:block p-1 bg-gray-800 rounded opacity-80"><span className="text-[9px] font-bold text-green-400">PLUG</span></div>
        ) : (
            <div title="YouTube Direct" className="hidden sm:block p-1 bg-gray-800 rounded opacity-80"><YouTubeIcon className="w-3 h-3 text-youtube" /></div>
        )}
    </div>
  </div>
);

const SongItemMenu = ({ song, isLiked, onToggleLike, onDownload, onPlayNext, isOpen, setOpen }: any) => {
    if (!isOpen) return null;
    return (
        <div className="absolute right-0 top-10 w-40 bg-dark-light border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            <button onClick={() => { onPlayNext(); setOpen(false); }} className="w-full text-left px-4 py-3 text-xs hover:bg-white/10 flex items-center gap-2 text-white">
                <NextPlanIcon size={14} /> 下一首播放
            </button>
            <button onClick={() => { onToggleLike(); setOpen(false); }} className="w-full text-left px-4 py-3 text-xs hover:bg-white/10 flex items-center gap-2 text-white">
                <HeartIcon size={14} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-netease" : ""} /> {isLiked ? "取消收藏" : "收藏"}
            </button>
            <button onClick={() => { onDownload(); setOpen(false); }} className="w-full text-left px-4 py-3 text-xs hover:bg-white/10 flex items-center gap-2 text-white">
                <DownloadIcon size={14} /> 下载
            </button>
        </div>
    );
};