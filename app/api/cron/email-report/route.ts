import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && req.headers.get('x-supabase-cron') !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: appointments } = await supabase
      .from('appointments')
      .select('total_amount, discount_amount, tip_amount, staff_id, start_time')
      .gte('start_time', startOfMonth)
      .lte('start_time', endOfMonth)
      .eq('status', 'COMPLETED')
      .limit(5000);

    let totalRevenue = 0;
    let totalTip = 0;
    let totalCount = 0;

    for (const a of (appointments || [])) {
      totalRevenue += (a.total_amount || 0) - (a.discount_amount || 0);
      totalTip += a.tip_amount || 0;
      totalCount++;
    }

    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .in('role', ['ADMIN', 'MANAGER'])
      .eq('is_active', true);

    for (const admin of (admins || [])) {
      await supabase.from('notifications').insert({
        recipient_type: 'user',
        recipient_id: admin.id,
        title: '📊 Báo cáo định kỳ',
        content: `Doanh thu tháng này: ${totalRevenue.toLocaleString('vi-VN')}₫ | Tip: ${totalTip.toLocaleString('vi-VN')}₫ | Đơn: ${totalCount}`,
        link: '/admin?tab=REPORTS',
      });
    }

    return NextResponse.json({
      success: true,
      summary: { totalRevenue, totalTip, totalAppointments: totalCount },
      notified: (admins || []).length,
    });
  } catch (error) {
    console.error('[CRON] Email report error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
