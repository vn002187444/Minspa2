'use client';

import { useEffect, useState } from 'react';
import { detectTheme, type ThemeName } from '@/lib/themes';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('default');

  useEffect(() => {
    const applyTheme = () => {
      const { name } = detectTheme();
      setTheme(name);
      document.documentElement.setAttribute('data-theme', name);
    };

    applyTheme();

    const interval = setInterval(applyTheme, 3_600_000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
