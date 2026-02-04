import React, { useEffect, useState, useRef } from 'react';
import { Song, MusicSource } from '../types';
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon, NeteaseIcon, YouTubeIcon, LyricsIcon, CloseIcon, DownloadIcon, HeartIcon, VolumeIcon, VolumeMuteIcon } from './Icons';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleLike: (song: Song) => void;
  onDownload: (song: Song) => void;
  isLiked: boolean;
}

export const Player: React.FC<PlayerProps> = ({ currentSong, isPlaying, onPlayPause, onNext, onPrev, onToggleLike, onDownload, isLiked }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Volume State
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  // Background Playback (MediaSession API)
  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.title,
            artist: currentSong.artist,
            album: currentSong.album,
            artwork: [
                { src: currentSong.coverUrl, sizes: '512x512', type: 'image/jpeg' }
            ]
        });

        navigator.mediaSession.setActionHandler('play', onPlayPause);
        navigator.mediaSession.setActionHandler('pause', onPlayPause);
        navigator.mediaSession.setActionHandler('previoustrack', onPrev);
        navigator.mediaSession.setActionHandler('nexttrack', onNext);
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (audioRef.current && details.seekTime !== undefined) {
                audioRef.current.currentTime = details.seekTime;
            }
        });
    }
  }, [currentSong, onPlayPause, onNext, onPrev]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
        // Reset error on song change
        setError(null);

        // Only update src if it's different and valid
        if (currentSong.audioUrl && audioRef.current.src !== currentSong.audioUrl) {
            audioRef.current.src = currentSong.audioUrl;
            // Explicitly load
            audioRef.current.load();
        }
        
        if (isPlaying && currentSong.audioUrl) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Ignore "The play() request was interrupted by a call to pause()" error
                    if (error.name === 'AbortError') return;
                    console.error("Playback blocked or interrupted:", error);
                });
            }
        } else {
            audioRef.current.pause();
        }
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current && currentSong) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      const percent = (time / audioRef.current.duration) * 100;
      setProgress(percent || 0);
    }
  };

  const handleEnded = () => {
      onNext();
  };
  
  const handleError = (e: any) => {
      console.error("Audio Error Event:", e);
      if (audioRef.current?.error) {
           console.error("Media Error Code:", audioRef.current.error.code);
           
           let msg = "播放失败";
           // Android specific tips
           if (audioRef.current.error.code === 4) msg = "资源无效 (请切换网络或稍后重试)";
           if (audioRef.current.error.code === 3) msg = "解码错误";
           if (audioRef.current.error.code === 2) msg = "网络错误";
           
           setError(msg);
      }
  };

  const toggleMute = () => {
      if (isMuted) {
          setIsMuted(false);
          setVolume(prevVolume);
      } else {
          setPrevVolume(volume);
          setIsMuted(true);
          setVolume(0);
      }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      setIsMuted(val === 0);
  };

  // Simple Lyrics Parser
  const parseLyrics = (lrc: string) => {
      if (!lrc) return [];
      const lines = lrc.split('\n');
      const result = [];
      const timeExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
      for (const line of lines) {
          const match = timeExp.exec(line);
          if (match) {
              const minutes = parseInt(match[1]);
              const seconds = parseInt(match[2]);
              const ms = parseFloat("0." + match[3]);
              const time = minutes * 60 + seconds + ms;
              const text = line.replace(timeExp, '').trim();
              if (text) result.push({ time, text });
          }
      }
      return result;
  };

  const currentLyrics = currentSong?.lyric ? parseLyrics(currentSong.lyric) : [];
  
  const activeLyricIndex = currentLyrics.findIndex((l, i) => {
      return currentTime >= l.time && (i === currentLyrics.length - 1 || currentTime < currentLyrics[i+1].time);
  });

  useEffect(() => {
      if (showLyrics && lyricsRef.current && activeLyricIndex !== -1) {
          const activeEl = lyricsRef.current.children[activeLyricIndex] as HTMLElement;
          if (activeEl) {
             activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activeLyricIndex, showLyrics]);


  if (!currentSong) return null;

  return (
    <>
      {showLyrics && (
        <div className="fixed inset-0 z-[60] bg-dark/95 backdrop-blur-2xl flex flex-col items-center animate-fade-in">
            <button onClick={() => setShowLyrics(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white p-2">
                <CloseIcon size={32} />
            </button>
            
            <div className="mt-20 mb-8 flex flex-col items-center">
                <img src={currentSong.coverUrl} className="w-48 h-48 rounded-2xl shadow-2xl mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">{currentSong.title}</h2>
                <p className="text-gray-400">{currentSong.artist}</p>
                {error && <p className="text-red-400 mt-4 border border-red-500/30 bg-red-900/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">⚠️ {error}</p>}
            </div>

            <div ref={lyricsRef} className="flex-1 w-full max-w-lg overflow-y-auto px-6 pb-32 text-center no-scrollbar mask-image-gradient">
                {currentLyrics.length > 0 ? currentLyrics.map((line, idx) => (
                    <p 
                        key={idx} 
                        className={`py-4 transition-all duration-300 ${idx === activeLyricIndex ? 'text-white text-xl font-bold scale-110' : 'text-gray-500 text-sm'}`}
                    >
                        {line.text}
                    </p>
                )) : (
                    <p className="text-gray-500 mt-20">暂无歌词</p>
                )}
            </div>
        </div>
      )}

      <div className="fixed md:bottom-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 bg-dark/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 z-50">
        <audio 
          ref={audioRef} 
          onTimeUpdate={handleTimeUpdate} 
          onEnded={handleEnded}
          onError={handleError}
          preload="auto"
          crossOrigin="anonymous" 
        />
        
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 cursor-pointer group">
          <div 
              className="h-full bg-gradient-to-r from-netease to-primary relative" 
              style={{ width: `${progress}%` }}
          >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>

        <div className="flex items-center justify-between max-w-7xl mx-auto h-14">
          <div className="flex items-center flex-1 min-w-0 mr-4 gap-3">
            <img 
              src={currentSong.coverUrl} 
              alt={currentSong.title} 
              onClick={() => setShowLyrics(!showLyrics)}
              className={`w-12 h-12 rounded-lg object-cover shadow-lg cursor-pointer hover:opacity-80 transition-opacity ${isPlaying ? 'animate-pulse-slow' : ''}`}
            />
            <div className="flex flex-col min-w-0 justify-center">
              <h4 className="text-white font-medium text-sm truncate flex items-center gap-2">
                  {currentSong.title}
                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-gray-400 font-normal hidden sm:inline-block">
                      {currentSong.source === MusicSource.NETEASE ? 'SQ' : (currentSong.source === MusicSource.PLUGIN ? 'FLAC' : 'HQ')}
                  </span>
              </h4>
              <div className="flex items-center text-xs text-gray-400 mt-1">
                  <span className="truncate max-w-[100px]">{currentSong.artist}</span>
                  <span className="mx-2 text-gray-600">|</span>
                  {currentSong.source === MusicSource.NETEASE && <NeteaseIcon className="w-3 h-3 text-netease mr-1" />}
                  {currentSong.source === MusicSource.YOUTUBE && <YouTubeIcon className="w-3 h-3 text-youtube mr-1" />}
                  {currentSong.source === MusicSource.PLUGIN && <span className="text-primary font-bold">Plugin</span>}
                  <span className="ml-1 scale-90">{currentSong.source}</span>
                  {error && <span className="ml-2 text-red-400 font-bold text-[10px] border border-red-500 rounded px-1">ERR</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
             <button onClick={() => onDownload(currentSong)} className="hidden md:block text-gray-400 hover:text-white transition-colors" title="下载">
                <DownloadIcon size={20} />
             </button>
             
             <button onClick={() => onToggleLike(currentSong)} className={`hidden md:block transition-colors ${isLiked ? 'text-netease' : 'text-gray-400 hover:text-white'}`} title="收藏">
                <HeartIcon size={20} fill={isLiked ? "currentColor" : "none"} />
             </button>

             <button onClick={() => setShowLyrics(!showLyrics)} className={`hidden md:block hover:text-white transition-colors ${showLyrics ? 'text-primary' : 'text-gray-400'}`} title="歌词">
                <LyricsIcon size={20} />
             </button>

            <div className="w-px h-6 bg-white/10 hidden md:block mx-2"></div>

            <button onClick={onPrev} className="text-gray-300 hover:text-white transition-colors">
              <SkipBackIcon size={24} />
            </button>
            
            <button 
              onClick={onPlayPause}
              className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-white/10"
            >
              {isPlaying ? <PauseIcon size={24} fill="black" /> : <PlayIcon size={24} fill="black" />}
            </button>

            <button onClick={onNext} className="text-gray-300 hover:text-white transition-colors">
              <SkipForwardIcon size={24} />
            </button>

             <div className="hidden lg:flex items-center group relative w-24">
                <button onClick={toggleMute} className="text-gray-400 hover:text-white mr-2">
                    {isMuted || volume === 0 ? <VolumeMuteIcon size={20} /> : <VolumeIcon size={20} />}
                </button>
                <div className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative overflow-hidden">
                     <div className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%` }}></div>
                     <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={isMuted ? 0 : volume} 
                        onChange={handleVolumeChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     />
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};