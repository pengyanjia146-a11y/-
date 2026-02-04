import React, { useState, useRef, useEffect } from 'react';
import { musicService } from './services/geminiService';
import { Player } from './components/Player';
import { LoginModal } from './components/LoginModal';
import { Toast, ToastType } from './components/Toast';
import { Icons } from './components/Icons';
import { Song, UserProfile, ViewState, MusicSource, Playlist, MusicPlugin, AudioQuality, Artist } from './types';

export default function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [quality, setQuality] = useState<AudioQuality>('standard');
  const [activeTab, setActiveTab] = useState<'ALL' | 'NETEASE' | 'BILIBILI' | 'YOUTUBE' | 'PLUGIN'>('ALL');
  const [toast, setToast] = useState<{msg: string, type: ToastType, show: boolean}>({ msg: '', type: 'info', show: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [playMode, setPlayMode] = useState<'sequence' | 'random' | 'single'>('sequence');

  // Persistence (Simplified for brevity)
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playHistory, setPlayHistory] = useState<Song[]>([]);

  const showToast = (msg: string, type: ToastType = 'info') => setToast({ msg, type, show: true });

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleNext = () => {
      // 简单切歌逻辑
      if(!queue.length) return;
      const idx = queue.findIndex(s => s.id === currentSong?.id);
      const nextIdx = (idx + 1) % queue.length;
      playSong(queue[nextIdx]);
  };
  const handlePrev = () => {
      if(!queue.length) return;
      const idx = queue.findIndex(s => s.id === currentSong?.id);
      const prevIdx = (idx - 1 + queue.length) % queue.length;
      playSong(queue[prevIdx]);
  };
  const handleToggleMode = () => {
      const modes = ['sequence', 'random', 'single'] as const;
      const next = modes[(modes.indexOf(playMode) + 1) % modes.length];
      setPlayMode(next);
      showToast(`播放模式: ${next}`);
  };

  const playSong = async (song: Song, newQueue?: Song[]) => {
      setIsPlaying(false);
      setCurrentSong(song);
      if (newQueue) setQueue(newQueue);
      
      try {
          const details = await musicService.getSongDetails(song, quality);
          if (details.url) {
              const updated = { ...song, audioUrl: details.url, lyric: details.lyric };
              setCurrentSong(updated);
              setIsPlaying(true);
              setPlayHistory(prev => [updated, ...prev].slice(0, 50));
          } else {
              showToast('无法获取播放地址', 'error');
          }
      } catch (e) {
          showToast('播放失败', 'error');
      }
  };

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setSearchLoading(true);
      const res = await musicService.searchMusic(searchQuery);
      setSearchResults(res);
      setSearchLoading(false);
  };

  const renderHome = () => (
      <div className="pb-24 animate-fade-in space-y-6">
          <div className="bg-gradient-to-r from-gray-900 to-indigo-900 p-6 rounded-2xl shadow-xl">
              <h1 className="text-3xl font-bold mb-2">UniStream</h1>
              <p className="text-gray-300">聚合音乐体验</p>
          </div>
          {playHistory.length > 0 && (
              <div>
                  <h3 className="font-bold mb-3">最近播放</h3>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {playHistory.map((s, i) => (
                          <div key={i} className="w-24 flex-shrink-0 cursor-pointer" onClick={() => playSong(s)}>
                              <img src={s.cover} className="w-24 h-24 rounded-lg object-cover mb-2" />
                              <p className="text-xs truncate">{s.title}</p>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
  );

  const renderSearch = () => (
      <div className="pb-24">
          <form onSubmit={handleSearch} className="sticky top-0 bg-black z-10 py-4">
              <div className="relative">
                  <Icons.Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input 
                      type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="搜索全网音乐..." 
                      className="w-full bg-gray-900 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
              </div>
          </form>
          {searchLoading ? (
              <div className="flex justify-center py-10"><Icons.Loader className="animate-spin text-indigo-500" size={32} /></div>
          ) : (
              <div className="space-y-2">
                  {searchResults.map(song => (
                      <div key={song.id} onClick={() => playSong(song, searchResults)} className="flex items-center p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                          <img src={song.cover} className="w-12 h-12 rounded object-cover mr-3" />
                          <div className="min-w-0">
                              <h4 className={`font-medium truncate ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-white'}`}>{song.title}</h4>
                              <p className="text-xs text-gray-400 truncate">{song.artist} • {song.source}</p>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <Toast message={toast.msg} type={toast.type} isVisible={toast.show} onClose={() => setToast(t => ({...t, show: false}))} />
      
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex flex-col w-64 border-r border-white/10 p-6 bg-black">
          <div className="text-xl font-bold mb-8 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">U</div> UniStream
          </div>
          <nav className="space-y-2">
              <NavBtn icon={<Icons.Home />} label="首页" active={view === 'HOME'} onClick={() => setView('HOME')} />
              <NavBtn icon={<Icons.Search />} label="搜索" active={view === 'SEARCH'} onClick={() => setView('SEARCH')} />
              <NavBtn icon={<Icons.Library />} label="我的" active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} />
              <NavBtn icon={<Icons.Settings />} label="设置" active={view === 'SETTINGS'} onClick={() => setView('SETTINGS')} />
          </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 md:p-8">
          {view === 'HOME' && renderHome()}
          {view === 'SEARCH' && renderSearch()}
          {view === 'LIBRARY' && <div className="text-center py-20 text-gray-500">我的音乐库 (开发中)</div>}
          {view === 'SETTINGS' && <div className="text-center py-20 text-gray-500">设置 (开发中)</div>}
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 flex justify-around py-3 pb-safe z-50">
          <MobileBtn icon={<Icons.Home />} label="首页" active={view === 'HOME'} onClick={() => setView('HOME')} />
          <MobileBtn icon={<Icons.Search />} label="搜索" active={view === 'SEARCH'} onClick={() => setView('SEARCH')} />
          <MobileBtn icon={<Icons.Library />} label="我的" active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} />
      </div>

      {/* Player Bar */}
      {currentSong && (
          <div className="mb-16 md:mb-0">
             <Player 
                currentSong={currentSong} isPlaying={isPlaying}
                onPlayPause={handlePlayPause} onNext={handleNext} onPrev={handlePrev}
                onToggleLike={() => {}} onDownload={() => {}} isLiked={false}
                quality={quality} setQuality={setQuality}
                playMode={playMode} onToggleMode={handleToggleMode}
                className="bottom-16 md:bottom-0 md:left-64 border-t border-white/10"
             />
          </div>
      )}

      {showLogin && <LoginModal onLogin={u => { setUser(u); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
    </div>
  );
}

const NavBtn = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
    {React.cloneElement(icon, { size: 20 })} <span>{label}</span>
  </button>
);

const MobileBtn = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center space-y-1 ${active ? 'text-white' : 'text-gray-500'}`}>
        {React.cloneElement(icon, { size: 20 })} <span className="text-[10px]">{label}</span>
    </button>
);
