'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, ArrowLeft, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import BottomNavigation from '@/components/BottomNavigation';

interface Notification {
  id: string;
  title: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchData = useCallback(async (pageNum: number, filterType: 'all' | 'unread') => {
    startTransition(() => { setLoading(true); });
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      let items = data.data ?? [];
      if (filterType === 'unread') {
        items = items.filter((n: Notification) => !n.is_read);
      }
      startTransition(() => {
        setNotifications(items);
        setTotal(data.total ?? 0);
      });
    } catch {
      // silent
    }
    startTransition(() => { setLoading(false); });
  }, [router]);

  useEffect(() => {
    fetchData(page, filter);
  }, [page, filter, fetchData]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-lg text-gray-900 flex-1">Thông báo</h1>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8D6E53] hover:text-[#5C4033] transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Đọc tất cả
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2">
          <button
            onClick={() => { setFilter('all'); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-[#8D6E53] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setFilter('unread'); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === 'unread'
                ? 'bg-[#8D6E53] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Chưa đọc
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#8D6E53]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Bell className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">Không có thông báo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) handleMarkAsRead(n.id);
                  if (n.link) router.push(n.link);
                }}
                className={`rounded-xl p-4 transition-colors cursor-pointer border ${
                  !n.is_read
                    ? 'bg-amber-50/70 border-amber-200/50'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!n.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8D6E53] mt-1.5 shrink-0" />
                  )}
                  <div className={`flex-1 min-w-0 ${!n.is_read ? '' : 'pl-5'}`}>
                    <h3
                      className={`text-sm ${
                        !n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                      }`}
                    >
                      {n.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.content}</p>
                    <p className="text-[11px] text-gray-300 mt-2">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        )}
      </main>

      <Link
        href="/"
        className="text-center text-xs text-gray-400 hover:text-gray-600 py-4 transition-colors"
      >
        ← Trang chủ
      </Link>

      <BottomNavigation />
    </div>
  );
}
