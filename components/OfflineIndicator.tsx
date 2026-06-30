'use client';

import { useState, useEffect } from 'react';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { CloudOff, RefreshCw } from 'lucide-react';

export default function OfflineIndicator() {
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { pendingCount, isSyncing, sync } = useOnlineSync();

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!mounted) return null;
  if (!isOffline && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
      isOffline ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
    }`}>
      {isOffline ? (
        <><CloudOff className="w-4 h-4" /> Đang offline</>
      ) : (
        <><RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Đang đồng bộ ({pendingCount})
          <button onClick={sync} className="ml-1 underline">Đồng bộ ngay</button>
        </>
      )}
    </div>
  );
}
