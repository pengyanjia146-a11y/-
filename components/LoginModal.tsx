import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { NeteaseIcon, QrCodeIcon, SmartphoneIcon, CookieIcon } from './Icons';

interface LoginModalProps {
  onLogin: (user: UserProfile) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [method, setMethod] = useState<'qr' | 'phone' | 'cookie'>('qr');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanState, setScanState] = useState<'waiting' | 'scanned' | 'success'>('waiting');

  // Simulate QR Code polling
  useEffect(() => {
    if (method === 'qr') {
      const timer1 = setTimeout(() => {
        setScanState('scanned');
      }, 3000); // 3 seconds to scan

      const timer2 = setTimeout(() => {
        if(scanState !== 'success') {
             // Just show scanned state, wait for user confirmation or auto login logic
             // For demo, we auto login after scanned
             handleLoginSuccess();
        }
      }, 5000); 

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
        setScanState('waiting');
    }
  }, [method]);

  const handleLoginSuccess = () => {
     setLoading(true);
     setTimeout(() => {
      const mockUser: UserProfile = {
        id: '883921',
        nickname: '云村村民_99',
        avatarUrl: 'https://picsum.photos/200',
        isVip: true,
        platform: 'netease'
      };
      onLogin(mockUser);
      setLoading(false);
    }, 800);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-dark-light rounded-2xl w-full max-w-sm p-6 relative border border-white/10 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-netease rounded-full flex items-center justify-center mb-4 shadow-lg shadow-netease/30">
            <NeteaseIcon className="text-white w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold">网易云音乐登录</h2>
          <p className="text-sm text-gray-400 mt-1">同步你的歌单和红心收藏</p>
        </div>

        <div className="min-h-[220px]">
        {method === 'qr' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="bg-white p-2 rounded-lg mb-4 relative group cursor-pointer overflow-hidden">
               {scanState === 'waiting' && (
                 <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=simulate_netease_login_${Date.now()}`} 
                    alt="Scan Login" 
                    className="rounded"
                 />
               )}
               {scanState === 'scanned' && (
                  <div className="w-[150px] h-[150px] flex flex-col items-center justify-center bg-white">
                      <div className="text-netease font-bold text-lg">扫描成功</div>
                      <div className="text-gray-500 text-xs mt-2">请在手机上确认登录</div>
                  </div>
               )}
               {loading && (
                   <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                       <div className="w-6 h-6 border-2 border-netease border-t-transparent rounded-full animate-spin"></div>
                   </div>
               )}
            </div>
            <p className="text-xs text-gray-400">请使用网易云音乐APP扫码</p>
          </div>
        )}

        {method === 'phone' && (
          <form onSubmit={handleFormLogin} className="flex flex-col space-y-4 animate-fade-in pt-4">
            <div className="space-y-2">
              <input 
                type="tel" 
                placeholder="请输入手机号" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm focus:border-netease focus:outline-none transition-colors"
                required
              />
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="验证码" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm focus:border-netease focus:outline-none transition-colors"
                  required
                />
                <button type="button" className="whitespace-nowrap px-3 py-1 text-xs bg-white/10 rounded hover:bg-white/20">
                  获取验证码
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-netease hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center mt-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "登 录"}
            </button>
          </form>
        )}

        {method === 'cookie' && (
          <form onSubmit={handleFormLogin} className="flex flex-col space-y-4 animate-fade-in pt-2">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-[10px] text-yellow-200">
               提示：请粘贴浏览器 Cookie 中的 <code className="bg-black/30 px-1 rounded">MUSIC_U</code> 字段，或使用 Chrome 插件导出的 Token。
            </div>
            <textarea 
              placeholder="粘贴 Cookie / Token..." 
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-3 text-xs focus:border-netease focus:outline-none transition-colors resize-none font-mono"
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
        )}
        </div>

        <div className="mt-6 flex justify-center space-x-8 border-t border-white/5 pt-4">
            <button title="扫码模式" onClick={() => setMethod('qr')} className={`flex flex-col items-center gap-1 group ${method === 'qr' ? 'text-netease' : 'text-gray-500'}`}>
                <QrCodeIcon size={20} />
                <span className="text-[10px] group-hover:text-gray-300">扫码</span>
            </button>
            <button title="手机模式" onClick={() => setMethod('phone')} className={`flex flex-col items-center gap-1 group ${method === 'phone' ? 'text-netease' : 'text-gray-500'}`}>
                <SmartphoneIcon size={20} />
                <span className="text-[10px] group-hover:text-gray-300">手机</span>
            </button>
            <button title="Cookie/插件模式" onClick={() => setMethod('cookie')} className={`flex flex-col items-center gap-1 group ${method === 'cookie' ? 'text-netease' : 'text-gray-500'}`}>
                <CookieIcon size={20} />
                <span className="text-[10px] group-hover:text-gray-300">Cookie</span>
            </button>
        </div>
      </div>
    </div>
  );
};