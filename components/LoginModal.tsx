import React, { useState } from 'react';
import { UserProfile } from '../types';
import { NeteaseIcon, CookieIcon, CloseIcon } from './Icons';
import { musicService } from '../services/geminiService';

interface LoginModalProps {
  onLogin: (user: UserProfile) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [cookieVal, setCookieVal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCookieLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      const cleanVal = cookieVal.trim();
      if (!cleanVal) return;
      
      setLoading(true);
      try {
          // 只传 MUSIC_U 的值去验证
          const res = await musicService.getUserStatus(cleanVal);
          
          if (res.profile) {
              const user: UserProfile = {
                  id: String(res.profile.userId),
                  nickname: res.profile.nickname,
                  avatarUrl: res.profile.avatarUrl,
                  isVip: res.profile.vipType > 0,
                  platform: 'netease',
                  cookie: cleanVal // 只保存 MUSIC_U 的值
              };
              onLogin(user);
          } else {
              alert("登录失败：MUSIC_U 无效或已过期。\n请确保只复制了 MUSIC_U 的值，不要包含分号或其他内容。");
          }
      } catch (e) {
          alert("登录请求失败，请检查网络");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-dark-light rounded-2xl w-full max-w-sm p-6 relative border border-white/10 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><CloseIcon size={24} /></button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-netease rounded-full flex items-center justify-center mb-4 shadow-lg shadow-netease/30">
            <NeteaseIcon className="text-white w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold">网易云音乐登录</h2>
          <p className="text-xs text-gray-400 mt-2">Serverless 模式 • 仅需核心密钥</p>
        </div>

        <form onSubmit={handleCookieLogin} className="flex flex-col space-y-4 animate-fade-in">
             <div className="bg-white/5 p-3 rounded-lg text-xs text-gray-400 leading-relaxed border border-white/5">
                <p className="font-bold text-gray-300 mb-1">仅需 MUSIC_U:</p>
                <p>为了解决卡顿问题，现在只需填入核心密钥。</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>PC 浏览器 F12 -> Application -> Cookies</li>
                    <li>找到 <span className="text-netease font-bold">MUSIC_U</span></li>
                    <li>仅复制它的 <span className="text-white bg-white/10 px-1 rounded">Value (值)</span></li>
                    <li>值通常以 <code className="text-yellow-500">abcd...</code> 开头，不包含 <code className="text-yellow-500">MUSIC_U=</code> 前缀</li>
                </ol>
             </div>
            <input 
              type="text"
              placeholder="粘贴 MUSIC_U 的值 (例如: 0055799...)" 
              value={cookieVal}
              onChange={(e) => setCookieVal(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm focus:border-netease focus:outline-none transition-colors font-mono"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-netease hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "验 证 并 登 录"}
            </button>
        </form>

        <div className="mt-6 flex justify-center border-t border-white/5 pt-4">
             <div className="text-[10px] text-gray-500 flex items-center gap-1">
                 <CookieIcon size={12} />
                 <span>数据仅存储在本地，安全无忧</span>
             </div>
        </div>
      </div>
    </div>
  );
};