import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return NextResponse.json({ error: 'Push notifications are not configured on server' }, { status: 500 });
    }
    return NextResponse.json({ publicKey });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
