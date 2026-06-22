'use client';

import { useEffect, useState, useCallback } from 'react';
import { THEME_BANNERS, getWeatherBanner } from '@/lib/theme-banners';
import { X } from 'lucide-react';

const DISMISS_KEY = 'min_theme_banner_dismissed';

export default function ThemeBanner() {
  const [theme, setTheme] = useState<string>('');
  const [weather, setWeather] = useState<string>('');
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isHolidayOrSeasonal = (t: string): boolean => {
    return !!THEME_BANNERS[t as keyof typeof THEME_BANNERS];
  };

  const getBannerId = () => {
    const t = theme;
    if (isHolidayOrSeasonal(t)) return `theme:${t}`;
    if (weather && getWeatherBanner(weather)) return `weather:${weather}`;
    return '';
  };

  const checkTheme = useCallback(() => {
    const htmlTheme = document.documentElement.getAttribute('data-theme') || '';
    const htmlWeather = document.documentElement.getAttribute('data-weather') || '';
    const htmlTemp = parseInt(document.documentElement.getAttribute('data-temp') || '27', 10);

    setTheme(htmlTheme);
    const condition = htmlWeather === 'sunny' && htmlTemp > 35 ? 'hot' : htmlWeather;
    setWeather(condition);

    const bannerId = getBannerId();
    if (bannerId) {
      const stored = localStorage.getItem(DISMISS_KEY);
      if (stored === bannerId) {
        setDismissed(true);
        document.body.style.paddingTop = '';
      } else {
        setDismissed(false);
        document.body.style.paddingTop = '52px';
        setTimeout(() => setVisible(true), 500);
      }
    } else {
      setDismissed(true);
      document.body.style.paddingTop = '';
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-weather', 'data-temp'],
    });

    return () => observer.disconnect();
  }, [checkTheme]);

  const handleDismiss = () => {
    setVisible(false);
    document.body.style.paddingTop = '';
    setTimeout(() => {
      setDismissed(true);
      localStorage.setItem(DISMISS_KEY, getBannerId());
    }, 300);
  };

  if (!mounted || dismissed) return null;

  // Determine which banner to show
  const bannerId = getBannerId();
  if (!bannerId) return null;

  const themeBanner = THEME_BANNERS[theme as keyof typeof THEME_BANNERS];
  const weatherBanner = getWeatherBanner(weather);

  const isWeatherBanner = bannerId.startsWith('weather:');
  const banner = isWeatherBanner ? weatherBanner : themeBanner;

  if (!banner) return null;

  const style = isWeatherBanner
    ? { backgroundColor: (banner as any).bg }
    : {};

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className={`text-white px-4 py-3 shadow-lg ${isWeatherBanner ? '' : 'theme-bg-accent'}`}
        style={style}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3 pr-8">
          <span className="text-xl shrink-0">{banner.icon}</span>
          <p className="text-sm font-medium leading-relaxed flex-1">
            {banner.message}
          </p>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Đóng banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
