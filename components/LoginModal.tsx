import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Icons } from './Icons';
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
      const rawInput = cookieVal.trim();
      if (!rawInput) return;
      setLoading(true);
      try {
          const res = await musicService.getUserStatus(rawInput);
          if (res.profile) {
              const user: UserProfile = {
                  id: String(res.profile.userId),
                  nickname: res.profile.nickname,
                  avatarUrl: res.profile.avatarUrl,
                  isVip: res.profile.vipType > 0,
                  platform: 'netease',
                  cookie: res._cleanedCookie || rawInput 
              };
              onLogin(user);
          } else {
              alert("登录失败");
          }
      } catch (e) { alert("网络错误"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm p-6 relative border border-white/10 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <Icons.CloseIcon size={24} />
        </button>
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <Icons.NeteaseIcon className="text-white w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold">网易云登录</h2>
        </div>
        <form onSubmit={handleCookieLogin} className="flex flex-col space-y-4">
            <textarea placeholder="粘贴 Cookie..." value={cookieVal} onChange={(e) => setCookieVal(e.target.value)} className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white" required />
            <button type="submit" disabled={loading} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg">
              {loading ? "登录中..." : "登录"}
            </button>
        </form>
      </div>
    </div>
  );
};
