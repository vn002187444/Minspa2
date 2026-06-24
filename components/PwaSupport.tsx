'use client'

import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { storage } from '@/lib/storage';
import InstallPWA from './InstallPWA';
import OfflineIndicator from './OfflineIndicator';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PwaSupport() {
  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showNotificationWidget, setShowNotificationWidget] = useState(false);
  const [notificationStatusMsg, setNotificationStatusMsg] = useState('');

  useEffect(() => {
    // 1. Check current Notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      // Only show registration helper widget if not already granted
      if (Notification.permission !== 'granted') {
        setShowNotificationWidget(true);
      }
    }

    // 2. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
          // If already granted, sync subscription token automatically on mount
          if (Notification.permission === 'granted') {
            syncSubscriptionToken(reg).catch(err => console.error('[PWA] Auto-sync token failed:', err));
          }
          // Listen for background sync trigger from SW
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'trigger-sync') {
              window.dispatchEvent(new Event('online'));
            }
          });
          // Register background sync for offline queue if supported
          if ('sync' in reg) {
            (reg as any).sync.register('sync-queue').catch(() => {});
          }
        })
        .catch((err) => console.error('[PWA] Service Worker registration failed:', err));
    }

    // 3. Notification triggers — via DB Webhook + background-tasks, không cần polling
    // (Đã xoá client-side 30s polling để giảm ~6.700 requests/ngày)
  }, []);

  // Helper method to sync token to Backend database
  const syncSubscriptionToken = async (reg: ServiceWorkerRegistration) => {
    try {
      // Fetch public VAPID key
      const keyRes = await fetch('/api/vapid');
      if (!keyRes.ok) throw new Error('Failed to retrieve VAPID public key');
      const keys = await keyRes.json();
      
      if (!keys.publicKey) {
        throw new Error('VAPID public key not found in API response');
      }

      // Subscribe using the application public key
      const applicationServerKey = urlBase64ToUint8Array(keys.publicKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Post subscription payload to backend
      const customerId = storage.get('min_salon_customer_id') || undefined;
      const subRes = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, customerId })
      });

      const subData = await subRes.json();
      if (!subRes.ok || subData.error) {
        throw new Error(subData.error || 'Failed to save subscription');
      }

      console.log('[PWA] Push subscription successfully synchronized!');
      return true;
    } catch (err: any) {
      console.error('[PWA] Error during subscription token sync:', err);
      throw err;
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Trình duyệt này không hỗ trợ hiển thị thông báo.');
      return;
    }

    setIsSubscribing(true);
    setNotificationStatusMsg('Đang kích hoạt thông báo...');

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        await syncSubscriptionToken(reg);
        setNotificationStatusMsg('Đăng ký thông báo thành công!');
        
        // Hide widget after 2.5 seconds
        setTimeout(() => {
          setShowNotificationWidget(false);
        }, 2500);
      } else if (permission === 'denied') {
        setNotificationStatusMsg('Bạn đã từ chối quyền thông báo. Hãy cho phép trong cài đặt trình duyệt.');
      } else {
        setNotificationStatusMsg('Yêu cầu quyền đã bị bỏ qua.');
      }
    } catch (error: any) {
      console.error('[PWA] Permission request failed:', error);
      setNotificationStatusMsg('Lỗi khi đăng ký: ' + (error.message || error));
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <>
      {/* 1. Custom Installation Prompt component */}
      <InstallPWA />

      {/* 2. Offline Sync Indicator */}
      <OfflineIndicator />

      {/* 3. Notification Subscription Widget */}
      {showNotificationWidget && (
        <div id="push-notification-widget" className="fixed bottom-24 md:bottom-6 right-4 md:right-6 md:max-w-sm bg-[#FAF6F0] text-[#3A2E2B] border-2 border-[#EADDCD] p-4 rounded-2xl shadow-xl z-50 flex items-start gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-9 h-9 rounded-full bg-[#A87C5C] flex items-center justify-center shrink-0">
            {notificationPermission === 'denied' ? (
              <BellOff className="w-4.5 h-4.5 text-white" />
            ) : (
              <Bell className="w-4.5 h-4.5 text-white animate-bounce" />
            )}
          </div>

          <div className="flex-1 space-y-1">
            <h5 className="font-display font-semibold text-xs text-[#5C4033] uppercase tracking-wider">
              Khuyến khích bật thông báo
            </h5>
            <p className="text-[11px] text-stone-600 leading-snug">
              Nhận thông báo cập nhật thời gian thực khi đặt lịch thành công, hoàn thành hóa đơn và điểm danh của bạn.
            </p>

            {notificationStatusMsg && (
              <p className="text-[10px] italic font-semibold text-[#8D6E53] flex items-center gap-1">
                {notificationPermission === 'granted' && <CheckCircle className="w-3 h-3 text-green-600 inline" />}
                {notificationStatusMsg}
              </p>
            )}

            {notificationPermission !== 'granted' && (
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={requestNotificationPermission}
                  disabled={isSubscribing}
                  className="px-2.5 py-1.5 bg-[#8D6E53] hover:bg-[#765B43] disabled:bg-gray-400 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  {isSubscribing ? 'Đang bật...' : 'Bật nhận thông báo 🔔'}
                </button>
                <button
                  onClick={() => setShowNotificationWidget(false)}
                  className="px-2 py-1.5 text-gray-500 hover:text-gray-700 bg-white rounded-lg text-[10px] font-semibold border border-[#EADDCD] cursor-pointer"
                >
                  Tắt
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowNotificationWidget(false)}
            className="text-gray-400 hover:text-gray-700 p-0.5 rounded-full hover:bg-gray-200/50 transition-colors shrink-0 cursor-pointer"
            aria-label="Đóng bảng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
