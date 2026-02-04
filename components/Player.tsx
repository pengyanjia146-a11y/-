
import React, { useEffect, useState, useRef } from 'react';
import { Song, MusicSource, AudioQuality } from '../types';
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon, NeteaseIcon, YouTubeIcon, LyricsIcon, CloseIcon, DownloadIcon, HeartIcon, VolumeIcon, VolumeMuteIcon, ChevronDownIcon, ListIcon } from './Icons';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleLike: (song: Song) => void;
  onDownload: (song: Song) => void;
  isLiked: boolean;
  quality: AudioQuality;
  setQuality: (q: AudioQuality) => void;
}

export const Player: React.FC<PlayerProps> = ({ currentSong, isPlaying, onPlayPause, onNext, onPrev, onToggleLike, onDownload, isLiked, quality, setQuality }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Fullscreen State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsLines, setLyricsLines] = useState<{time: number, text: string}[]>([]);
  const lyricsRef = useRef<HTMLDivElement>(null);

  // Network Speed Simulation
  const [netSpeed, setNetSpeed] = useState<string>('0 KB/s');
  const [isBuffering, setIsBuffering] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);
  
  // Volume State
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

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

  // Handle Song Change
  useEffect(() => {
    if (currentSong) {
        setError(null);
        setLyricsLines(parseLyrics(currentSong.lyric || ''));
        // If reusing player, we might not need to force reload src if it hasn't changed, but here we usually do
    }
  }, [currentSong]);

  // Handle Play/Pause
  useEffect(() => {
      if (audioRef.current) {
          if (isPlaying) {
              const promise = audioRef.current.play();
              if (promise) promise.catch(() => {});
          } else {
              audioRef.current.pause();
          }
      }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && currentSong?.audioUrl) {
         if (audioRef.current.src !== currentSong.audioUrl) {
             audioRef.current.src = currentSong.audioUrl;
             if(isPlaying) audioRef.current.play().catch(()=>{});
         }
    }
  }, [currentSong?.audioUrl]);


  // Network Speed Simulation Hook
  useEffect(() => {
      let interval: any;
      if (isBuffering) {
          interval = setInterval(() => {
              // Random speed between 200KB/s and 2MB/s just for visuals
              const speed = Math.floor(Math.random() * (2048 - 200) + 200);
              setNetSpeed(speed > 1024 ? `${(speed/1024).toFixed(1)} MB/s` : `${speed} KB/s`);
          }, 800);
      } else {
          setNetSpeed('');
      }
      return () => clearInterval(interval);
  }, [isBuffering]);

  // Volume
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (audioRef.current) {
          const seekTime = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
          audioRef.current.currentTime = seekTime;
          setProgress(parseFloat(e.target.value));
      }
  };

  // Lyrics Auto-Scroll
  const activeLyricIndex = lyricsLines.findIndex((l, i) => {
      return currentTime >= l.time && (i === lyricsLines.length - 1 || currentTime < lyricsLines[i+1].time);
  });

  useEffect(() => {
      if (isFullScreen && showLyrics && lyricsRef.current && activeLyricIndex !== -1) {
          const activeEl = lyricsRef.current.children[activeLyricIndex] as HTMLElement;
          if (activeEl) {
             activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activeLyricIndex, showLyrics, isFullScreen]);

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

  const formatTime = (seconds: number) => {
      if (isNaN(seconds)) return "00:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentSong) return null;

  return (
    <>
      {/* Full Screen Player Overlay */}
      <div className={`fixed inset-0 z-[60] bg-dark flex flex-col transition-transform duration-500 ease-in-out ${isFullScreen ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Backdrop Blur */}
          <div className="absolute inset-0 z-0">
             <img src={currentSong.coverUrl} className="w-full h-full object-cover blur-3xl opacity-40 brightness-50" />
             <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
              <button onClick={() => setIsFullScreen(false)} className="text-white p-2">
                  <ChevronDownIcon size={30} />
              </button>
              <div className="flex flex-col items-center">
                  <span className="text-white text-lg font-bold truncate max-w-[200px]">{currentSong.title}</span>
                  <span className="text-gray-300 text-xs">{currentSong.artist}</span>
              </div>
              <button className="p-2 opacity-0"><ChevronDownIcon /></button> {/* Placeholder */}
          </div>

          {/* Middle Content: Vinyl or Lyrics */}
          <div 
             className="relative z-10 flex-1 flex flex-col items-center justify-center w-full overflow-hidden" 
             onClick={() => setShowLyrics(!showLyrics)}
          >
             {showLyrics ? (
                // Lyrics View
                <div ref={lyricsRef} className="w-full h-full overflow-y-auto px-8 text-center no-scrollbar mask-image-gradient py-10">
                     {lyricsLines.length > 0 ? lyricsLines.map((line, idx) => (
                         <p key={idx} className={`py-3 transition-all duration-300 ${idx === activeLyricIndex ? 'text-white text-xl font-bold' : 'text-gray-400 text-sm'}`}>
                             {line.text}
                         </p>
                     )) : <p className="text-gray-500 mt-20">暂无歌词</p>}
                </div>
             ) : (
                // Vinyl View
                <div className={`relative w-[70vw] h-[70vw] max-w-[350px] max-h-[350px] rounded-full border-8 border-black/80 shadow-2xl overflow-hidden ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`} style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                    <img src={currentSong.coverUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 rounded-full border-[10px] border-black/10"></div>
                </div>
             )}
          </div>

          {/* Bottom Controls */}
          <div className="relative z-10 pb-12 px-6 bg-gradient-to-t from-black/80 to-transparent">
               
               {/* Metadata & Actions */}
               <div className="flex justify-between items-center mb-6 px-4">
                   <div className="flex flex-col">
                       <span className="text-2xl font-bold text-white mb-1 line-clamp-1">{currentSong.title}</span>
                       <span className="text-gray-400 text-sm">{currentSong.artist}</span>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); onToggleLike(currentSong); }}>
                        <HeartIcon size={28} fill={isLiked ? "#dd001b" : "none"} className={isLiked ? "text-netease" : "text-white"} />
                   </button>
               </div>

               {/* Progress Bar & Time */}
               <div className="mb-2">
                   <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
                        <span>{formatTime(currentTime)}</span>
                        {isBuffering && <span className="text-primary animate-pulse text-[10px]">{netSpeed}</span>}
                        <span>{formatTime(currentSong.duration)}</span>
                   </div>
                   <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="0.1"
                      value={progress}
                      onChange={handleSeek}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                   />
               </div>

               {/* Quality & Controls */}
               <div className="flex justify-center items-center gap-2 mb-6">
                   {(['standard', 'exhigh', 'lossless'] as AudioQuality[]).map(q => (
                       <button 
                         key={q} 
                         onClick={(e) => { e.stopPropagation(); setQuality(q); }}
                         className={`text-[10px] px-2 py-1 rounded border ${quality === q ? 'bg-white text-black border-white' : 'text-gray-400 border-gray-600'}`}
                       >
                           {q === 'standard' ? '标准' : (q === 'exhigh' ? '极高' : '无损')}
                       </button>
                   ))}
               </div>

               <div className="flex items-center justify-around">
                   <button className="text-gray-300 hover:text-white"><ListIcon size={24} /></button>
                   <button onClick={(e) => {e.stopPropagation(); onPrev();}} className="text-white hover:opacity-80"><SkipBackIcon size={32} /></button>
                   <button onClick={(e) => {e.stopPropagation(); onPlayPause();}} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
                        {isPlaying ? <PauseIcon size={32} fill="black" /> : <PlayIcon size={32} fill="black" />}
                   </button>
                   <button onClick={(e) => {e.stopPropagation(); onNext();}} className="text-white hover:opacity-80"><SkipForwardIcon size={32} /></button>
                   <button onClick={(e) => {e.stopPropagation(); onDownload(currentSong);}} className="text-gray-300 hover:text-white"><DownloadIcon size={24} /></button>
               </div>
          </div>
      </div>

      {/* Mini Player Bar (Bottom) */}
      <div className={`fixed md:bottom-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 bg-dark/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 z-50 cursor-pointer ${isFullScreen ? 'invisible' : 'visible'}`} onClick={() => setIsFullScreen(true)}>
        <audio 
          ref={audioRef} 
          onTimeUpdate={handleTimeUpdate} 
          onEnded={onNext}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onError={(e) => { console.error(e); setError('Load Error'); }}
          preload="auto"
          crossOrigin="anonymous" 
        />
        
        {/* Mini Progress */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
            <div className="h-full bg-netease" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex items-center justify-between max-w-7xl mx-auto h-12">
            <div className="flex items-center flex-1 min-w-0 mr-4 gap-3">
                <img 
                    src={currentSong.coverUrl} 
                    className={`w-10 h-10 rounded-full object-cover shadow-lg border border-white/10 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`} 
                />
                <div className="flex flex-col min-w-0">
                    <h4 className="text-white font-medium text-sm truncate">{currentSong.title}</h4>
                    <p className="text-gray-400 text-xs truncate">{currentSong.artist}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button onClick={(e) => {e.stopPropagation(); onPlayPause();}} className="w-9 h-9 border border-white/30 rounded-full flex items-center justify-center text-white">
                    {isPlaying ? <PauseIcon size={16} fill="white" /> : <PlayIcon size={16} fill="white" />}
                </button>
                <button onClick={(e) => {e.stopPropagation(); setIsFullScreen(true);}} className="text-gray-400">
                    <ListIcon size={20} />
                </button>
            </div>
        </div>
      </div>
    </>
  );
};
