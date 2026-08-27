import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const res = NextResponse.json({
      authenticated: true,
      user: session.user,
    });
    res.headers.set('Cache-Control', 'private, max-age=30');
    return res;
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
