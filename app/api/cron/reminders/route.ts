import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendPushNotification } from '@/utils/push';
import { format } from 'date-fns';

export async function GET(req: Request) {
  // Auth: either Vercel Cron secret hoặc Supabase pg_cron internal call
  const authHeader = req.headers.get('authorization') || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && req.headers.get('x-supabase-cron') !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  
  // Calculate Vietnam Time (GMT+7)
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const todayStr = vnTime.toISOString().split('T')[0]; // YYYY-MM-DD
  const vnHour = vnTime.getUTCHours(); 

  // We are looking for appointments approaching in 10 minutes
  // meaning: start_time > now AND start_time <= now + 10 mins
  const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  
  const { data: upcomingAppts, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, staff_id, start_time, status, customers(full_name)')
    .eq('status', 'CONFIRMED')
    .not('staff_id', 'is', null)
    .gt('start_time', now.toISOString())
    .lte('start_time', tenMinutesFromNow);

  if (fetchErr) {
    console.error('Failed to fetch upcoming appointments:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  let sentCount = 0;

  if (upcomingAppts && upcomingAppts.length > 0) {
    for (const appt of upcomingAppts) {
      if (appt.staff_id) {
        const apptTime = format(new Date(appt.start_time), 'HH:mm');
        // customers is typed as array by Supabase inference; cast to any to access full_name safely
        const customersRel = appt.customers as any;
        const customerName =
          (Array.isArray(customersRel) ? customersRel[0]?.full_name : customersRel?.full_name) ||
          'Khách vãng lai';
        
        await sendPushNotification(
          appt.staff_id,
          'Sắp đến giờ phục vụ! ⏰',
          `Bạn có lịch hẹn với khách hàng ${customerName} vào lúc ${apptTime}. Hãy chuẩn bị nhé!`,
          '/staff'
        ).catch(err => console.error("Staff approaching push notification error:", err));
        
        sentCount++;
      }
    }
  }

  return NextResponse.json({ success: true, message: `Checked successfully. Sent ${sentCount} reminders.` });
}
