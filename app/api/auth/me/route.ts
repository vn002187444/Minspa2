import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
