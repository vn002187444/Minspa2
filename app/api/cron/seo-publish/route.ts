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
    return NextResponse.json({ success: false, message: 'research deprecated — use auto-seo refill' }, { status: 410 });
  }

  const result = await runAutoSeo();

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
