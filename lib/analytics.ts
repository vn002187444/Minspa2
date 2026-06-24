import { storage } from '@/lib/storage';

type GtagParams = Record<string, string | number | boolean>;

const MASCOT_EVENT_KEY = 'min_mascot_events';

export const trackEvent = (eventName: string, params: GtagParams) => {
  if (typeof window !== 'undefined') {
    const w = window as { gtag?: (cmd: string, event: string, params: GtagParams) => void };
    w.gtag?.('event', eventName, params);
  }
};

export const trackMascotEvent = (action: string, extra: Record<string, string | number | boolean> = {}) => {
  trackEvent('mascot_' + action, extra);

  try {
    const stored = storage.get(MASCOT_EVENT_KEY);
    const events = stored ? JSON.parse(stored) : [];
    events.push({ action, ...extra, timestamp: Date.now() });
    storage.set(MASCOT_EVENT_KEY, JSON.stringify(events.slice(-50)));
  } catch {}
};

export function getMascotStats(): { clicks: number; bookings: number; dismissals: number } {
  try {
    const raw = storage.get(MASCOT_EVENT_KEY);
    if (!raw) return { clicks: 0, bookings: 0, dismissals: 0 };
    const events = JSON.parse(raw);
    return {
      clicks: events.filter((e: any) => e.action === 'click_suggestion' || e.action === 'open').length,
      bookings: events.filter((e: any) => e.action === 'booking_after_suggestion').length,
      dismissals: events.filter((e: any) => e.action === 'dismiss').length,
    };
  } catch {
    return { clicks: 0, bookings: 0, dismissals: 0 };
  }
}
