'use client'

import { useState, useEffect, useRef } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    setIsIos(isApple);

    const handleBeforeInstallEvent = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      timerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallEvent);

    if (isApple) {
      timerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallEvent);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA Install] User choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      id="custom-pwa-install-banner" 
      className="fixed bottom-24 left-4 right-4 md:left-4 md:right-auto md:max-w-sm bg-gradient-to-r from-[#FFFDF9] to-[#FAF5EE] text-[#3A2E2B] border-2 border-[#EADAC5] p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="w-9 h-9 rounded-full bg-[#E6A055] flex items-center justify-center shrink-0 shadow-inner">
        <Smartphone className="w-4.5 h-4.5 text-white" />
      </div>

      <div className="flex-1 space-y-1">
        <h5 className="font-display font-bold text-xs text-[#5C4033] uppercase lg:tracking-wider">
          📱 Ứng dụng Min Salon
        </h5>
        <p className="text-[11px] text-[#54483E] leading-snug">
          Cài đặt Ứng dụng Min Salon để nhận thông báo ưu đãi và lịch hẹn của bạn tức thì.
        </p>

        {isIos ? (
          <div className="mt-2 p-2 bg-[#F5EBE1] rounded-xl text-[10px] text-gray-700 leading-normal border border-[#E7D6C1]/40">
            <p className="font-bold text-[#8D6E53] flex items-center gap-1">
              <Share className="w-3 h-3 text-pink-600 inline" /> Hướng dẫn cài đặt trên iPhone:
            </p>
            Nhấp chọn <strong className="text-pink-600">Chia sẻ</strong> dưới trình duyệt Safari, sau đó cuộn xuống chọn <strong className="text-pink-600">&quot;Thêm vào MH chính&quot;</strong>.
          </div>
        ) : (
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={handleInstallClick}
              className="px-2.5 py-1.5 bg-[#8D6E53] hover:bg-[#765B43] text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer hover:shadow-md"
            >
              <Download className="w-3 h-3" /> Cài đặt ngay
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-2 py-1.5 text-gray-500 hover:text-gray-800 bg-white border border-[#E3D3BE] rounded-lg text-[10px] font-semibold cursor-pointer transition-colors"
            >
              Để sau
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="text-[#A08A75] hover:text-[#5C4033] p-0.5 rounded-full hover:bg-gray-200/50 transition-colors shrink-0 cursor-pointer"
        aria-label="Đóng bảng cài đặt"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
