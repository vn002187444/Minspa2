import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/utils/push';
import { runRemindersCheck } from '@/utils/reminders';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, customerId, staffId, commission, total, discountedTotal, staffName, customerName, appointmentDate, appointmentTime } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    // Fire-and-forget: push notifications
    const bgTasks: Promise<any>[] = [];

    if (customerId) {
      bgTasks.push(
        sendPushNotification(
          customerId,
          'Thanh toán hoàn tất! ✨',
          `Hóa đơn của bạn đã sẵn sàng. Tổng thanh toán là ${(discountedTotal || 0).toLocaleString('vi-VN')} VNĐ. Cảm ơn quý khách đã tin chọn Min Salon!`,
          '/booking'
        ).catch(() => {})
      );
    }

    if (staffId) {
      bgTasks.push(
        sendPushNotification(
          staffId,
          'Hóa đơn hoàn tất! 🎉',
          `Bạn đã hoàn thành lịch hẹn #${appointmentId.slice(-6).toUpperCase()}. Hoa hồng của bạn là ${(commission || 0).toLocaleString('vi-VN')} VNĐ đã được ghi nhận.`,
          '/staff'
        ).catch(() => {})
      );
    }

    // Notify admins
    bgTasks.push(
      Promise.resolve(
        supabase.from('users').select('id').in('role', ['ADMIN', 'MANAGER']).eq('is_active', true)
      ).then(({ data: admins }) => {
        if (admins) {
          return Promise.all(admins.map(admin =>
            sendPushNotification(
              admin.id,
              'Đơn hàng hoàn tất! 🛎️',
              `Khách hàng ${customerName || 'Khách'} vừa thanh toán lúc ${appointmentTime || ''} ngày ${appointmentDate ? format(new Date(appointmentDate), 'dd/MM/yyyy') : ''}. Tổng: ${(discountedTotal || 0).toLocaleString('vi-VN')} VNĐ.`,
              '/admin/orders'
            ).catch(() => {})
          ));
        }
        return [];
      }).catch(() => {})
    );

    // Run reminders check
    bgTasks.push(runRemindersCheck().catch(() => {}));

    Promise.all(bgTasks).catch(() => {});

    return NextResponse.json({ success: true, message: 'Background tasks queued' });
  } catch (error: any) {
    console.error('[Background Tasks] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
