import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { cascadeShiftForward, lockTimeSlots } from "@/lib/booking-engine";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId } = await request.json();
    if (!appointmentId) {
      return NextResponse.json({ success: false, error: 'Missing appointmentId' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: appt } = await supabase
      .from('appointments')
      .select('id, staff_id, start_time, end_time, status')
      .eq('id', appointmentId)
      .single();

    if (!appt) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (appt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ success: false, error: 'Appointment must be IN_PROGRESS to complete early' }, { status: 400 });
    }

    const completedAt = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('appointments')
      .update({
        status: 'COMPLETED',
        actual_end_time: completedAt,
      })
      .eq('id', appointmentId);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    await lockTimeSlots(appointmentId, appt.staff_id, appt.start_time, appt.end_time);

    const originalEnd = new Date(appt.end_time);
    const completedAtDate = new Date(completedAt);

    if (completedAtDate < originalEnd && appt.staff_id) {
      await cascadeShiftForward(appt.staff_id, appointmentId, completedAt);
    }

    return NextResponse.json({
      success: true,
      completedAt,
      earlyCompletion: completedAtDate < originalEnd,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
