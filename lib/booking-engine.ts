import { createClient } from "@/utils/supabase/server";
import { insertNotification } from "@/utils/notifications";
import { format } from "date-fns";
import { getCached, setCache, buildSlotCacheKey, invalidateCache } from "@/lib/slot-cache";
import { logger } from "@/lib/logger";

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

interface AppointmentTimeFields {
  start_time: string;
  end_time: string;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
}

export function getEffectiveTimeRange(appt: AppointmentTimeFields): { start: Date; end: Date } {
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

  const { error } = await supabase.from('time_slot_locks').insert({
    staff_id: staffId,
    appointment_id: appointmentId,
    lock_date: lockDate,
    start_time: startTime,
    end_time: endTime,
    is_active: true,
  });
  if (error) {
    logger.error('[BookingEngine] Failed to lock time slot', error, { appointmentId, staffId, startTime, endTime });
  }
}

export async function unlockTimeSlots(appointmentId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('time_slot_locks')
    .update({ is_active: false })
    .eq('appointment_id', appointmentId);
  if (error) {
    logger.error('[BookingEngine] Failed to unlock time slots', error, { appointmentId });
  }
}

export async function unlockTimeSlotsInRange(staffId: string, startTime: string, endTime: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('time_slot_locks')
    .update({ is_active: false })
    .eq('staff_id', staffId)
    .eq('is_active', true)
    .gte('start_time', startTime)
    .lte('end_time', endTime);
  if (error) {
    logger.error('[BookingEngine] Failed to unlock time slots in range', error, { staffId, startTime, endTime });
  }
}

export async function cascadeShiftForward(
  staffId: string,
  completedAppointmentId: string,
  completionTime: string
): Promise<void> {
  const supabase = await createClient();

  const { data: completedAppt, error: completedApptErr } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('id', completedAppointmentId)
    .single();

  if (completedApptErr || !completedAppt) {
    if (completedApptErr) logger.error('[BookingEngine] Failed to fetch completed appointment', completedApptErr, { completedAppointmentId });
    return;
  }

  const compDate = new Date(completedAppt.start_time);
  const _dayStart = new Date(Date.UTC(compDate.getUTCFullYear(), compDate.getUTCMonth(), compDate.getUTCDate(), 0, 0, 0)).toISOString();
  const dayEnd = new Date(Date.UTC(compDate.getUTCFullYear(), compDate.getUTCMonth(), compDate.getUTCDate(), 23, 59, 59, 999)).toISOString();

  const { data: nextAppts, error: nextApptsErr } = await supabase
    .from('appointments')
    .select('id, start_time, end_time, actual_start_time, actual_end_time')
    .eq('staff_id', staffId)
    .neq('id', completedAppointmentId)
    .gte('start_time', completedAppt.start_time)
    .lte('start_time', dayEnd)
    .not('status', 'in', ['CANCELLED', 'COMPLETED'])
    .order('start_time', { ascending: true });

  if (nextApptsErr) {
    logger.error('[BookingEngine] Failed to fetch next appointments for cascade', nextApptsErr, { staffId, completedAppointmentId });
    return;
  }
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
    const results = await Promise.all([
      supabase.from('appointments').update({
        actual_start_time: newStart.toISOString(),
        actual_end_time: newEnd.toISOString(),
      }).eq('id', appt.id),
      unlockTimeSlotsInRange(staffId, oldLockStart, oldLockEnd),
      lockTimeSlots(appt.id, staffId, newStart.toISOString(), newEnd.toISOString()),
    ]);
    if (results[0]?.error) {
      logger.error('[BookingEngine] Failed to cascade update appointment', results[0].error, { appointmentId: appt.id });
    }

    const minutesShifted = Math.round((newStart.getTime() - originalStart.getTime()) / 60000);
    const apptCustomerId = (appt as any).customer_id;
    if (apptCustomerId) {
      insertNotification(
        'customer',
        apptCustomerId,
        'Lịch hẹn đã được dời',
        `Lịch hẹn của bạn đã được đẩy lên sớm hơn ${minutesShifted} phút do ca trước hoàn thành sớm.`,
        '/booking'
      ).catch(e => logger.error('[BookingEngine] Failed to notify customer of cascade shift', e, { appointmentId: appt.id }));
    }
    insertNotification(
      'user',
      staffId,
      'Lịch hẹn dời lịch',
      `Lịch hẹn lúc ${format(new Date(originalStart), 'HH:mm')} được dời lên ${format(newStart, 'HH:mm')} (sớm hơn ${minutesShifted} phút).`,
      '/staff?tab=SCHEDULE'
    ).catch(e => logger.error('[BookingEngine] Failed to notify staff of cascade shift', e, { appointmentId: appt.id }));

    cursor = newEnd;
  }

  if (timeSaved > 0) {
    const gapStart = new Date(completedEnd.getTime());
    const gapEnd = new Date(completedEnd.getTime() + timeSaved);

    const { data: gapLocks, error: gapLocksErr } = await supabase
      .from('time_slot_locks')
      .select('id')
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .gte('start_time', gapStart.toISOString())
      .lte('end_time', gapEnd.toISOString());

    if (gapLocksErr) {
      logger.error('[BookingEngine] Failed to fetch gap locks', gapLocksErr, { staffId });
    } else if (gapLocks && gapLocks.length > 0) {
      const { error: gapUnlockErr } = await supabase
        .from('time_slot_locks')
        .update({ is_active: false })
        .in('id', gapLocks.map(l => l.id));
      if (gapUnlockErr) {
        logger.error('[BookingEngine] Failed to unlock gap locks', gapUnlockErr, { staffId, count: gapLocks.length });
      }
    }
  }
}

