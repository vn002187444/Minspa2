'use client'

import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { storage } from '@/lib/storage';
import InstallPWA from './InstallPWA';
import OfflineIndicator from './OfflineIndicator';

const LS_KEY_DISMISS = 'notif_widget_dismissed_at';
const NOTIF_COOLDOWN_DAYS = 3;

function isNotifCooldownPassed(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(LS_KEY_DISMISS);
  if (!stored) return true;
  const dismissed = parseInt(stored, 10);
  if (isNaN(dismissed)) return true;
  return Date.now() - dismissed > NOTIF_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
}

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
    const init = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (Notification.permission !== 'granted' && !isStandalone && isNotifCooldownPassed()) {
          setShowNotificationWidget(true);
        }
      }
    };
    init();
  }, []);

useEffect(() => {
  // 2. Register Service Worker
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
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
    } catch (e) {
      console.warn('[PWA] Service Worker registration blocked by browser security policy:', e);
    }
  }
}, []);

  // Helper method to sync token to Backend database
  const syncSubscriptionToken = async (reg: ServiceWorkerRegistration, forceSubscribe = false) => {
    try {
      // Check for existing subscription first
      const existingSub = await reg.pushManager.getSubscription();
      let subscription = existingSub;

      if (!subscription) {
        // If no existing subscription and we are not forcing it (e.g. auto-sync on mount),
        // do not call subscribe() as it throws SecurityError on iOS without user interaction.
        if (!forceSubscribe) {
          console.log('[PWA] No active subscription found, skipping auto-subscribe on mount to avoid SecurityError');
          return false;
        }

        // Fetch public VAPID key
        const keyRes = await fetch('/api/vapid');
        if (!keyRes.ok) throw new Error('Failed to retrieve VAPID public key');
        const keys = await keyRes.json();
        
        if (!keys.publicKey) {
          throw new Error('VAPID public key not found in API response');
        }

        // Subscribe using the application public key
        const applicationServerKey = urlBase64ToUint8Array(keys.publicKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

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
    } catch (err: unknown) {
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
        await syncSubscriptionToken(reg, true);
        setNotificationStatusMsg('Đăng ký thông báo thành công!');
        try { localStorage.removeItem(LS_KEY_DISMISS); } catch {}
        
        // Hide widget after 2.5 seconds
        setTimeout(() => {
          setShowNotificationWidget(false);
        }, 2500);
      } else if (permission === 'denied') {
        setNotificationStatusMsg('Bạn đã từ chối quyền thông báo. Hãy cho phép trong cài đặt trình duyệt.');
      } else {
        setNotificationStatusMsg('Yêu cầu quyền đã bị bỏ qua.');
      }
    } catch (error: unknown) {
      console.error('[PWA] Permission request failed:', error);
      setNotificationStatusMsg('Lỗi khi đăng ký: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubscribing(false);
    }
  };

  const dismissNotifWidget = () => {
    setShowNotificationWidget(false);
    try { localStorage.setItem(LS_KEY_DISMISS, String(Date.now())); } catch {}
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
                  className="px-2.5 py-2.5 bg-[#8D6E53] hover:bg-[#765B43] disabled:bg-gray-400 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
                >
                  {isSubscribing ? 'Đang bật...' : 'Bật nhận thông báo 🔔'}
                </button>
                <button
                  onClick={dismissNotifWidget}
                  className="px-2 py-2.5 text-gray-500 hover:text-gray-700 bg-white rounded-lg text-[11px] font-semibold border border-[#EADDCD] cursor-pointer min-h-[44px]"
                >
                  Tắt
                </button>
              </div>
            )}
          </div>

          <button
            onClick={dismissNotifWidget}
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
