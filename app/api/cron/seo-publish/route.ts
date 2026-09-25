import { NextRequest, NextResponse } from 'next/server';
import { runAutoSeo } from '@/lib/auto-seo';
import { getSession } from '@/utils/auth';

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  if (
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  ) return true;
  if (req.headers.get('x-supabase-cron') === 'true') return true;
  // Allow admin sessions (triggered from Admin UI)
  try {
    const session = await getSession();
    if (session?.user?.role === 'ADMIN') return true;
  } catch { /* not authenticated */ }
  return false;
}

async function handleRequest(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const isResearch = url.searchParams.get('research') === '1';
  const isForce = url.searchParams.get('force') === '1';

  if (isResearch) {
    try {
      const { createServiceClient } = await import('@/utils/supabase/server')
      const supabase = await createServiceClient()
      const { refillTopicPoolIfNeeded } = await import('@/lib/auto-seo')
      await refillTopicPoolIfNeeded(supabase)
      const { data } = await supabase.from('auto_seo_config').select('topic_pool').eq('id',1).single()
      const count = Array.isArray(data?.topic_pool) ? data.topic_pool.length : 0
      return NextResponse.json({ success: true, message: `Đã làm mới topic pool (${count} chủ đề)` })
    } catch (e:any) {
      return NextResponse.json({ success: false, message: e?.message || 'Refill failed' }, { status: 500 })
    }
  }

  const result = await runAutoSeo({ force: isForce });

  return NextResponse.json({
    success: result.success,
    message: result.message,
  });
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}
