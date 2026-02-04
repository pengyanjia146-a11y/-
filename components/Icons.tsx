import React from 'react';
// 引入 Lucide 图标
import { 
  Play, Pause, SkipBack, SkipForward, Search, Home, Library, User, 
  X, Loader2, Shuffle, Repeat, Repeat1, Cookie, Activity, LogOut, Cloud 
} from 'lucide-react';

// --- 原生 SVG 图标 (保留) ---

interface IconProps { size?: number; className?: string; fill?: string; }

export const NeteaseIcon = ({ size = 24, className, fill = "currentColor" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill={fill}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
  </svg>
);

export const YouTubeIcon = ({ size = 24, className, fill = "currentColor" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill={fill}>
    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
  </svg>
);

export const BilibiliIcon = ({ size = 24, className, fill = "currentColor" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill={fill}>
    <path d="M18.7 5.3h-2.6l1-2.6c.1-.3-.2-.6-.5-.5-.1 0-.2.1-.2.2l-1.3 3.3h-6L7.9 2.4c0-.3-.4-.4-.5-.2-.1.1-.1.2-.1.2l1 2.9H5.3C2.4 5.3 0 7.7 0 10.6v8c0 2.9 2.4 5.3 5.3 5.3h13.3c2.9 0 5.3-2.4 5.3-5.3v-8c.1-2.9-2.3-5.3-5.2-5.3zm-10 11.4c-1.1 0-1.9-.9-1.9-1.9s.9-1.9 1.9-1.9 1.9.9 1.9 1.9-.9 1.9-1.9 1.9zm10.7 0c-1.1 0-1.9-.9-1.9-1.9s.9-1.9 1.9-1.9 1.9.9 1.9 1.9-.9 1.9-1.9 1.9z"/>
  </svg>
);

// --- 统一导出对象 ---
export const Icons = {
  Play, Pause, SkipBack, SkipForward, Search, Home, Library, User, 
  X, Loader: Loader2, Shuffle, Repeat, Repeat1,
  
  // 🟢 修复报错的关键导出
  CloseIcon: X,
  CookieIcon: Cookie,
  ActivityIcon: Activity,
  LogoutIcon: LogOut,
  NeteaseIcon,
  YouTubeIcon,
  BilibiliIcon,
  
  Cloud // 备用
};
