import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/utils/push';
import { runRemindersCheck } from '@/utils/reminders';

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const maxDuration = 60;

async function processTask(task: { type: string; payload: Record<string, unknown> }) {
  switch (task.type) {
    case 'payment_notification': {
      const { customerId, staffId, appointmentId, customerName, commission, discountedTotal, appointmentDate, appointmentTime } = task.payload;
      const promises: Promise<unknown>[] = [];

      if (customerId && typeof customerId === 'string') {
        promises.push(
          sendPushNotification(
            customerId,
            'Thanh toán hoàn tất! ✨',
            `Hóa đơn của bạn đã sẵn sàng. Tổng thanh toán là ${(Number(discountedTotal) || 0).toLocaleString('vi-VN')} VNĐ. Cảm ơn quý khách đã tin chọn Min Salon!`,
            '/booking'
          ).catch(() => {})
        );
      }

      if (staffId && typeof staffId === 'string') {
        promises.push(
          sendPushNotification(
            staffId,
            'Hóa đơn hoàn tất! 🎉',
            `Bạn đã hoàn thành lịch hẹn #${(typeof appointmentId === 'string' ? appointmentId.slice(-6) : '').toUpperCase()}. Hoa hồng của bạn là ${(Number(commission) || 0).toLocaleString('vi-VN')} VNĐ đã được ghi nhận.`,
            '/staff'
          ).catch(() => {})
        );
      }

      promises.push(
        (async () => {
          const { data: admins } = await getSupabase().from('users').select('id').in('role', ['ADMIN', 'MANAGER']).eq('is_active', true);
          if (admins) {
            await Promise.allSettled(admins.map(admin =>
              sendPushNotification(
                admin.id,
                'Đơn hàng hoàn tất! 🛎️',
                `Khách hàng ${String(customerName || 'Khách')} vừa thanh toán lúc ${String(appointmentTime || '')} ngày ${String(appointmentDate || '')}. Tổng: ${(Number(discountedTotal) || 0).toLocaleString('vi-VN')} VNĐ.`,
                '/admin/orders'
              ).catch(() => {})
            ));
          }
        })()
      );

      await Promise.allSettled(promises);
      break;
    }

    case 'reminder_check':
      await runRemindersCheck();
      break;

    default:
      console.warn('[Background Worker] Unknown task type:', task.type);
  }
}

export async function GET() {
  try {
    const { data: messages, error } = await getSupabase().rpc('dequeue_all_background_tasks');

    if (error) {
      throw error;
    }

    const results: { id: string; type: string; status: string }[] = [];

    for (const msg of messages || []) {
      try {
        const task = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
        await processTask(task);
        results.push({ id: String(msg.msg_id), type: task.type, status: 'success' });
      } catch (err) {
        console.error(`[Background Worker] Failed to process msg ${msg.msg_id}:`, err);
        results.push({ id: String(msg.msg_id), type: 'unknown', status: 'failed' });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error: unknown) {
    console.error('[Background Worker] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
