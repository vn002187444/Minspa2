import { NextResponse } from 'next/server';
import { batchAutoAssign } from '@/lib/scheduling';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && req.headers.get('x-supabase-cron') !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const assignedCount = await batchAutoAssign();
    return NextResponse.json({ success: true, assignedCount });
  } catch (error: unknown) {
    console.error('[CRON] Auto-assign error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