export async function handleCancelAndUnlock(appointmentId: string): Promise<void> {
  const supabase = await createClient();

  const { data: appt, error: apptErr } = await supabase
    .from('appointments')
    .select('id, staff_id, customer_id, start_time, end_time, actual_start_time, actual_end_time, status')
    .eq('id', appointmentId)
    .single();

  if (apptErr || !appt) {
    if (apptErr) logger.error('[BookingEngine] Failed to fetch appointment for cancel', apptErr, { appointmentId });
    return;
  }

  const { error: cancelErr } = await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', appointmentId);
  if (cancelErr) {
    logger.error('[BookingEngine] Failed to cancel appointment', cancelErr, { appointmentId });
  }

  await unlockTimeSlots(appointmentId);

  // Notify staff and customer
  if (appt.staff_id) {
    insertNotification(
      'user',
      appt.staff_id,
      'Lịch hẹn đã hủy',
      `Lịch hẹn lúc ${format(new Date(appt.start_time), 'HH:mm')} đã bị hủy.`,
      '/staff?tab=SCHEDULE'
    ).catch(e => logger.error('[BookingEngine] Failed to notify staff of cancellation', e, { appointmentId }));
  }
  if (appt.customer_id) {
    insertNotification(
      'customer',
      appt.customer_id,
      'Lịch hẹn đã hủy',
      'Lịch hẹn của bạn tại Min Nail & Hair đã được hủy.',
      '/booking'
    ).catch(e => logger.error('[BookingEngine] Failed to notify customer of cancellation', e, { appointmentId }));
  }

  if (appt.staff_id) {
    const actualEnd = appt.actual_end_time || appt.end_time;
    const dayStart = new Date(appt.start_time).toISOString().split('T')[0];
    const dayEnd = `${dayStart}T23:59:59.999Z`;

    const { data: remainingAppts, error: remainingErr } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, actual_start_time, actual_end_time')
      .eq('staff_id', appt.staff_id)
      .gte('start_time', actualEnd)
      .lte('start_time', dayEnd)
      .not('status', 'in', ['CANCELLED', 'COMPLETED'])
      .order('start_time', { ascending: true });

    if (remainingErr) {
      logger.error('[BookingEngine] Failed to fetch remaining appointments after cancel', remainingErr, { appointmentId, staffId: appt.staff_id });
      return;
    }

    if (remainingAppts && remainingAppts.length > 0) {
      let cursor = new Date(actualEnd);

      for (const ra of remainingAppts) {
        const originalDuration = new Date(ra.end_time).getTime() - new Date(ra.start_time).getTime();
        const newStart = new Date(cursor);
        const newEnd = new Date(cursor.getTime() + originalDuration);

        const oldLockStart = ra.actual_start_time || ra.start_time;
        const oldLockEnd = ra.actual_end_time || ra.end_time;

        // Parallel: unlock old slot + update appointment + lock new slot
        const results = await Promise.all([
          unlockTimeSlotsInRange(appt.staff_id, oldLockStart, oldLockEnd),
          supabase.from('appointments').update({
            actual_start_time: newStart.toISOString(),
            actual_end_time: newEnd.toISOString(),
          }).eq('id', ra.id),
          lockTimeSlots(ra.id, appt.staff_id, newStart.toISOString(), newEnd.toISOString()),
        ]);
        if (results[1]?.error) {
          logger.error('[BookingEngine] Failed to reschedule appointment after cancel', results[1].error, { appointmentId: ra.id });
        }

        cursor = newEnd;
      }
    }
  }
}

