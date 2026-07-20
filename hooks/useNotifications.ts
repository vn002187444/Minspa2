'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { logger } from "@/lib/logger";
import type { Notification } from '@/types';

interface UseNotificationsReturn {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
  open: boolean;
  setOpen: (_v: boolean) => void;
  markAsRead: (_id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(userId?: string): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const userIdRef = useRef(userId);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch (e) {
      logger.error('[Notifications] Failed to query unread count', e instanceof Error ? e : undefined);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch (e) {
      logger.error('[Notifications] Failed to query notifications', e instanceof Error ? e : undefined);
    }
    setLoading(false);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      logger.error('[Notifications] Failed to mark notification as read', e instanceof Error ? e : undefined);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      logger.error('[Notifications] Failed to mark all notifications as read', e instanceof Error ? e : undefined);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      userIdRef.current = userId;
      await fetchUnreadCount();
    };
    init();

    const supabase = createClient();
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => { fetchUnreadCount(); if (open) fetchNotifications(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId ?? ''}` },
        () => { fetchUnreadCount(); if (open) fetchNotifications(); }
      );

    (async () => {
      try {
        const { safeSubscribe } = await import('@/lib/realtime');
        await safeSubscribe(channel);
      } catch (e) {
        console.warn('[Realtime] useNotifications subscription failed:', e);
      }
    })();

    const pollingInterval = setInterval(fetchUnreadCount, 300000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [userId, open, fetchUnreadCount, fetchNotifications]);

  useEffect(() => {
    const init = async () => {
      if (open) await fetchNotifications();
    };
    init();
  }, [open, fetchNotifications]);

  return { unreadCount, notifications, loading, open, setOpen, markAsRead, markAllRead };
}
