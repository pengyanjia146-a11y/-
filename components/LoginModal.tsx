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
          // 智能识别：交给 Service 处理格式，支持整段粘贴
          const res = await musicService.getUserStatus(cleanVal);
          
          if (res.profile) {
              const user: UserProfile = {
                  id: String(res.profile.userId),
                  nickname: res.profile.nickname,
                  avatarUrl: res.profile.avatarUrl,
                  isVip: res.profile.vipType > 0,
                  platform: 'netease',
                  cookie: cleanVal 
              };
              onLogin(user);
          } else {
              alert("登录失败：Cookie 无效或已过期。\n请尝试重新复制 Network 面板里的完整 Cookie 值。");
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
          <p className="text-xs text-gray-400 mt-2">Serverless 模式 • 纯本地代理</p>
        </div>

        <form onSubmit={handleCookieLogin} className="flex flex-col space-y-4 animate-fade-in">
             <div className="bg-white/5 p-3 rounded-lg text-xs text-gray-400 leading-relaxed border border-white/5">
                <p className="font-bold text-gray-300 mb-1">如何获取 Cookie:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                    {/* 修复：使用特殊字符 → 代替 -> 以修复构建报错 */}
                    <li>PC 浏览器按 F12 → Network (网络)</li>
                    <li>刷新网页 → 点击任意请求 (如 list?...)</li>
                    <li>找到 <span className="text-netease font-bold">Request Headers</span> 下的 Cookie</li>
                    <li><span className="text-white bg-white/10 px-1 rounded">直接复制整段内容</span> (包含 MUSIC_U 等)</li>
                </ol>
             </div>
            <textarea 
              placeholder="在这里粘贴 Cookie..." 
              value={cookieVal}
              onChange={(e) => setCookieVal(e.target.value)}
              className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-3 text-xs focus:border-netease focus:outline-none transition-colors font-mono resize-none"
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
                 <span>数据仅存储在本地，不经过任何服务器</span>
             </div>
        </div>
      </div>
    </div>
  );
};
