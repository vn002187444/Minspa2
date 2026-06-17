import { createClient } from "@/utils/supabase/server";
import { insertNotification } from "@/utils/notifications";
import { format } from "date-fns";

export interface TimeLock {
  id: string;
  staff_id: string;
  appointment_id: string;
  lock_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface SlotAvailability {
  time: string;
  status: 'past' | 'no_staff_present' | 'fully_booked' | 'some_available' | 'all_available';
  availableStaff: number;
  totalStaff: number;
  availableStaffNames: string[];
  isRecommended: boolean;
}

export function calculateProgressiveDuration(serviceIds: string[], services: { id: string; duration: number }[]): number {
  const selected = services.filter(s => serviceIds.includes(s.id));
  return selected.reduce((sum, s) => sum + (s.duration || 30), 0);
}

export function getEffectiveTimeRange(appt: any): { start: Date; end: Date } {
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

export function doRangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function lockTimeSlots(
  appointmentId: string,
  staffId: string,
  startTime: string,
  endTime: string
): Promise<void> {
  const supabase = await createClient();
  const lockDate = startTime.split('T')[0];

  await supabase.from('time_slot_locks').insert({
    staff_id: staffId,
    appointment_id: appointmentId,
    lock_date: lockDate,
    start_time: startTime,
    end_time: endTime,
    is_active: true,
  });
}

export async function unlockTimeSlots(appointmentId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('time_slot_locks')
    .update({ is_active: false })
    .eq('appointment_id', appointmentId);
}

export async function unlockTimeSlotsInRange(staffId: string, startTime: string, endTime: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('time_slot_locks')
    .update({ is_active: false })
    .eq('staff_id', staffId)
    .eq('is_active', true)
    .gte('start_time', startTime)
    .lte('end_time', endTime);
}

export async function cascadeShiftForward(
  staffId: string,
  completedAppointmentId: string,
  completionTime: string
): Promise<void> {
  const supabase = await createClient();

  const { data: completedAppt } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('id', completedAppointmentId)
    .single();

  if (!completedAppt) return;

  const compDate = new Date(completedAppt.start_time);
  const dayStart = new Date(Date.UTC(compDate.getUTCFullYear(), compDate.getUTCMonth(), compDate.getUTCDate(), 0, 0, 0)).toISOString();
  const dayEnd = new Date(Date.UTC(compDate.getUTCFullYear(), compDate.getUTCMonth(), compDate.getUTCDate(), 23, 59, 59, 999)).toISOString();

  const { data: nextAppts } = await supabase
    .from('appointments')
    .select('id, start_time, end_time, actual_start_time, actual_end_time')
    .eq('staff_id', staffId)
    .neq('id', completedAppointmentId)
    .gte('start_time', completedAppt.start_time)
    .lte('start_time', dayEnd)
    .not('status', 'in', ['CANCELLED', 'COMPLETED'])
    .order('start_time', { ascending: true });

  if (!nextAppts || nextAppts.length === 0) return;

  const completedEnd = new Date(completionTime);
  const originalEndBeforeShift = new Date(completedAppt.end_time);
  const timeSaved = originalEndBeforeShift.getTime() - completedEnd.getTime();

  let cursor = new Date(completedEnd);

  for (const appt of nextAppts) {
    const originalStart = new Date(appt.start_time);
    const originalEnd = new Date(appt.end_time);
    const originalDuration = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(cursor);
    const newEnd = new Date(cursor.getTime() + originalDuration);

    const oldLockStart = appt.actual_start_time || appt.start_time;
    const oldLockEnd = appt.actual_end_time || appt.end_time;

    // Parallel: update appointment + unlock old slot + lock new slot
    await Promise.all([
      supabase.from('appointments').update({
        actual_start_time: newStart.toISOString(),
        actual_end_time: newEnd.toISOString(),
      }).eq('id', appt.id),
      unlockTimeSlotsInRange(staffId, oldLockStart, oldLockEnd),
      lockTimeSlots(appt.id, staffId, newStart.toISOString(), newEnd.toISOString()),
    ]);

    const minutesShifted = Math.round((newStart.getTime() - originalStart.getTime()) / 60000);
    const apptCustomerId = (appt as any).customer_id;
    if (apptCustomerId) {
      insertNotification(
        'customer',
        apptCustomerId,
        'Lịch hẹn đã được dời',
        `Lịch hẹn của bạn đã được đẩy lên sớm hơn ${minutesShifted} phút do ca trước hoàn thành sớm.`,
        '/booking'
      ).catch(() => {});
    }
    insertNotification(
      'user',
      staffId,
      'Lịch hẹn dời lịch',
      `Lịch hẹn lúc ${format(new Date(originalStart), 'HH:mm')} được dời lên ${format(newStart, 'HH:mm')} (sớm hơn ${minutesShifted} phút).`,
      '/staff?tab=SCHEDULE'
    ).catch(() => {});

    cursor = newEnd;
  }

  if (timeSaved > 0) {
    const gapStart = new Date(completedEnd.getTime());
    const gapEnd = new Date(completedEnd.getTime() + timeSaved);

    const { data: gapLocks } = await supabase
      .from('time_slot_locks')
      .select('id')
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .gte('start_time', gapStart.toISOString())
      .lte('end_time', gapEnd.toISOString());

    if (gapLocks && gapLocks.length > 0) {
      await supabase
        .from('time_slot_locks')
        .update({ is_active: false })
        .in('id', gapLocks.map(l => l.id));
    }
  }
}

export async function handleCancelAndUnlock(appointmentId: string): Promise<void> {
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, staff_id, customer_id, start_time, end_time, actual_start_time, actual_end_time, status')
    .eq('id', appointmentId)
    .single();

  if (!appt) return;

  await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', appointmentId);

  await unlockTimeSlots(appointmentId);

  // Notify staff and customer
  if (appt.staff_id) {
    insertNotification(
      'user',
      appt.staff_id,
      'Lịch hẹn đã hủy',
      `Lịch hẹn lúc ${format(new Date(appt.start_time), 'HH:mm')} đã bị hủy.`,
      '/staff?tab=SCHEDULE'
    ).catch(() => {});
  }
  if (appt.customer_id) {
    insertNotification(
      'customer',
      appt.customer_id,
      'Lịch hẹn đã hủy',
      'Lịch hẹn của bạn tại Min Nail & Hair đã được hủy.',
      '/booking'
    ).catch(() => {});
  }

  if (appt.staff_id) {
    const actualEnd = appt.actual_end_time || appt.end_time;
    const dayStart = new Date(appt.start_time).toISOString().split('T')[0];
    const dayEnd = `${dayStart}T23:59:59.999Z`;

    const { data: remainingAppts } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, actual_start_time, actual_end_time')
      .eq('staff_id', appt.staff_id)
      .gte('start_time', actualEnd)
      .lte('start_time', dayEnd)
      .not('status', 'in', ['CANCELLED', 'COMPLETED'])
      .order('start_time', { ascending: true });

    if (remainingAppts && remainingAppts.length > 0) {
      let cursor = new Date(actualEnd);

      for (const ra of remainingAppts) {
        const originalDuration = new Date(ra.end_time).getTime() - new Date(ra.start_time).getTime();
        const newStart = new Date(cursor);
        const newEnd = new Date(cursor.getTime() + originalDuration);

        const oldLockStart = ra.actual_start_time || ra.start_time;
        const oldLockEnd = ra.actual_end_time || ra.end_time;

        // Parallel: unlock old slot + update appointment + lock new slot
        await Promise.all([
          unlockTimeSlotsInRange(appt.staff_id, oldLockStart, oldLockEnd),
          supabase.from('appointments').update({
            actual_start_time: newStart.toISOString(),
            actual_end_time: newEnd.toISOString(),
          }).eq('id', ra.id),
          lockTimeSlots(ra.id, appt.staff_id, newStart.toISOString(), newEnd.toISOString()),
        ]);

        cursor = newEnd;
      }
    }
  }
}

export async function getSlotAvailabilityWithNames(
  date: string,
  selectedServiceIds: string[] = [],
  services: { id: string; duration: number }[] = []
): Promise<SlotAvailability[]> {
  const supabase = await createClient();

  const { data: allStaff } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['STAFF', 'MANAGER'])
    .eq('is_active', true);

  if (!allStaff || allStaff.length === 0) return [];

  const { data: attendance } = await supabase
    .from('attendance')
    .select('staff_id')
    .eq('date', date)
    .eq('status', 'PRESENT');

  const presentStaffIds = new Set((attendance || []).map((a: any) => a.staff_id));
  const presentStaff = allStaff.filter((s: any) => presentStaffIds.has(s.id));
  const totalStaff = presentStaff.length;

  const dayStart = new Date(`${date}T00:00:00+07:00`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59.999+07:00`).toISOString();

  const { data: busyAppointments } = await supabase
    .from('appointments')
    .select('staff_id, start_time, end_time, actual_start_time, actual_end_time')
    .in('status', ['CONFIRMED', 'IN_PROGRESS', 'PENDING_RANDOM'])
    .not('staff_id', 'is', null)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd);

  const { data: activeLocks } = await supabase
    .from('time_slot_locks')
    .select('staff_id, start_time, end_time')
    .eq('lock_date', date)
    .eq('is_active', true);

  const totalDuration = calculateProgressiveDuration(selectedServiceIds, services);
  const durationMinutes = totalDuration > 0 ? totalDuration : 30;

  const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const currentMinutes = nowVN.getHours() * 60 + nowVN.getMinutes();

  const slots: SlotAvailability[] = [];

  for (let h = 9; h <= 20; h++) {
    for (let m = 0; m <= 30; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const slotMinutes = h * 60 + m;

      if (slotMinutes < currentMinutes) {
        slots.push({ time, status: 'past', availableStaff: 0, totalStaff, availableStaffNames: [], isRecommended: false });
        continue;
      }

      if (slotMinutes + durationMinutes > 21 * 60) {
        slots.push({ time, status: 'past', availableStaff: 0, totalStaff, availableStaffNames: [], isRecommended: false });
        continue;
      }

      if (totalStaff === 0) {
        slots.push({ time, status: 'no_staff_present', availableStaff: 0, totalStaff: 0, availableStaffNames: [], isRecommended: false });
        continue;
      }

      const slotStart = new Date(`${date}T${time}:00+07:00`);
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

      const busyStaffIdsForSlot = new Set<string>();

      for (const appt of (busyAppointments || [])) {
        const { start, end } = getEffectiveTimeRange(appt);
        if (doRangesOverlap(slotStart, slotEnd, start, end)) {
          busyStaffIdsForSlot.add(appt.staff_id);
        }
      }

      for (const lock of (activeLocks || [])) {
        const lockStart = new Date(lock.start_time);
        const lockEnd = new Date(lock.end_time);
        if (doRangesOverlap(slotStart, slotEnd, lockStart, lockEnd)) {
          busyStaffIdsForSlot.add(lock.staff_id);
        }
      }

      const availableStaff = presentStaff.filter((s: any) => !busyStaffIdsForSlot.has(s.id));
      const availableCount = availableStaff.length;
      const availableStaffNames = availableStaff.map((s: any) => s.full_name);

      let status: SlotAvailability['status'];
      if (availableCount === 0) {
        status = 'fully_booked';
      } else if (availableCount === totalStaff) {
        status = 'all_available';
      } else {
        status = 'some_available';
      }

      const isRecommended = availableCount > 0 && availableCount >= Math.ceil(totalStaff / 2);

      slots.push({ time, status, availableStaff: availableCount, totalStaff, availableStaffNames, isRecommended });
    }
  }

  return slots;
}
