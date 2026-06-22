import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { handleCancelAndUnlock } from "@/lib/booking-engine";
import { sendPushNotification } from "@/utils/push";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rl = await rateLimit(`cancel:${session.user.id}`, 20, 60);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, { status: 429 });
    }

    const { appointmentId } = await request.json();
    if (!appointmentId) {
      return NextResponse.json({ success: false, error: 'Missing appointmentId' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: appt } = await supabase
      .from('appointments')
      .select('id, customer_id, staff_id, status')
      .eq('id', appointmentId)
      .single();

    if (!appt) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (appt.status !== 'CONFIRMED' && appt.status !== 'PENDING_RANDOM') {
      return NextResponse.json({ success: false, error: 'Only CONFIRMED or PENDING_RANDOM appointments can be cancelled' }, { status: 400 });
    }

    await handleCancelAndUnlock(appointmentId);

    if (appt.customer_id) {
      await sendPushNotification(
        appt.customer_id,
        'Lịch hẹn đã hủy',
        `Lịch hẹn của bạn đã được hủy bởi quản lý.`,
        '/booking'
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
