'use server'

import { createClient } from "@/utils/supabase/server";
import { getSlotAvailabilityWithNames } from "@/lib/booking-engine";

function getEffectiveTimeRange(appt: any): { start: Date; end: Date } {
  const expectedStart = new Date(appt.start_time);
  const expectedEnd = new Date(appt.end_time);
  const actualStart = appt.actual_start_time ? new Date(appt.actual_start_time) : null;
  const actualEnd = appt.actual_end_time ? new Date(appt.actual_end_time) : null;

  if (actualEnd) {
    return { start: actualStart || expectedStart, end: actualEnd };
  }
  if (actualStart) {
    const duration = expectedEnd.getTime() - expectedStart.getTime();
    return { start: actualStart, end: new Date(actualStart.getTime() + duration) };
  }
  return { start: expectedStart, end: expectedEnd };
}

function doRangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableStaff(date: string, time: string, durationMinutes: number = 60) {
  const supabase = await createClient();

  const dayStart = new Date(`${date}T00:00:00+07:00`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59.999+07:00`).toISOString();

  const [allStaffResult, attendanceResult, busyAppointmentsResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name')
      .in('role', ['STAFF', 'MANAGER'])
      .eq('is_active', true),
    supabase
      .from('attendance')
      .select('staff_id')
      .eq('date', date)
      .eq('status', 'PRESENT'),
    supabase
      .from('appointments')
      .select('staff_id, start_time, end_time, actual_start_time, actual_end_time')
      .in('status', ['CONFIRMED', 'IN_PROGRESS', 'PENDING_RANDOM'])
      .not('staff_id', 'is', null)
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd),
  ]);

  const allStaff = allStaffResult?.data || [];
  if (allStaff.length === 0) {
    return [];
  }

  const presentStaffIds = new Set((attendanceResult?.data || []).map((a: any) => a.staff_id));

  const slotStart = new Date(`${date}T${time}:00+07:00`);
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

  const busyAppointments = busyAppointmentsResult?.data || [];

  const busyStaffIds = new Set<string>();
  for (const appt of (busyAppointments || [])) {
    const { start, end } = getEffectiveTimeRange(appt);
    if (doRangesOverlap(slotStart, slotEnd, start, end)) {
      busyStaffIds.add(appt.staff_id);
    }
  }

  const freeStaff = allStaff.filter((staff: any) =>
    presentStaffIds.has(staff.id) && !busyStaffIds.has(staff.id)
  );
  return freeStaff;
}

export type SlotStatus = 'past' | 'no_staff_present' | 'fully_booked' | 'some_available' | 'all_available';

export interface SlotInfo {
  time: string;
  status: SlotStatus;
  availableStaff: number;
  totalStaff: number;
  availableStaffNames: string[];
  isRecommended: boolean;
}

export async function getSlotAvailability(
  date: string,
  selectedServiceIds: string[] = [],
  services: { id: string; duration: number }[] = []
): Promise<SlotInfo[]> {
  return getSlotAvailabilityWithNames(date, selectedServiceIds, services);
}
