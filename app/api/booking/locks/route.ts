import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const rl = await rateLimit(`locks:${ip}`, 60, 60);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const staffId = searchParams.get('staff_id');

    if (!date) {
      return NextResponse.json({ success: false, error: 'Missing date parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    let query = supabase
      .from('time_slot_locks')
      .select('id, staff_id, appointment_id, start_time, end_time, is_active, created_at')
      .eq('lock_date', date)
      .eq('is_active', true);

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data: locks, error } = await query.order('start_time', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, locks: locks || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
