'use client';

import { useEffect, useState } from 'react';
import { savePushSubscription } from '@/app/push-actions';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Assuming sonner is used, if not we'll use window.alert or whatever they use

// Note: Ensure NEXT_PUBLIC_VAPID_PUBLIC_KEY is set in .env.local
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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

export default function PushNotificationManager({ customerId }: { customerId?: string }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking push subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        await checkSubscription();
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Bạn chưa cấp quyền gửi thông báo.');
        setLoading(false);
        return;
      }

      if (!publicVapidKey) {
        console.error('VAPID public key is missing');
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      // Send to server
      if (customerId) {
        // If we are a customer
        const { saveCustomerPushSubscription } = await import('@/app/push-actions');
        await saveCustomerPushSubscription(customerId, subscription);
      } else {
        // Logged in user (admin/staff)
        const res = await savePushSubscription(subscription);
        if (!res.success && res.error === 'User not authenticated') {
             // Silently fail if not logged in
        }
      }

      setIsSubscribed(true);
      toast.success('Đăng ký nhận thông báo thành công!');
    } catch (err) {
      console.error('Failed to subscribe:', err);
      toast.error('Lỗi khi đăng ký thông báo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Don't show if push is not supported
  }

  return (
    <button
      onClick={subscribe}
      disabled={isSubscribed || loading}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        isSubscribed 
          ? 'bg-green-50 text-green-700 border border-green-200 opacity-80 cursor-default' 
          : 'bg-[#FAF6F0] text-[#3A2E2B] border border-[#EADDCD] hover:bg-[#EADDCD] shadow-sm cursor-pointer'
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4 text-green-600" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {loading 
        ? 'Đang kiểm tra...' 
        : isSubscribed 
          ? 'Đã bật thông báo thiết bị' 
          : 'Bật thông báo ứng dụng'}
    </button>
  );
}
