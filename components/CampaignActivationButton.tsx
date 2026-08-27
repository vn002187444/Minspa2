'use client';
import { useState, useEffect } from 'react';
import { Megaphone, Rocket, X } from 'lucide-react';

const KEY = 'min_campaign_active';
const THEMES_KEY = 'min_theme_config';

export default function CampaignActivationButton({ variant = 'admin' }: { variant?: 'admin' | 'floating' }) {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActive(localStorage.getItem(KEY) === '1');
  }, []);

  const toggle = () => {
    const next = !active;
    setActive(next);
    if (next) {
      localStorage.setItem(KEY, '1');
      // optional: force campaign theme e.g. tet — user can change later
      // keep existing theme, just enable banner flag
      document.documentElement.setAttribute('data-campaign', 'active');
    } else {
      localStorage.removeItem(KEY);
      document.documentElement.removeAttribute('data-campaign');
    }
    // notify ThemeProvider/banner listeners
    window.dispatchEvent(new CustomEvent('min:campaign', { detail: next }));
  };

  if (!mounted) return null;

  if (variant === 'floating') {
    return (
      <button
        onClick={toggle}
        aria-label={active ? 'Tắt chiến dịch' : 'Kích hoạt chiến dịch'}
        className={`fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-xl text-sm font-bold transition-all ${active ? 'bg-[#3A2E2B] text-white' : 'bg-white border border-[#EADDCD] text-[#3A2E2B] hover:bg-[#FAF6F0]'}`}
      >
        {active ? <X className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
        {active ? 'Tắt chiến dịch' : 'Kích hoạt chiến dịch'}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[#EADDCD] bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-[#3A2E2B] text-white' : 'bg-[#FAF6F0] text-[#8D6E53]'}`}>
          {active ? <Rocket className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
        </div>
        <div>
          <div className="font-bold text-[#3A2E2B]">Chiến dịch marketing</div>
          <div className="text-xs text-[#6B7280]">{active ? 'Đang bật — banner & theme chiến dịch hoạt động' : 'Đang tắt — bật khi cần chạy 5/6/7'}</div>
        </div>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-bold ${active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border'}`}>{active ? 'ON' : 'OFF'}</span>
      </div>
      <p className="text-xs leading-relaxed text-[#6B7280]">
        Nút này bật cờ <code className="px-1 py-0.5 bg-[#FAF6F0] rounded text-[#3A2E2B]">localStorage: min_campaign_active</code> + <code>data-campaign</code>.
        Khi ON, <code>ThemeBanner</code> và các banner/IG/slides (mục 5-7) sẽ được render. Tắt để về trạng thái thường.
      </p>
      <button
        onClick={toggle}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${active ? 'bg-white border border-[#EADDCD] text-[#3A2E2B] hover:bg-[#FAF6F0]' : 'bg-[#3A2E2B] text-white hover:bg-[#5C4033]'}`}
      >
        {active ? 'Tắt chiến dịch' : 'Kích hoạt chiến dịch'}
      </button>
      <div className="text-[11px] text-[#8D6E53]">Gợi ý: bật trước khi generate Banners/Social/Slides — các template sẽ đọc cờ này để đổi copy & màu theo mùa.</div>
    </div>
  );
}
