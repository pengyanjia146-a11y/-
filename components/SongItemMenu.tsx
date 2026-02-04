// 文件路径: components/SongItemMenu.tsx
import React from 'react';
import { NextPlanIcon, HeartIcon, DownloadIcon, UserCheckIcon } from './Icons';

interface SongItemMenuProps {
    song: any;
    isLiked: boolean;
    onToggleLike: () => void;
    onDownload: () => void;
    onPlayNext: () => void;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    onArtistClick: (id: string) => void;
}

export const SongItemMenu: React.FC<SongItemMenuProps> = ({ 
    song, 
    isLiked, 
    onToggleLike, 
    onDownload, 
    onPlayNext, 
    isOpen, 
    setOpen, 
    onArtistClick 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-end md:items-center animate-fade-in">
            {/* 遮罩层：点击空白处关闭 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}></div>
            
            {/* 菜单内容 - 手机端底部弹出，电脑端居中显示 */}
            <div className="bg-dark-light w-full md:w-80 rounded-t-2xl md:rounded-2xl border border-white/10 shadow-2xl z-10 p-4 pb-safe animate-slide-up transform transition-transform">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                    <img src={song.coverUrl} className="w-12 h-12 rounded-lg bg-gray-800 object-cover" />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate text-sm">{song.title}</h4>
                        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                    </div>
                </div>

                <div className="space-y-1">
                    <button onClick={() => { onPlayNext(); setOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 rounded-lg flex items-center gap-3 text-white transition-colors">
                        <NextPlanIcon size={18} /> 下一首播放
                    </button>
                    <button onClick={() => { onToggleLike(); setOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 rounded-lg flex items-center gap-3 text-white transition-colors">
                        <HeartIcon size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-netease" : ""} /> {isLiked ? "取消收藏" : "收藏"}
                    </button>
                    <button onClick={() => { onDownload(); setOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 rounded-lg flex items-center gap-3 text-white transition-colors">
                        <DownloadIcon size={18} /> 下载 (跳转浏览器)
                    </button>
                    {song.artistId && (
                        <button onClick={() => { onArtistClick(song.artistId); setOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 rounded-lg flex items-center gap-3 text-white transition-colors">
                            <UserCheckIcon size={18} /> 查看歌手
                        </button>
                    )}
                </div>
                
                {/* 手机端底部取消按钮 */}
                <button onClick={() => setOpen(false)} className="w-full mt-4 py-3 text-center text-gray-500 hover:text-white border-t border-white/5 md:hidden">
                    关闭
                </button>
            </div>
        </div>
    );
};
