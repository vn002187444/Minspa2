'use client';

import { useEffect, useCallback, useState } from 'react';
import { getPendingItems, markDone, markFailed, getQueueCount } from '@/lib/offline-queue';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSync: Date | null;
}

export function useOnlineSync() {
  const [state, setState] = useState<SyncState>({ isSyncing: false, pendingCount: 0, lastSync: null });

  const refreshCount = useCallback(async () => {
    const count = await getQueueCount();
    setState(prev => ({ ...prev, pendingCount: count }));
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      const items = await getPendingItems();
      for (const item of items) {
        try {
          if (item.type === 'booking') {
            const { submitBooking } = await import('@/app/booking/actions/booking');
            const res = await submitBooking(item.payload);
            if (res.success) {
              await markDone(item.id!);
            } else {
              await markFailed(item.id!, res.error || 'Unknown error');
            }
          } else {
            await markFailed(item.id!, 'Unknown queue type: ' + item.type);
          }
        } catch (err: any) {
          await markFailed(item.id!, err.message);
        }
      }
      setState(prev => ({ ...prev, lastSync: new Date() }));
      await refreshCount();
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => sync();
    window.addEventListener('online', handleOnline);

    const interval = setInterval(() => {
      if (navigator.onLine) sync();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [sync, refreshCount]);

  return { ...state, sync, refreshCount };
}
