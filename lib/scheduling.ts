import { createClient } from '@/utils/supabase/server';

interface StaffCandidate {
  id: string;
  full_name: string;
  appointmentCount: number;
  rating: number;
  loyaltyScore: number;
  skillMatch: number;
  totalDurationMinutes: number;
}

export async function autoAssignStaff(
  serviceIds: string[],
  startTime: string,
  endTime: string,
  customerId: string | null
): Promise<string | null> {
  const supabase = await createClient();
  const start = new Date(startTime);
  const end = new Date(endTime);
  const dateStr = start.toISOString().split('T')[0];

  const [presentResult, busyResult, locksResult, servicesResult, skillsResult] = await Promise.all([
    checkAttendance(dateStr, supabase),
    supabase
      .from('appointments')
      .select('staff_id, start_time, end_time, actual_start_time, actual_end_time')
      .in('status', ['CONFIRMED', 'IN_PROGRESS'])
      .not('staff_id', 'is', null),
    supabase
      .from('time_slot_locks')
      .select('staff_id, start_time, end_time')
      .eq('lock_date', dateStr)
      .eq('is_active', true),
    supabase
      .from('services')
      .select('id, category')
      .in('id', serviceIds),
    supabase
      .from('staff_skills')
      .select('staff_id, service_id, skill_level')
      .in('service_id', serviceIds)
      .eq('is_active', true),
  ]);

  const presentStaffIds = presentResult;
  if (presentStaffIds.size === 0) return null;

  const busyStaffIds = new Set<string>();
  for (const appt of (busyResult.data || [])) {
    const apptStart = new Date(appt.actual_start_time || appt.start_time);
    const apptEnd = new Date(appt.actual_end_time || appt.end_time);
    if (doRangesOverlap(start, end, apptStart, apptEnd)) {
      busyStaffIds.add(appt.staff_id);
    }
  }
  for (const lock of (locksResult.data || [])) {
    const lockStart = new Date(lock.start_time);
    const lockEnd = new Date(lock.end_time);
    if (doRangesOverlap(start, end, lockStart, lockEnd)) {
      busyStaffIds.add(lock.staff_id);
    }
  }

  let availableStaffIds = [...presentStaffIds].filter((id) => !busyStaffIds.has(id));
  if (availableStaffIds.length === 0) return null;

  const { data: staffUsers } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', availableStaffIds)
    .eq('is_active', true);

  if (!staffUsers || staffUsers.length === 0) return null;

  const todayStart = new Date(`${dateStr}T00:00:00+07:00`).toISOString();
  const todayEnd = new Date(`${dateStr}T23:59:59.999+07:00`).toISOString();

  const [todayApptsResult, todayLockedResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('staff_id, start_time, end_time')
      .in('status', ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'])
      .gte('start_time', todayStart)
      .lte('start_time', todayEnd),
    supabase
      .from('time_slot_locks')
      .select('staff_id, start_time, end_time')
      .eq('lock_date', dateStr)
      .eq('is_active', true),
  ]);

  const workloadMap = new Map<string, number>();
  const durationMap = new Map<string, number>();

  for (const appt of (todayApptsResult.data || [])) {
    if (appt.staff_id) {
      workloadMap.set(appt.staff_id, (workloadMap.get(appt.staff_id) || 0) + 1);
      const apptStart = new Date(appt.start_time);
      const apptEnd = new Date(appt.end_time);
      const duration = (apptEnd.getTime() - apptStart.getTime()) / 60000;
      durationMap.set(appt.staff_id, (durationMap.get(appt.staff_id) || 0) + duration);
    }
  }

  for (const lock of (todayLockedResult.data || [])) {
    if (lock.staff_id) {
      const lockStart = new Date(lock.start_time);
      const lockEnd = new Date(lock.end_time);
      const duration = (lockEnd.getTime() - lockStart.getTime()) / 60000;
      durationMap.set(lock.staff_id, (durationMap.get(lock.staff_id) || 0) + duration);
    }
  }

  const skillMap = new Map<string, Set<string>>();
  for (const skill of (skillsResult.data || [])) {
    if (!skillMap.has(skill.staff_id)) {
      skillMap.set(skill.staff_id, new Set());
    }
    skillMap.get(skill.staff_id)!.add(skill.service_id);
  }

  const serviceIdSet = new Set(serviceIds);

  const loyaltyMap = new Map<string, number>();
  const ratingMap = new Map<string, { sum: number; count: number }>();

  if (customerId) {
    const { data: historyAppts } = await supabase
      .from('appointments')
      .select('staff_id')
      .eq('customer_id', customerId)
      .eq('status', 'COMPLETED')
      .not('staff_id', 'is', null);

    for (const appt of (historyAppts || [])) {
      if (appt.staff_id) {
        loyaltyMap.set(appt.staff_id, (loyaltyMap.get(appt.staff_id) || 0) + 1);
      }
    }
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, appointments!inner(staff_id)')
    .in('appointments.staff_id', availableStaffIds);

  for (const review of (reviews || [])) {
    const appt = (review as Record<string, unknown>).appointments as Record<string, unknown> | undefined;
    if (appt?.staff_id) {
      const staffId = appt.staff_id as string;
      const current = ratingMap.get(staffId) || { sum: 0, count: 0 };
      ratingMap.set(staffId, { sum: current.sum + ((review as Record<string, unknown>).rating as number), count: current.count + 1 });
    }
  }

  const reqDuration = (end.getTime() - start.getTime()) / 60000;

  const candidates: StaffCandidate[] = staffUsers.map((staff) => {
    const staffSkills = skillMap.get(staff.id);
    const matchedServiceCount = staffSkills
      ? [...serviceIdSet].filter((sid) => staffSkills.has(sid)).length
      : 0;
    const skillMatch = serviceIds.length > 0 ? matchedServiceCount / serviceIds.length : 1;

    return {
      id: staff.id,
      full_name: staff.full_name || '',
      appointmentCount: workloadMap.get(staff.id) || 0,
      totalDurationMinutes: durationMap.get(staff.id) || 0,
      rating: (() => {
        const r = ratingMap.get(staff.id);
        return r ? r.sum / r.count : 3;
      })(),
      loyaltyScore: loyaltyMap.get(staff.id) || 0,
      skillMatch,
    };
  });

  candidates.sort((a, b) => {
    if (a.loyaltyScore > 0 && b.loyaltyScore === 0) return -1;
    if (b.loyaltyScore > 0 && a.loyaltyScore === 0) return 1;
    if (a.loyaltyScore !== b.loyaltyScore) return b.loyaltyScore - a.loyaltyScore;

    if (b.skillMatch !== a.skillMatch) return b.skillMatch - a.skillMatch;

    if (a.totalDurationMinutes !== b.totalDurationMinutes) return a.totalDurationMinutes - b.totalDurationMinutes;

    if (a.appointmentCount !== b.appointmentCount) return a.appointmentCount - b.appointmentCount;

    return b.rating - a.rating;
  });

  const chosenId = candidates.length > 0 ? candidates[0].id : null;

  return chosenId;
}

export async function batchAutoAssign(): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const dateStr = vnTime.toISOString().split('T')[0];

  const dayStart = new Date(`${dateStr}T00:00:00+07:00`).toISOString();
  const dayEnd = new Date(`${dateStr}T23:59:59.999+07:00`).toISOString();

  const { data: pendingAppts } = await supabase
    .from('appointments')
    .select('id, customer_id, start_time, end_time')
    .eq('status', 'PENDING_RANDOM')
    .is('staff_id', null)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd);

  if (!pendingAppts || pendingAppts.length === 0) return 0;

  pendingAppts.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const workloadTrack = new Map<string, number>();
  let assignedCount = 0;

  for (const appt of pendingAppts) {
    const { data: serviceLinks } = await supabase
      .from('appointment_services')
      .select('service_id')
      .eq('appointment_id', appt.id);

    const serviceIds = (serviceLinks || []).map((l) => l.service_id);
    const staffId = await autoAssignStaff(serviceIds, appt.start_time, appt.end_time, appt.customer_id);

    if (staffId) {
      const prevStaffId = null;
      const reason = workloadTrack.has(staffId)
        ? `Batch auto-assign: workload-balanced`
        : `Batch auto-assign: initial assign`;

      await supabase
        .from('appointments')
        .update({ staff_id: staffId, status: 'CONFIRMED' })
        .eq('id', appt.id)
        .is('staff_id', null);

      const { lockTimeSlots } = await import('@/lib/booking-engine');
      await lockTimeSlots(appt.id, staffId, appt.start_time, appt.end_time);

      workloadTrack.set(staffId, (workloadTrack.get(staffId) || 0) + 1);

      await logAutoAssign(appt.id, staffId, prevStaffId, reason);
      assignedCount++;
    }
  }

  return assignedCount;
}

async function checkAttendance(dateStr: string, supabase: any): Promise<Set<string>> {
  const todayStr = new Date().toISOString().split('T')[0];
  const isTomorrowOrLater = dateStr > todayStr;

  if (isTomorrowOrLater) {
    const { data: staffUsers } = await supabase
      .from('users')
      .select('id')
      .in('role', ['STAFF', 'MANAGER'])
      .eq('is_active', true);
    return new Set((staffUsers || []).map((s: any) => s.id));
  }

  const { data: attendance } = await supabase
    .from('attendance')
    .select('staff_id')
    .eq('date', dateStr)
    .eq('status', 'PRESENT');

  return new Set((attendance || []).map((a: any) => a.staff_id));
}

async function logAutoAssign(
  appointmentId: string,
  assignedStaffId: string | null,
  previousStaffId: string | null,
  reason: string
): Promise<void> {
  const supabase = await createClient();
  try {
    await supabase.from('auto_assign_logs').insert({
      appointment_id: appointmentId,
      assigned_staff_id: assignedStaffId,
      previous_staff_id: previousStaffId,
      reason,
    });
  } catch {
    // Non-critical, don't throw
  }
}

function doRangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}
