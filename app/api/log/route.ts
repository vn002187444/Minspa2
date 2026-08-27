import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const rl = await rateLimit(`log:${ip}`, 20, 60);
    if (!rl.allowed) {
      return NextResponse.json({ ok: true });
    }
    const body = await req.json();
    // Sampling 1/10 in production to avoid log flood
    if (process.env.NODE_ENV === 'production' && Math.random() > 0.1) {
      return NextResponse.json({ ok: true });
    }
    if (process.env.NODE_ENV === 'production') {
      console.info('[API_LOG]', JSON.stringify(body));
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
