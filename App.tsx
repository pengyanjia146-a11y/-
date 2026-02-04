import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './components/Icons';
import { Player } from './components/Player';
import { Song } from './types';
import axios from 'axios';

// 请确保这里是你电脑的局域网 IP (例如 192.168.1.5:3001)
// 手机无法访问 localhost
const API_BASE_URL = 'http://localhost:3001'; 

type PlayMode = 'sequence' | 'random' | 'single';
type SearchSource = 'netease' | 'youtube' | 'bilibili';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'user'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 新功能状态
  const [playMode, setPlayMode] = useState<PlayMode>('sequence');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSource, setSearchSource] = useState<SearchSource>('netease');

  const audioRef = useRef<HTMLAudioElement>(null);

  // --- 播放控制逻辑 ---

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  // 核心：根据模式计算下一首
  const getNextSongIndex = (current: number, total: number, mode: PlayMode, direction: 'next' | 'prev') => {
    if (mode === 'random') {
      return Math.floor(Math.random() * total);
    }
    // 顺序模式
    if (direction === 'next') {
      return (current + 1) % total;
    } else {
      return (current - 1 + total) % total;
    }
  };

  const handleNext = () => {
    if (!currentSong || searchResults.length === 0) return;
    const currentIndex = searchResults.findIndex(s => s.id === currentSong.id);
    const nextIndex = getNextSongIndex(currentIndex, searchResults.length, playMode, 'next');
    handleSongSelect(searchResults[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentSong || searchResults.length === 0) return;
    const currentIndex = searchResults.findIndex(s => s.id === currentSong.id);
    const prevIndex = getNextSongIndex(currentIndex, searchResults.length, playMode, 'prev');
    handleSongSelect(searchResults[prevIndex]);
  };

  // 自动连播逻辑
  const handleSongEnd = () => {
    if (playMode === 'single' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      handleNext();
    }
  };

  const togglePlayMode = () => {
    const modes: PlayMode[] = ['sequence', 'random', 'single'];
    const nextMode = modes[(modes.indexOf(playMode) + 1) % modes.length];
    setPlayMode(nextMode);
  };

  // --- 搜索与 API ---

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setSearchResults([]); 

    try {
      const res = await axios.get(`${API_BASE_URL}/api/search/${searchSource}`, {
        params: { keyword: searchQuery }
      });
      setSearchResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
      alert('搜索失败，请检查网络或后端代理');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongSelect = async (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(false);
    
    try {
      const res = await axios.get(`${API_BASE_URL}/api/play/${song.source}`, {
        params: { id: song.id }
      });
      
      if (res.data.url && audioRef.current) {
        audioRef.current.src = res.data.url;
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        alert('该资源无法播放');
      }
    } catch (error) {
      console.error('Play failed:', error);
      alert('播放失败');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans select-none flex flex-col">
      
      {/* 顶部搜索栏 */}
      <div className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur z-40 px-4 pt-4 pb-2 border-b border-white/10">
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`搜索 ${searchSource === 'netease' ? '网易云' : searchSource === 'youtube' ? 'YouTube' : 'Bilibili'}`}
              className="w-full bg-gray-900 border border-gray-800 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </form>
        
        {/* 搜索源 Tab */}
        <div className="flex justify-around text-sm">
          {(['netease', 'youtube', 'bilibili'] as SearchSource[]).map(source => (
            <button
              key={source}
              onClick={() => setSearchSource(source)}
              className={`pb-2 px-2 border-b-2 capitalize transition-all ${
                searchSource === source 
                  ? 'border-purple-500 text-purple-400 font-medium' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              {source === 'netease' ? '网易云' : source}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容区：pt-32 避开顶部，pb-40 避开底部播放器 */}
      <main className="flex-1 pt-32 pb-40 px-4 overflow-y-auto">
        
        {/* 加载状态 (延时界面插件) */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse">
            <Icons.Loader className="w-10 h-10 animate-spin mb-4 text-purple-600" />
            <p>正在搜索全网资源...</p>
          </div>
        )}

        {/* 结果列表 */}
        {!isLoading && (
          <div className="space-y-3">
            {searchResults.map((song) => (
              <div
                key={song.id}
                onClick={() => handleSongSelect(song)}
                className={`flex items-center p-3 rounded-xl active:scale-[0.98] transition-all ${
                  currentSong?.id === song.id 
                    ? 'bg-gradient-to-r from-purple-900/40 to-transparent border border-purple-500/30' 
                    : 'bg-gray-900/40 border border-transparent'
                }`}
              >
                <div className="relative">
                  <img 
                    src={song.cover} 
                    alt={song.title} 
                    className="w-14 h-14 rounded-lg object-cover bg-gray-800 shadow-lg"
                  />
                  {/* 来源角标 */}
                  <div className="absolute -bottom-1 -right-1 bg-black/80 text-[10px] px-1.5 rounded border border-gray-700 uppercase text-gray-300">
                    {song.source === 'netease' ? 'Cloud' : song.source.slice(0, 2)}
                  </div>
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className={`font-medium truncate ${currentSong?.id === song.id ? 'text-purple-400' : 'text-white'}`}>
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate mt-0.5">{song.artist}</p>
                </div>
              </div>
            ))}
            
            {!isLoading && searchResults.length === 0 && searchQuery && (
              <div className="text-center text-gray-600 py-10">
                未找到相关内容，请尝试切换源
              </div>
            )}
          </div>
        )}
      </main>

      {/* 底部播放器 (固定在菜单上方: bottom-[64px]) */}
      {currentSong && (
        <Player
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          playMode={playMode}
          onToggleMode={togglePlayMode}
          className="bottom-16 border-b border-black shadow-2xl" 
        />
      )}

      {/* 底部导航菜单 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-white/5 pb-safe z-50 h-16">
        <div className="flex justify-around items-center h-full">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'home' ? 'text-purple-500' : 'text-gray-600'}`}
          >
            <Icons.Home className="w-5 h-5" />
            <span className="text-[10px]">首页</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'library' ? 'text-purple-500' : 'text-gray-600'}`}
          >
            <Icons.Library className="w-5 h-5" />
            <span className="text-[10px]">媒体库</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('user')}
            className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'user' ? 'text-purple-500' : 'text-gray-600'}`}
          >
            <Icons.User className="w-5 h-5" />
            <span className="text-[10px]">我的</span>
          </button>
        </div>
      </nav>

      <audio 
        ref={audioRef} 
        onEnded={handleSongEnd}
        onError={(e) => console.error("Audio Error", e)}
      />
    </div>
  );
}

export default App;
