import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && req.headers.get('x-supabase-cron') !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { data: admins } = await supabase.from('users').select('id').in('role', ['ADMIN', 'MANAGER']).eq('is_active', true);
    const adminIds = (admins || []).map(a => a.id);
    let overdueNotified = 0;
    let staleNotified = 0;

    // 4.10: Check overdue tasks (pending/in_progress past deadline)
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('id, title, deadline')
      .not('status', 'in', '("COMPLETED","CANCELLED")')
      .lt('deadline', now)
      .limit(100);

    for (const t of (overdueTasks || [])) {
      for (const adminId of adminIds) {
        await supabase.from('notifications').insert({
          recipient_type: 'user', recipient_id: adminId,
          title: '⏰ Công việc trễ hạn',
          content: `"${t.title}" đã quá hạn (${new Date(t.deadline).toLocaleDateString('vi-VN')})`,
          link: '/admin?tab=TASKS',
        });
      }
      overdueNotified++;
    }

    // 4.9: Check stale pending tasks (> 2 hours without acceptance)
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    const { data: staleTasks } = await supabase
      .from('tasks')
      .select('id, title, assignee_id, assignee_type, created_at')
      .eq('status', 'PENDING')
      .lt('created_at', twoHoursAgo)
      .limit(100);

    for (const t of (staleTasks || [])) {
      for (const adminId of adminIds) {
        await supabase.from('notifications').insert({
          recipient_type: 'user', recipient_id: adminId,
          title: '⚠️ Nhân viên chưa nhận việc',
          content: `"${t.title}" vẫn chưa được nhận sau 2 giờ`,
          link: '/admin?tab=TASKS',
        });
      }
      staleNotified++;
    }

    return NextResponse.json({
      success: true,
      overdueNotified,
      staleNotified,
    });
  } catch (error) {
    console.error('[CRON] Check tasks error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
