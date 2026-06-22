import { NextResponse } from 'next/server';
import { runAutoSeo } from '@/lib/auto-seo';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      request.headers.get('x-supabase-cron') === 'true';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runAutoSeo();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
