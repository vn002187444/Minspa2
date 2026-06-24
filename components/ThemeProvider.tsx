'use client';

import { useEffect, useState, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { detectTheme, getParticleType, getThemeColor, type ThemeName, type ParticleType } from '@/lib/themes';
import { getWeather, getThemeModifier } from '@/lib/weather';
import dynamic from 'next/dynamic';

const ThemeParticles = dynamic(() => import('@/components/ThemeParticles'), { ssr: false });

interface ThemeConfig {
  override: ThemeName | null;
  particlesEnabled: boolean;
}

const CONFIG_KEY = 'min_theme_config';

function loadConfig(): ThemeConfig {
  if (typeof window === 'undefined') return { override: null, particlesEnabled: true };
  try {
    const raw = storage.get(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { override: null, particlesEnabled: true };
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [particleType, setParticleType] = useState<ParticleType>('none');
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback(async () => {
    const config = loadConfig();
    setParticlesEnabled(config.particlesEnabled);

    let activeTheme: ThemeName;
    if (config.override) {
      activeTheme = config.override;
    } else {
      const seasonal = detectTheme();
      activeTheme = seasonal.name;
    }

    // Fetch server-side config once
    try {
      const res = await fetch('/api/theme-settings');
      if (res.ok) {
        const serverConfig = await res.json();
        if (serverConfig.override) {
          activeTheme = serverConfig.override;
          const newConfig = loadConfig();
          newConfig.override = serverConfig.override;
          storage.set(CONFIG_KEY, JSON.stringify(newConfig));
        }
        if (serverConfig.particlesEnabled !== undefined) {
          setParticlesEnabled(serverConfig.particlesEnabled);
        }
      }
    } catch {}

    setThemeName(activeTheme);
    document.documentElement.setAttribute('data-theme', activeTheme);

    // Fetch weather and set data-weather for banner
    getWeather().then((weather) => {
      if (weather) {
        document.documentElement.setAttribute('data-weather', weather.condition);
        document.documentElement.setAttribute('data-temp', String(weather.temp));
      }
    });

    // theme-color meta tag (8.6)
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', getThemeColor(activeTheme));

    // Particle type
    setParticleType(getParticleType(activeTheme));
  }, []);

  useEffect(() => {
    setMounted(true);
    applyTheme();

    // Refresh theme + weather every 30 min
    const interval = setInterval(applyTheme, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [applyTheme]);

  return (
    <>
      {mounted && particlesEnabled && <ThemeParticles type={particleType} />}
      {children}
    </>
  );
}
