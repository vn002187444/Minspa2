'use client';

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';


interface Notification {
  id: string;
  recipient_id: string;
  recipient_type: string;
  title: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.status === 401) {
        startTransition(() => { setAuthenticated(false); });
        return;
      }
      startTransition(() => { setAuthenticated(true); });
      if (!res.ok) return;
      const data = await res.json();
      startTransition(() => { setUnreadCount(data.count ?? 0); });
    } catch {
      startTransition(() => { setAuthenticated(false); });
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    startTransition(() => { setLoading(true); });
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      startTransition(() => {
        setNotifications(data.data ?? []);
        setUnreadCount((data.data ?? []).filter((n: Notification) => !n.is_read).length);
      });
    } catch {
      // silent
    }
    startTransition(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    fetchUnreadCount().then(() => {
      // Get current user ID for Realtime subscription
      fetch('/api/auth/me').then(async (res) => {
        if (res.status === 401) {
          startTransition(() => { setAuthenticated(false); });
          return;
        }
        if (res.ok) {
          const me = await res.json();
          if (me.authenticated && me.user) {
            userIdRef.current = me.user.id;
            startTransition(() => { setAuthenticated(true); });
          }
        }
      }).catch(() => {});
    });

    // Polling fallback — 5 minutes (Realtime handles instant updates)
    const interval = setInterval(fetchUnreadCount, 300000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    import('@supabase/supabase-js').then(async ({ createClient }) => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
 
       const channel: any = supabase
          .channel('notifications_bell')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_type=eq.user`,
            },
            (payload: unknown) => {
              const newNotif = (payload as { new: Notification }).new;
              if (newNotif.recipient_id !== userIdRef.current) return;
              setUnreadCount((prev) => prev + 1);
              setNotifications((prev) => [newNotif, ...prev].slice(0, 100));
              
              // Trigger bounce animation
              setIsBouncing(true);
              setTimeout(() => setIsBouncing(false), 1000);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_type=eq.user`,
            },
            (payload: unknown) => {
              const updated = (payload as { new: Notification }).new;
              if (updated.recipient_id !== userIdRef.current) return;
              setNotifications((prev) =>
                prev.map((n) => (n.id === updated.id ? { ...n, is_read: updated.is_read } : n))
              );
              setUnreadCount((prev) => Math.max(0, prev - (updated.is_read ? 1 : 0)));
            }
          );
 
          try {
            const { safeSubscribe } = await import('@/lib/realtime');
            await safeSubscribe(channel);
          } catch (e) {
            console.warn('[Realtime] NotificationBell subscription failed:', e);
          }


      return () => {
        supabase.removeChannel(channel);
      };
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        await fetchNotifications();
      };
      init();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch {
      fetchNotifications();
    }
  };

  const handleItemClick = (n: Notification) => {
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    if (n.link) {
      window.location.assign(n.link);
    }
  };

  if (authenticated === false) return null;

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
         {unreadCount > 0 && (
           <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold text-white bg-red-500 rounded-full shadow-sm ${isBouncing ? 'animate-bounce' : ''}`}>
             {unreadCount > 99 ? '99+' : unreadCount}
           </span>
         )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[100] mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden  animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-[#8D6E53] hover:text-[#5C4033] transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8D6E53]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-sm">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                    !n.is_read ? 'bg-amber-50/60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#8D6E53] mt-1.5 shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${!n.is_read ? 'pl-0' : 'pl-4'}`}>
                      <p
                        className={`text-sm leading-snug ${
                          !n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            className="block text-center text-xs font-semibold text-[#8D6E53] hover:text-[#5C4033] py-3 border-t border-gray-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Xem tất cả thông báo →
          </Link>
        </div>
      )}
    </div>
  );
}
