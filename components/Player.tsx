import React from 'react';
import { Icons } from './Icons';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  // 新增：播放模式控制
  playMode: 'sequence' | 'random' | 'single';
  onToggleMode: () => void;
  className?: string; // 允许外部控制位置
}

export function Player({ 
  currentSong, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrev,
  playMode,
  onToggleMode,
  className
}: PlayerProps) {
  
  // 渲染模式图标
  const ModeIcon = () => {
    switch (playMode) {
      case 'random': return <Icons.Shuffle className="w-5 h-5 text-purple-500" />;
      case 'single': return <Icons.Repeat1 className="w-5 h-5 text-purple-500" />;
      default: return <Icons.Repeat className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={`fixed left-0 right-0 bg-gray-900 border-t border-gray-800 p-2 flex items-center justify-between z-50 ${className}`}>
      
      {/* 歌曲信息 */}
      <div className="flex items-center flex-1 min-w-0">
        <img 
          src={currentSong.cover} 
          alt={currentSong.title} 
          className="w-10 h-10 rounded bg-gray-800 object-cover"
        />
        <div className="ml-3 overflow-hidden">
          <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
          <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
        </div>
      </div>

      {/* 控制区域 */}
      <div className="flex items-center gap-3 px-2">
        {/* 模式切换 */}
        <button onClick={onToggleMode} className="p-2 active:scale-95 transition">
          <ModeIcon />
        </button>

        {/* 上一首 */}
        <button onClick={onPrev} className="p-2 text-white hover:text-purple-400 transition">
          <Icons.SkipBack className="w-6 h-6" />
        </button>
        
        {/* 播放/暂停 */}
        <button 
          onClick={onPlayPause} 
          className="p-3 bg-purple-600 rounded-full text-white hover:bg-purple-700 transition active:scale-95 shadow-lg shadow-purple-900/50"
        >
          {isPlaying ? <Icons.Pause className="w-6 h-6" /> : <Icons.Play className="w-6 h-6" />}
        </button>
        
        {/* 下一首 */}
        <button onClick={onNext} className="p-2 text-white hover:text-purple-400 transition">
          <Icons.SkipForward className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
