import React from 'react';
// 1. 引入 Lucide 基础图标
import { 
  Play, Pause, SkipBack, SkipForward, Search, Home, Library, User, 
  X, Loader2, Shuffle, Repeat, Repeat1, Cookie, Activity, LogOut, Cloud,
  Settings, Download, Heart, MoreVertical, List, Video, Folder, Plus, Check
} from 'lucide-react';

// 2. 定义原生 SVG 图标 (网易云、B站、YouTube)
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

export const LabIcon = ({ size = 24, className, fill = "none" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"></path><path d="M14 2v7.31"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path></svg>
);

export const PluginFileIcon = ({ size = 24, className, fill = "none" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
);

export const PlaylistAddIcon = ({ size = 24, className, fill = "none" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H4"></path><path d="M4 8h12"></path><path d="M4 14h8"></path><line x1="18" y1="14" x2="22" y2="14"></line><line x1="20" y1="12" x2="20" y2="16"></line></svg>
);

export const NextPlanIcon = ({ size = 24, className, fill = "none" }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);

// 3. 统一导出 (修复 "not exported" 错误)
export const Icons = {
  // Lucide
  Play, Pause, SkipBack, SkipForward, Search, Home, Library, User, 
  X, Loader: Loader2, Shuffle, Repeat, Repeat1, Settings, Download, 
  Heart, MoreVertical, List, Video, Folder, Plus, Check,
  
  // 别名 (修复 LoginModal/Toast 引用)
  CloseIcon: X,
  CookieIcon: Cookie,
  ActivityIcon: Activity,
  LogoutIcon: LogOut,
  UserPlusIcon: Plus,
  UserCheckIcon: Check,
  TrashIcon: X, // 暂用 X 代替 Trash，或导入 Trash
  
  // 自定义 SVG
  NeteaseIcon,
  YouTubeIcon,
  BilibiliIcon,
  LabIcon,
  PluginFileIcon,
  PlaylistAddIcon,
  NextPlanIcon,
  
  Cloud
};
