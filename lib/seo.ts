import { useEffect } from 'react';

export function useNoindex() {
  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    if (existing) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}
