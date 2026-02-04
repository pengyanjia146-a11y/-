import React, { useEffect, useState, useRef } from 'react';
import { Song, MusicSource, AudioQuality } from '../types';
import { Icons } from './Icons';
import { musicService } from '../services/geminiService';

const parseLyrics = (lrc: string) => {
    if (!lrc) return [];
    const lines = lrc.split('\n');
    const result: { time: number; text: string }[] = [];
    const timeReg = /\[(\d{2}):(\d{2})(\.\d{2,3})?\]/g;
    
    for (const line of lines) {
        let match;
        const matches = [];
        while ((match = timeReg.exec(line)) !== null) {
             matches.push({
                 min: parseInt(match[1]),
                 sec: parseInt(match[2]),
                 ms: match[3] ? parseFloat(match[3]) : 0,
             });
        }
        if (matches.length > 0) {
            const text = line.replace(timeReg, '').trim();
            if (text) {
                matches.forEach(m => {
                    result.push({ time: m.min * 60 + m.sec + m.ms, text });
                });
            }
        }
    }
    return result.sort((a, b) => a.time - b.time);
};

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
  playMode?: 'sequence' | 'random' | 'single';
  onToggleMode?: () => void;
  className?: string;
}

export const Player: React.FC<PlayerProps> = ({ 
    currentSong, isPlaying, onPlayPause, onNext, onPrev, 
    onToggleLike, onDownload, isLiked, quality, setQuality,
    playMode = 'sequence', onToggleMode, className
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsLines, setLyricsLines] = useState<{time: number, text: string}[]>([]);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const [netSpeed, setNetSpeed] = useState<string>('0 KB/s');
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // Mode Icon Logic
  const ModeIcon = () => {
    switch (playMode) {
      case 'random': return <Icons.Shuffle size={20} className="text-purple-500" />;
      case 'single': return <Icons.Repeat1 size={20} className="text-purple-500" />;
      default: return <Icons.Repeat size={20} className="text-gray-400" />;
    }
  };

  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.title,
            artist: currentSong.artist,
            album: currentSong.album,
            artwork: [{ src: currentSong.cover, sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', onPlayPause);
        navigator.mediaSession.setActionHandler('pause', onPlayPause);
        navigator.mediaSession.setActionHandler('previoustrack', onPrev);
        navigator.mediaSession.setActionHandler('nexttrack', onNext);
    }
  }, [currentSong]);

  useEffect(() => {
    if (currentSong) {
        setError(null);
        setLyricsLines(parseLyrics(currentSong.lyric || ''));
        setIsVideoMode(false);
        setVideoUrl('');
        setDuration(currentSong.duration || 0);
    }
  }, [currentSong]);

  useEffect(() => {
      if (isVideoMode && videoRef.current) {
          if (isPlaying) videoRef.current.play().catch(()=>{});
          else videoRef.current.pause();
          if (audioRef.current) audioRef.current.pause();
      } else if (audioRef.current) {
          if (isPlaying) audioRef.current.play().catch(()=>{});
          else audioRef.current.pause();
          if (videoRef.current) videoRef.current.pause();
      }
  }, [isPlaying, isVideoMode]);

  useEffect(() => {
    if (audioRef.current && currentSong?.audioUrl && !isVideoMode) {
         if (audioRef.current.src !== currentSong.audioUrl) {
             audioRef.current.src = currentSong.audioUrl;
             if(isPlaying) audioRef.current.play().catch(()=>{});
         }
    }
  }, [currentSong?.audioUrl, isVideoMode, isPlaying]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const el = e.currentTarget;
    if (el) {
      setCurrentTime(el.currentTime);
      if (el.duration && !isNaN(el.duration) && el.duration !== Infinity) setDuration(el.duration);
      setProgress((el.currentTime / (el.duration || 1)) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = isVideoMode ? videoRef.current : audioRef.current;
      const d = duration || currentSong?.duration || 0;
      if (target && d > 0) {
          const seekTime = (parseFloat(e.target.value) / 100) * d;
          target.currentTime = seekTime;
          setProgress(parseFloat(e.target.value));
          setCurrentTime(seekTime);
      }
  };

  const toggleVideoMode = async () => {
      if (!currentSong) return;
      if (!isVideoMode) {
          if (!videoUrl) {
              setIsBuffering(true);
              const url = await musicService.getMvUrl(currentSong);
              setIsBuffering(false);
              if (url) {
                  setVideoUrl(url);
                  setIsVideoMode(true);
              } else {
                  setError("无 MV 资源");
                  setTimeout(() => setError(null), 2000);
              }
          } else {
              setIsVideoMode(true);
          }
      } else {
          setIsVideoMode(false);
      }
  };
  
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentLyricIndex = lyricsLines.findIndex((line, index) => {
      const nextLine = lyricsLines[index + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  if (!currentSong) return null;

  return (
    <>
      <audio 
          ref={audioRef} 
          onTimeUpdate={handleTimeUpdate} 
          onEnded={onNext}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onError={() => { setIsBuffering(false); setError("加载失败"); }}
      />
      
      {/* Full Screen */}
      <div className={`fixed inset-0 z-[60] bg-gray-900 flex flex-col transition-all duration-500 ease-in-out ${isFullScreen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 z-0 opacity-40">
              <img src={currentSong.cover} className="w-full h-full object-cover blur-3xl" />
              <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 flex items-center justify-between p-6 pt-12 md:pt-6">
              <button onClick={() => setIsFullScreen(false)} className="text-white/70 hover:text-white p-2">
                  <Icons.CloseIcon size={32} className="rotate-90" />
              </button>
              <div className="flex flex-col items-center">
                  <span className="text-xs text-white/60 mb-1">正在播放</span>
                  <span className="text-sm font-medium">{currentSong.source}</span>
              </div>
              <button className="text-white/70 hover:text-white p-2" onClick={() => setShowLyrics(!showLyrics)}>
                  <Icons.List size={24} />
              </button>
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
              {isVideoMode ? (
                  <div className="w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative">
                      <video 
                        ref={videoRef} src={videoUrl} className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate} onEnded={onNext}
                        onWaiting={() => setIsBuffering(true)} onPlaying={() => setIsBuffering(false)}
                        onClick={onPlayPause}
                      />
                  </div>
              ) : (
                  showLyrics ? (
                      <div ref={lyricsRef} className="w-full h-full overflow-y-auto no-scrollbar text-center space-y-8 py-10">
                          {lyricsLines.map((line, idx) => (
                              <p key={idx} ref={idx === currentLyricIndex ? activeLyricRef : null} className={`transition-all duration-300 px-4 ${idx === currentLyricIndex ? 'text-white text-2xl font-bold scale-105' : 'text-gray-400 text-lg'}`}>{line.text}</p>
                          ))}
                      </div>
                  ) : (
                      <div className={`relative w-full max-w-sm aspect-square mb-8 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl ${isPlaying ? 'animate-spin-slow' : ''}`}>
                          <img src={currentSong.cover} className="w-full h-full object-cover" />
                      </div>
                  )
              )}
          </div>

          <div className="relative z-10 p-8 pb-12 w-full max-w-3xl mx-auto flex flex-col gap-6">
              <div className="flex justify-between items-end">
                  <div>
                      <h2 className="text-2xl font-bold text-white mb-1 line-clamp-1">{currentSong.title}</h2>
                      <p className="text-gray-300 text-lg">{currentSong.artist}</p>
                  </div>
                  <div className="flex gap-4">
                      {currentSong.mvId && <button onClick={toggleVideoMode} className="text-white"><Icons.Video size={24} /></button>}
                      <button onClick={() => onToggleLike(currentSong)} className={isLiked ? "text-red-500" : "text-white"}><Icons.Heart size={28} fill={isLiked ? "currentColor" : "none"} /></button>
                      <button onClick={() => onDownload(currentSong)} className="text-white"><Icons.Download size={28} /></button>
                  </div>
              </div>

              <div className="flex flex-col gap-2">
                  <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
              </div>

              <div className="flex items-center justify-between">
                   <button onClick={() => setQuality(quality === 'standard' ? 'exhigh' : 'standard')} className="text-xs border px-2 py-1 text-gray-300">{quality}</button>
                   <div className="flex items-center gap-8">
                       <button onClick={onPrev} className="text-white"><Icons.SkipBack size={32} /></button>
                       <button onClick={onPlayPause} className="bg-white text-black rounded-full p-4 hover:scale-105 transition-transform">
                           {isPlaying ? <Icons.Pause size={32} fill="currentColor" /> : <Icons.Play size={32} fill="currentColor" />}
                       </button>
                       <button onClick={onNext} className="text-white"><Icons.SkipForward size={32} /></button>
                   </div>
                   {onToggleMode && <button onClick={onToggleMode} className="text-gray-400"><ModeIcon /></button>}
              </div>
          </div>
      </div>

      {/* Mini Player */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-white/10 p-2 flex items-center justify-between z-50 ${isFullScreen ? 'translate-y-full' : 'translate-y-0'} ${className}`} onClick={() => setIsFullScreen(true)}>
        <div className="absolute top-0 left-0 h-[2px] bg-indigo-500 z-10" style={{ width: `${progress}%` }} />
        <div className="flex items-center gap-3 overflow-hidden flex-1">
            <img src={currentSong.cover} className={`w-10 h-10 rounded bg-gray-800 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            <div className="min-w-0">
                <h4 className="font-bold text-sm truncate text-white">{currentSong.title}</h4>
                <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
            </div>
        </div>
        <div className="flex items-center gap-3 pr-2" onClick={e => e.stopPropagation()}>
            <button onClick={onPlayPause} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black">
                {isPlaying ? <Icons.Pause size={18} fill="currentColor" /> : <Icons.Play size={18} fill="currentColor" />}
            </button>
            <button onClick={onNext} className="text-gray-300"><Icons.SkipForward size={24} /></button>
        </div>
      </div>
    </>
  );
};
