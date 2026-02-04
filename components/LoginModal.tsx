import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { NeteaseIcon, QrCodeIcon, SmartphoneIcon, CookieIcon } from './Icons';
import { musicService } from '../services/geminiService';

interface LoginModalProps {
  onLogin: (user: UserProfile) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [method, setMethod] = useState<'qr' | 'phone' | 'cookie'>('qr');
  const [qrImg, setQrImg] = useState('');
  const [qrKey, setQrKey] = useState('');
  const [scanState, setScanState] = useState<'waiting' | 'scanned' | 'success' | 'expired'>('waiting');
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<any>(null);

  // Initialize QR Code
  const initQR = async () => {
      try {
          const keyRes = await musicService.getLoginKey();
          if (keyRes.code === 200) {
              setQrKey(keyRes.data.unikey);
              const createRes = await musicService.createLoginQR(keyRes.data.unikey);
              if (createRes.code === 200) {
                  setQrImg(createRes.data.qrimg);
                  setScanState('waiting');
                  startCheckInterval(keyRes.data.unikey);
              }
          }
      } catch (e) {
          console.error("QR Init Failed", e);
      }
  };

  const startCheckInterval = (key: string) => {
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(async () => {
          try {
              const res = await musicService.checkLoginQR(key);
              // 800: expired, 801: waiting, 802: scanned/confirming, 803: success
              if (res.code === 800) {
                  setScanState('expired');
                  clearInterval(timerRef.current);
              } else if (res.code === 802) {
                  setScanState('scanned');
              } else if (res.code === 803) {
                  setScanState('success');
                  clearInterval(timerRef.current);
                  // Login Success!
                  const cookie = res.cookie;
                  await fetchUserProfile(cookie);
              }
          } catch (e) {
              console.error("QR Check Error", e);
          }
      }, 3000);
  };

  const fetchUserProfile = async (cookie: string) => {
      setLoading(true);
      try {
          const res = await musicService.getUserStatus(cookie);
          if (res.profile) {
              const user: UserProfile = {
                  id: String(res.profile.userId),
                  nickname: res.profile.nickname,
                  avatarUrl: res.profile.avatarUrl,
                  isVip: res.profile.vipType > 0,
                  platform: 'netease',
                  cookie: cookie // Save cookie for future requests
              };
              onLogin(user);
          }
      } catch (e) {
          alert("获取用户信息失败");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (method === 'qr') {
      initQR();
    } else {
      if(timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
        if(timerRef.current) clearInterval(timerRef.current);
    };
  }, [method]);

  const handleCookieLogin = (e: React.FormEvent) => {
      e.preventDefault();
      fetchUserProfile(cookie);
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
               {scanState === 'waiting' && qrImg && (
                 <img src={qrImg} alt="Scan Login" className="rounded w-[150px] h-[150px]" />
               )}
               {scanState === 'expired' && (
                   <div className="w-[150px] h-[150px] flex flex-col items-center justify-center bg-white text-black cursor-pointer" onClick={initQR}>
                       <p className="font-bold">二维码已过期</p>
                       <p className="text-xs text-gray-500">点击刷新</p>
                   </div>
               )}
               {scanState === 'scanned' && (
                  <div className="w-[150px] h-[150px] flex flex-col items-center justify-center bg-white">
                      <div className="text-netease font-bold text-lg">扫描成功</div>
                      <div className="text-gray-500 text-xs mt-2">请在手机上确认登录</div>
                  </div>
               )}
               {scanState === 'success' || loading ? (
                   <div className="absolute inset-0 bg-white/90 flex items-center justify-center w-[150px] h-[150px] z-10">
                       <div className="w-6 h-6 border-2 border-netease border-t-transparent rounded-full animate-spin"></div>
                   </div>
               ) : null}
            </div>
            <p className="text-xs text-gray-400">请使用网易云音乐APP扫码</p>
          </div>
        )}

        {method === 'phone' && (
          <div className="text-center pt-8 text-gray-400 text-sm">
              暂未开放，请使用扫码登录
          </div>
        )}

        {method === 'cookie' && (
          <form onSubmit={handleCookieLogin} className="flex flex-col space-y-4 animate-fade-in pt-2">
            <textarea 
              placeholder="粘贴 MUSIC_U Cookie..." 
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
            <button title="Cookie模式" onClick={() => setMethod('cookie')} className={`flex flex-col items-center gap-1 group ${method === 'cookie' ? 'text-netease' : 'text-gray-500'}`}>
                <CookieIcon size={20} />
                <span className="text-[10px] group-hover:text-gray-300">Cookie</span>
            </button>
        </div>
      </div>
    </div>
  );
};