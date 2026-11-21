import { NextResponse } from 'next/server';
import { runMarketingCampaign } from '@/lib/cron/marketing';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const isAuthorized =
      Boolean(process.env.CRON_SECRET) &&
      authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runMarketingCampaign();
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
