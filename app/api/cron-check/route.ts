import { NextResponse } from 'next/server';
import { runRemindersCheck } from '@/utils/reminders';

export async function GET() {
  try {
    await runRemindersCheck();
    return NextResponse.json({ success: true, processed_at: new Date().toISOString() });
  } catch (error: any) {
    console.error('[CRON API] Error executing reminders task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await runRemindersCheck();
    return NextResponse.json({ success: true, processed_at: new Date().toISOString() });
  } catch (error: any) {
    console.error('[CRON API] Error executing reminders task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