export async function findNextAvailableDate(
  serviceIds: string[],
  services: { id: string; duration: number }[],
  preferredStaffId?: string,
  maxDays: number = 30
): Promise<{ date: string; slots: SlotAvailability[] } | null> {
  const today = new Date();
  const totalDuration = calculateProgressiveDuration(serviceIds, services);
  const _durationMinutes = totalDuration > 0 ? totalDuration : 60;

  for (let i = 0; i < maxDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const slots = await getSlotAvailabilityWithNames(dateStr, serviceIds, services, true);
    if (preferredStaffId) {
      const goodSlots = slots.filter(
        (s) => s.status !== 'past' && s.status !== 'no_staff_present' && s.status !== 'fully_booked' &&
        s.availableStaffNames.some((name) => name === preferredStaffId)
      );
      if (goodSlots.length > 0) return { date: dateStr, slots: goodSlots };
    } else {
      const goodSlots = slots.filter(
        (s) => s.status === 'all_available' || s.status === 'some_available'
      );
      if (goodSlots.length > 0) return { date: dateStr, slots: goodSlots };
    }
  }
  return null;
}

export async function incrementSlotLimit(date: string, time: string): Promise<void> {
  const supabase = await createClient();
  const { data: existing, error: selectErr } = await supabase
    .from('slot_limits')
    .select('id, current_bookings')
    .eq('lock_date', date)
    .eq('time_slot', time)
    .single();

  if (selectErr) {
    logger.error('[BookingEngine] Failed to fetch slot limit', selectErr, { date, time });
    return;
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from('slot_limits')
      .update({ current_bookings: existing.current_bookings + 1 })
      .eq('id', existing.id);
    if (updateErr) {
      logger.error('[BookingEngine] Failed to update slot limit', updateErr, { date, time, id: existing.id });
    }
  } else {
    const { error: insertErr } = await supabase.from('slot_limits').insert({
      lock_date: date,
      time_slot: time,
      max_bookings: 1,
      current_bookings: 1,
    });
    if (insertErr) {
      logger.error('[BookingEngine] Failed to insert slot limit', insertErr, { date, time });
    }
  }

  invalidateCache(date);
}

export async function getSlotAvailabilityWithNames(
  date: string,
  selectedServiceIds: string[] = [],
  services: { id: string; duration: number }[] = [],
  skipAttendanceCheck: boolean = false
): Promise<SlotAvailability[]> {
  const cacheKey = buildSlotCacheKey(date, selectedServiceIds);
  const cached = getCached<SlotAvailability[]>(cacheKey);
  if (cached) return cached;

  const supabase = await createClient();

  const { data: allStaff } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['STAFF', 'MANAGER'])
    .eq('is_active', true);

  if (!allStaff || allStaff.length === 0) return [];

  const todayStr = new Date().toISOString().split('T')[0];
  const isTomorrowOrLater = date > todayStr;

  const { data: attendance } = skipAttendanceCheck || isTomorrowOrLater
    ? { data: allStaff.map((s: { id: string; full_name: string }) => ({ staff_id: s.id })) }
    : await supabase
        .from('attendance')
        .select('staff_id')
        .eq('date', date)
        .eq('status', 'PRESENT');

  const presentStaffIds = new Set((attendance || []).map((a: { staff_id: string }) => a.staff_id));
  const presentStaff = allStaff.filter((s: { id: string; full_name: string }) => presentStaffIds.has(s.id));
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

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const { data: slotLimits } = isTomorrowOrLater && date === tomorrowStr
    ? await supabase.from('slot_limits').select('time_slot, current_bookings, max_bookings').eq('lock_date', date)
    : { data: [] };

  const slotLimitMap = new Map<string, { current: number; max: number }>();
  for (const sl of (slotLimits || [])) {
    slotLimitMap.set(sl.time_slot, { current: sl.current_bookings, max: sl.max_bookings });
  }

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

      const availableStaff = presentStaff.filter((s: { id: string; full_name: string }) => !busyStaffIdsForSlot.has(s.id));
      let availableCount = availableStaff.length;
      const availableStaffNames = availableStaff.map((s: { id: string; full_name: string }) => s.full_name);

      const limit = slotLimitMap.get(time);
      if (limit && limit.current >= limit.max) {
        availableCount = 0;
      }

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

  setCache(cacheKey, slots, selectedServiceIds.length > 0 ? 15_000 : 30_000);
  return slots;
}
