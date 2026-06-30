import { NextRequest, NextResponse } from 'next/server';
import { runAutoSeo, runKeywordResearch } from '@/lib/auto-seo';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    req.headers.get('x-supabase-cron') !== 'true'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isResearch = searchParams.get('research') === '1';

  if (isResearch) {
    const result = await runKeywordResearch();
    return NextResponse.json({
      success: result.success,
      message: result.message,
      topics: result.topics,
    });
  }

  const result = await runAutoSeo();

  return NextResponse.json({
    success: result.success,
    message: result.message,
    slug: result.slug,
    title: result.title,
  });
}
