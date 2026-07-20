import { sendPushNotification } from './push';
import { format } from 'date-fns';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from "@/lib/logger";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const k = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!u || !k) throw new Error('Supabase environment variables are not set.');
    _supabase = createClient(u, k);
  }
  return _supabase;
}

/**
 * Runs background reminder checks.
 * Fetches required data from Supabase, processes reminder rules,
 * and upserts log tables back to Supabase.
 */
export async function runRemindersCheck() {
  console.log('[Reminders] Initiating reminders background check...');

  // Fetch data from Supabase tables
  const [{ data: users }, { data: appointments }, { data: attendance },
    { data: attendanceReminders }, { data: randomBookingReminders },
    { data: unacceptedBookingReminders }, { data: uncompletedBookingReminders }] = await Promise.all([
    getSupabase().from('users').select('*'),
    getSupabase().from('appointments').select('*'),
    getSupabase().from('attendance').select('*'),
    getSupabase().from('attendance_reminders_log').select('*'),
    getSupabase().from('random_booking_reminders_log').select('*'),
    getSupabase().from('unaccepted_booking_reminders_log').select('*'),
    getSupabase().from('uncompleted_booking_reminders_log').select('*')
  ]);

  interface ReminderUser { id: string; role: string; full_name: string }
  interface ReminderAppt { id: string; status: string; staff_id: string; start_time: string; end_time: string }
  interface ReminderAttendance { staff_id: string; date: string; status: string }
  interface ReminderLog { staff_id?: string; appointment_id?: string; date?: string; count?: number; sent_at?: string }

  const db: Record<string, any[]> = {
    users: users || [],
    appointments: appointments || [],
    attendance: attendance || [],
    attendance_reminders_log: attendanceReminders || [],
    random_booking_reminders_log: randomBookingReminders || [],
    unaccepted_booking_reminders_log: unacceptedBookingReminders || [],
    uncompleted_booking_reminders_log: uncompletedBookingReminders || []
  };

  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const todayStr = vnTime.toISOString().split('T')[0];
  const vnHour = vnTime.getUTCHours();

  const staffUsers = db.users.filter((u: ReminderUser) => u.role === 'STAFF');

  // ==== RULE 1: Attendance reminder at 10:00 AM daily (max 2 times) ====
  if (vnHour >= 10) {
    for (const staff of staffUsers) {
      const hasCheckedIn = db.attendance.some((a: ReminderAttendance) => a.staff_id === staff.id && a.date === todayStr && a.status === 'PRESENT');
      if (!hasCheckedIn) {
        let logIndex = db.attendance_reminders_log.findIndex((l: ReminderLog) => l.staff_id === staff.id && l.date === todayStr);
        if (logIndex === -1) {
          db.attendance_reminders_log.push({ staff_id: staff.id, date: todayStr, count: 0 });
          logIndex = db.attendance_reminders_log.length - 1;
        }
        const log = db.attendance_reminders_log[logIndex];
        if (log.count < 2) {
          console.log(`[Reminders] Sending attendance reminder #${log.count + 1} to staff ${staff.full_name}`);
          await sendPushNotification(
            staff.id,
            'Nhắc nhở điểm danh! ⏰',
            `Bạn ơi, đã qua 10:00 sáng rồi mà bạn chưa điểm danh nhận việc hôm nay. Hãy vào app thực hiện ngay nhé để không bị lỡ ngày công! (${log.count + 1}/2)`,
            '/staff'
          ).catch(err => logger.error(`[Reminders] Failed to notify staff ${staff.id}:`, err instanceof Error ? err : undefined));
          log.count += 1;
          log.last_sent = now.toISOString();
        }
      }
    }
  }

  // ==== RULE 2: Notify idle staff about pending random bookings ====
  const pendingRandomAppointments = db.appointments.filter((a: ReminderAppt) => a.status === 'PENDING_RANDOM');
  if (pendingRandomAppointments.length > 0) {
    for (const staff of staffUsers) {
      const isPresentToday = db.attendance.some((a: ReminderAttendance) => a.staff_id === staff.id && a.date === todayStr && a.status === 'PRESENT');
      if (!isPresentToday) continue;
      const hasActiveAppointment = db.appointments.some((a: ReminderAppt) => a.staff_id === staff.id && a.status === 'ACTIVE');
      if (hasActiveAppointment) continue;
      for (const appt of pendingRandomAppointments) {
        const alreadyReminded = db.random_booking_reminders_log.some((l: ReminderLog) => l.staff_id === staff.id && l.appointment_id === appt.id);
        if (alreadyReminded) continue;
        const apptTime = format(new Date(appt.start_time), 'HH:mm');
        const apptDate = format(new Date(appt.start_time), 'dd/MM/yyyy');
        console.log(`[Reminders] Reminding free staff ${staff.full_name} about random appointment ${appt.id}`);
        await sendPushNotification(
          staff.id,
          'Nhận khách ngay bạn ơi! 💅',
          `Đang có đơn đặt lịch ngẫu nhiên vào lúc ${apptTime} ngày ${apptDate} chưa có thợ phục vụ. Hiện tại bạn đang rảnh, hãy vào nhận đơn ngay nhé!`,
          '/staff'
        ).catch(err => logger.error(`[Reminders] Failed to notify staff ${staff.id}:`, err instanceof Error ? err : undefined));
        db.random_booking_reminders_log.push({ staff_id: staff.id, appointment_id: appt.id, sent_at: now.toISOString() });
      }
    }
  }

  // ==== RULE 3: Remind if booking time has arrived but not accepted ====
  for (const appt of db.appointments) {
    const isUnaccepted = appt.status === 'CONFIRMED' || appt.status === 'PENDING_RANDOM';
    if (!isUnaccepted) continue;
    const startTime = new Date(appt.start_time);
    if (startTime <= now) {
      const alreadyLogged = db.unaccepted_booking_reminders_log.some((l: ReminderLog) => l.appointment_id === appt.id);
      if (alreadyLogged) continue;
      const apptTime = format(startTime, 'HH:mm');
      if (appt.status === 'CONFIRMED' && appt.staff_id) {
        const assignedStaff = db.users.find((u: ReminderUser) => u.id === appt.staff_id);
        console.log(`[Reminders] Reminding staff ${assignedStaff?.full_name || appt.staff_id} to accept arriving booking ${appt.id}`);
        await sendPushNotification(
          appt.staff_id,
          'Khách đang đợi kìa bạn ơi! ⏰',
          `Lịch hẹn của bạn lúc ${apptTime} hôm nay đã đến giờ thực hiện nhưng hệ thống chưa ghi nhận bạn bấm nhận đơn. Hãy nhấn bắt đầu phục vụ ngay nhé!`,
          '/staff'
          ).catch(err => logger.error(`[Reminders] Failed to notify staff ${appt.staff_id}:`, err instanceof Error ? err : undefined));
      } else if (appt.status === 'PENDING_RANDOM') {
        console.log(`[Reminders] Overdue unassigned random booking ${appt.id}. Notifying all staff.`);
        for (const staff of staffUsers) {
          await sendPushNotification(
            staff.id,
            'Lịch đặt ngẫu nhiên quá giờ! 📅',
            `Đơn khách đặt lúc ${apptTime} đã đến giờ hẹn nhưng chưa thợ nào bấm nhận đơn. Hãy vào tiệm nhận ngay phục vụ khách nhé!`,
            '/staff'
          ).catch(err => logger.error(`[Reminders] Failed to notify staff ${staff.id}:`, err instanceof Error ? err : undefined));
        }
      }
      db.unaccepted_booking_reminders_log.push({ appointment_id: appt.id, sent_at: now.toISOString() });
    }
  }

  // ==== RULE 4: Remind if staff forgot to complete an appointment (>15 mins overdue) ====
  const activeAppointments = db.appointments.filter((a: ReminderAppt) => a.status === 'ACTIVE');
  for (const appt of activeAppointments) {
    if (!appt.end_time || !appt.staff_id) continue;
    const endTime = new Date(appt.end_time);
    const fifteenMinsLater = new Date(endTime.getTime() + 15 * 60 * 1000);
    if (now >= fifteenMinsLater) {
      const alreadyLogged = db.uncompleted_booking_reminders_log.some((l: ReminderLog) => l.appointment_id === appt.id);
      if (alreadyLogged) continue;
      console.log(`[Reminders] Appointment ${appt.id} >15m overdue. Reminding staff ${appt.staff_id}`);
      await sendPushNotification(
        appt.staff_id,
        'Quên bấm hoàn thành đơn? 🤔',
        `Lịch hẹn mã #${appt.id.slice(-6).toUpperCase()} với khách đã quá 15 phút so với giờ kết thúc dự kiến. Hãy kiểm tra và bấm "Hoàn thành" trên app để ghi nhận doanh số nhé!`,
        '/staff'
      ).catch(err => logger.error(`[Reminders] Failed to send overdue reminder:`, err instanceof Error ? err : undefined));
      db.uncompleted_booking_reminders_log.push({ appointment_id: appt.id, sent_at: now.toISOString() });
    }
  }

  // Upsert logs back to Supabase
  const sb = getSupabase();
  await sb.from('attendance_reminders_log').upsert(db.attendance_reminders_log);
  await sb.from('random_booking_reminders_log').upsert(db.random_booking_reminders_log);
  await sb.from('unaccepted_booking_reminders_log').upsert(db.unaccepted_booking_reminders_log);
  await sb.from('uncompleted_booking_reminders_log').upsert(db.uncompleted_booking_reminders_log);

  console.log('[Reminders] Reminders check run complete.');
}
