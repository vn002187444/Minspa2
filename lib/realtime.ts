import { useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

interface UseScheduleRealtimeOptions {
  date: string;
  onDataChanged: () => void;
  enabled?: boolean;
}

export function useScheduleRealtime({ date, onDataChanged, enabled = true }: UseScheduleRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        const newRecord = payload.new as Record<string, unknown> | undefined;
        const oldRecord = payload.old as Record<string, unknown> | undefined;
        const start = (newRecord?.start_time || oldRecord?.start_time) as string | undefined;

        if (start && start >= dayStart && start <= dayEnd) {
          onDataChanged();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_slot_locks' }, (payload) => {
        const newRecord = payload.new as Record<string, unknown> | undefined;
        const lockDate = (newRecord?.lock_date) as string | undefined;

        if (lockDate === date) {
          onDataChanged();
        }
      })
      .subscribe();

    channelRef.current = channel as unknown as RealtimeChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [date, onDataChanged, enabled]);
}
