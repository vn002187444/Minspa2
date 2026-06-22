import { NextResponse } from 'next/server';
import { cloneDailyTasks } from '@/app/admin/actions';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && req.headers.get('x-supabase-cron') !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cloneDailyTasks();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[CRON] Clone daily tasks error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
