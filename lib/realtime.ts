import { useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

/**
 * Safely subscribe to a Supabase Realtime channel.
 * Catches security‑related errors (e.g., iOS Safari private‑browsing restrictions)
 * and returns a sentinel object instead of throwing.
 */
export async function safeSubscribe(channel: RealtimeChannel) {
  try {
    return await channel.subscribe();
  } catch (e: any) {
    // iOS Safari throws a DOMException with name "SecurityError" when WebSocket connections are blocked.
    if (e && e.name === 'SecurityError') {
      console.warn('[Realtime] Subscription blocked by browser security policy (SecurityError).');
    } else {
      console.warn('[Realtime] Subscription failed (possibly blocked by browser security policy):', e);
    }
    return { status: 'CHANNEL_ERROR' as const };
  }
}

interface UseScheduleRealtimeOptions {
  date: string;
  onDataChanged: () => void;
  /**
   * When false the hook does nothing. Useful for postponing subscription until a user
   * interaction (required on some browsers for WebSocket usage).
   */
  enabled?: boolean;
}

export function useScheduleRealtime({ date, onDataChanged, enabled = true }: UseScheduleRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Fallback timer for environments where Realtime is unavailable (e.g., iOS Safari SecurityError).
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !date) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const dayStart = `${date}T00:00:00+07:00`;
    const dayEnd = `${date}T23:59:59.999+07:00`;

    const channel = supabase
      .channel('schedule_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown> | undefined;
          const oldRecord = payload.old as Record<string, unknown> | undefined;
          const start = (newRecord?.start_time || oldRecord?.start_time) as string | undefined;
          if (start && start >= dayStart && start <= dayEnd) {
            onDataChanged();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_slot_locks' },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown> | undefined;
          const lockDate = (newRecord?.lock_date) as string | undefined;
          if (lockDate === date) {
            onDataChanged();
          }
        }
      );

    (async () => {
      try {
        const result = await safeSubscribe(channel);
        // If subscription failed due to a security error, start polling fallback.
        if ((result as any)?.status === 'CHANNEL_ERROR') {
          // Poll every 5 minutes as a safe alternative.
          fallbackTimerRef.current = setInterval(onDataChanged, 5 * 60 * 1000);
        } else {
          channelRef.current = channel as unknown as RealtimeChannel;
        }
      } catch (e) {
        console.warn('[Realtime] Safe subscription failed:', e);
      }
    })();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [date, onDataChanged, enabled]);
}
