'use server'

import {
  createClient, getSession, logAuditAction, checkAdmin,
  checkAdminOrManager, getBaseUrl,
} from "./_shared";
import { logger } from "@/lib/logger";

export async function getFilteredAppointments(filters: {
  status?: string;
  dateRange?: 'today' | 'week' | 'month' | 'custom' | 'all';
  startDate?: string;
  endDate?: string;
}) {
  await checkAdminOrManager();
  const supabase = await createClient();

  let query = supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      total_amount,
      commission_amount,
      tip_amount,
      created_at,
      customers ( full_name, phone ),
      users!appointments_staff_id_fkey ( id, full_name, username ),
      appointment_services (
        services ( id, name, price )
      ),
      reviews (
        id,
        rating,
        quick_tags,
        comment,
        created_at
      )
    `);

  if (filters.status && filters.status !== 'ALL') {
    if (filters.status === 'PENDING') {
      query = query.in('status', ['PENDING_RANDOM', 'CONFIRMED']);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters.dateRange && filters.dateRange !== 'all') {
    const today = new Date();
    const todayVNStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(today);

    let startRange = '';
    let endRange = '';

    if (filters.dateRange === 'today') {
      startRange = new Date(`${todayVNStr}T00:00:00+07:00`).toISOString();
      endRange = new Date(`${todayVNStr}T23:59:59.999+07:00`).toISOString();
    } else if (filters.dateRange === 'week') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeekDate = new Date(now.setDate(diff));
      startOfWeekDate.setHours(0, 0, 0, 0);
      startRange = startOfWeekDate.toISOString();
      endRange = new Date().toISOString();
    } else if (filters.dateRange === 'month') {
      const startObj = new Date(today.getFullYear(), today.getMonth(), 1);
      startObj.setHours(0,0,0,0);
      startRange = startObj.toISOString();
      endRange = new Date().toISOString();
    } else if (filters.dateRange === 'custom') {
      if (filters.startDate) {
        const startObj = new Date(filters.startDate);
        startObj.setHours(0,0,0,0);
        startRange = startObj.toISOString();
      }
      if (filters.endDate) {
        const endObj = new Date(filters.endDate);
        endObj.setHours(23,59,59,999);
        endRange = endObj.toISOString();
      }
    }

    if (startRange) {
      query = query.gte('start_time', startRange);
    }
    if (endRange) {
      query = query.lte('start_time', endRange);
    }
  }

  const { data, error } = await query.order('start_time', { ascending: false }).limit(1000);
  if (error) {
    logger.error('getFilteredAppointments Error:', error instanceof Error ? error : undefined);
    return [];
  }
  return data || [];
}

export async function deleteAppointment(appointmentId: string) {
  await checkAdmin();
  const supabase = await createClient();
  const session = await getSession();

  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) throw error;

    await logAuditAction(session!.user.id, "DELETE_APPOINTMENT", `Xóa vĩnh viễn lịch hẹn ID: ${appointmentId}`);
    return { success: true };
  } catch (error: unknown) {
    logger.error('deleteAppointment Error:', error instanceof Error ? error : undefined);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function adminUpdateTip(appointmentId: string, newTipAmount: number) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return { success: false, error: 'Chỉ admin mới có quyền này.' };
  }

  const supabase = await createClient();

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, tip_amount, status, start_time')
    .eq('id', appointmentId)
    .single();

  if (!appt) return { success: false, error: 'Không tìm thấy đơn hàng.' };
  if (appt.status !== 'COMPLETED') return { success: false, error: 'Chỉ được sửa tip cho đơn đã hoàn thành.' };

  const oldTip = appt.tip_amount;

  const { error } = await supabase
    .from('appointments')
    .update({ tip_amount: newTipAmount })
    .eq('id', appointmentId);

  if (error) return { success: false, error: error.message };

  logAuditAction(session.user.id, 'EDIT_TIP',
    `Admin sửa tip đơn '${appointmentId}': ${oldTip}đ → ${newTipAmount}đ`
  ).catch(e => logger.error('[Audit] Failed to log tip edit', e));

  return { success: true, oldTip, newTip: newTipAmount };
}

export async function getCustomerByPhone(phone: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase.from('customers').select('id, full_name, phone').eq('phone', phone);
  if (error) {
    logger.error('[Database] Failed to fetch customer by phone', error instanceof Error ? error : undefined, { phone });
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0];
}

export async function getAttendanceLogs(startDate: string, endDate: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id, staff_id, date, status, check_in_time, check_out_time,
      users!attendance_staff_id_fkey(full_name, username)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .limit(1000);

  if (error) {
    logger.error('getAttendanceLogs error:', error instanceof Error ? error : undefined);
    return [];
  }

  return data || [];
}

export async function getSystemHealth() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return { status: res.ok ? 'ok' : 'unhealthy', ...data };
  } catch (e: unknown) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function triggerCronJob(jobName: 'reminders' | 'marketing' | 'auto_assign' | 'seo_publish') {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const baseUrl = getBaseUrl();
  const endpoints: Record<string, string> = {
    reminders: `${baseUrl}/api/cron/reminders`,
    marketing: `${baseUrl}/api/cron/marketing`,
    auto_assign: `${baseUrl}/api/cron/auto-assign`,
    seo_publish: `${baseUrl}/api/cron/seo-publish`,
  };

  const headers: Record<string, string> = {};
  if (process.env.CRON_SECRET) {
    headers['authorization'] = `Bearer ${process.env.CRON_SECRET}`;
  }

  try {
    const res = await fetch(endpoints[jobName], {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Server error (${res.status}): ${text.substring(0, 200)}` };
    }
    const data = await res.json();
    return { success: true, ...data };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getCronJobStatuses() {
  const supabase = await createClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const jobs = [
    { name: 'reminders', label: 'Nhắc lịch hẹn' },
    { name: 'marketing', label: 'Marketing tự động' },
    { name: 'auto_assign', label: 'Tự động phân ca' },
    { name: 'background_worker', label: 'Background Worker' },
  ];

  const results: any[] = [];
  for (const job of jobs) {
    const { data: logs } = await supabase
      .from('cron_job_logs')
      .select('started_at, finished_at, success, error')
      .eq('job_name', job.name)
      .gte('started_at', oneDayAgo)
      .order('started_at', { ascending: false })
      .limit(1);

    results.push({
      name: job.name,
      label: job.label,
      lastRun: logs && logs.length > 0 ? logs[0] : null,
    });
  }

  return results;
}

export async function createManualNotification(recipientRole: string, title: string, body: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const supabase = await createClient();
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .in('role', recipientRole === 'ALL' ? ['ADMIN', 'MANAGER', 'STAFF'] : [recipientRole])
    .eq('is_active', true)
    .limit(500);

  if (!users || users.length === 0) return { success: false, error: 'Không tìm thấy người nhận' };

  const notifications = users.map((u: { id: string }) => ({
    recipient_type: 'user',
    recipient_id: u.id,
    title,
    content: body,
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) return { success: false, error: error.message };

  await logAuditAction(session.user.id, "SEND_NOTIFICATION", `Gửi thông báo "${title}" cho ${users.length} người dùng (${recipientRole})`);
  return { success: true, count: notifications.length };
}

export async function getAdminSessionInfo() {
  const session = await getSession();
  if (!session) return null;
  return session.user;
}

export async function backupDatabase() {
  await checkAdmin();
  const supabase = await createClient();
  const lines: string[] = [];
  const now = new Date().toISOString();

  const BACKUP_TABLES = [
    'users', 'customers', 'services', 'treatment_packages', 'staff_skills',
    'bank_settings', 'banner_settings', 'seo_settings', 'auto_seo_config',
    'ai_cache', 'rate_limits', 'slot_limits',
    'appointments', 'customer_packages', 'reviews', 'blogs', 'seo_articles',
    'notifications', 'tasks', 'cash_register', 'appointment_services',
    'package_usage_logs', 'audit_logs', 'blog_views', 'blog_stats',
    'attendance', 'time_slot_locks', 'auto_assign_logs', 'cron_job_logs',
    'background_tasks', 'salary_payments',
    'attendance_reminders_log', 'random_booking_reminders_log',
    'unaccepted_booking_reminders_log', 'uncompleted_booking_reminders_log',
  ];

  lines.push('-- Min Nail & Hair Database Backup');
  lines.push(`-- Generated: ${now}`);
  lines.push('-- ================================================');
  lines.push('');

  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      lines.push(`-- Skipping ${table}: ${error.message}`);
      continue;
    }
    if (!data || data.length === 0) {
      lines.push(`-- ${table}: 0 rows`);
      continue;
    }
    lines.push(`-- ${table}: ${data.length} rows`);
    for (const row of data) {
      const cols = Object.keys(row);
      const vals = cols.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (typeof v === 'number') return String(v);
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      lines.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
    }
    lines.push('');
  }

  return { success: true, sql: lines.join('\n'), count: BACKUP_TABLES.length } as const;
}

export async function getTasks(filters?: { assigneeId?: string; status?: string; taskType?: string; search?: string }) {
  await checkAdminOrManager();
  const supabase = await createClient();
  let query = supabase
    .from('tasks')
    .select('*, assignee:users!assignee_id(id, full_name), creator:users!created_by(id, full_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.assigneeId) query = query.eq('assignee_id', filters.assigneeId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.taskType) query = query.eq('task_type', filters.taskType);
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

  const { data } = await query;
  return data || [];
}

export async function getTaskStats() {
  await checkAdminOrManager();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { count: total } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
  const { count: pending } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
  const { count: inProgress } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS');
  const { count: completed } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
  const { count: overdue } = await supabase.from('tasks').select('*', { count: 'exact', head: true })
    .not('status', 'in', '("COMPLETED","CANCELLED")')
    .lt('deadline', now);

  return { total: total || 0, pending: pending || 0, inProgress: inProgress || 0, completed: completed || 0, overdue: overdue || 0 };
}

export async function getTasksForStaff() {
  const session = await getSession();
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'MANAGER')) {
    return [];
  }
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from('tasks')
    .select('*, creator:users!created_by(id, full_name)')
    .or(`assignee_id.eq.${session.user.id},assignee_type.eq.all`)
    .not('status', 'in', '("CANCELLED")')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  return data || [];
}

export async function createTask(taskData: {
  title: string;
  description?: string;
  taskType: 'daily' | 'one_time';
  assigneeId?: string | null;
  assigneeType: 'specific' | 'all';
  deadline?: string;
  timeSlot?: string;
  priority?: string;
}) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('tasks').insert({
    title: taskData.title,
    description: taskData.description || null,
    task_type: taskData.taskType,
    assignee_id: taskData.assigneeType === 'specific' ? taskData.assigneeId : null,
    assignee_type: taskData.assigneeType,
    deadline: taskData.deadline || null,
    time_slot: taskData.timeSlot || null,
    priority: taskData.priority || 'medium',
    created_by: session.user.id,
  });

  if (error) return { success: false, error: error.message };
  logAuditAction(session.user.id, 'CREATE_TASK', `Tạo công việc: ${taskData.title}`);
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = await createClient();
  const updateData: Record<string, any> = { status };
  if (status === 'COMPLETED') {
    updateData.completed_at = new Date().toISOString();
  }
  updateData.updated_at = new Date().toISOString();

  const { data: task } = await supabase.from('tasks').select('assignee_id, title').eq('id', taskId).single();
  if (!task) return { success: false, error: 'Không tìm thấy công việc' };

  if (session.user.role === 'STAFF' && task.assignee_id !== session.user.id) {
    return { success: false, error: 'Bạn không có quyền cập nhật công việc này' };
  }

  const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
  if (error) return { success: false, error: error.message };

  if (status === 'COMPLETED' || status === 'REJECTED') {
    const { data: admins } = await supabase
      .from('users').select('id').in('role', ['ADMIN', 'MANAGER']).eq('is_active', true);
    for (const admin of (admins || [])) {
      const notifTitle = status === 'COMPLETED' ? '✅ Nhân viên hoàn thành việc' : '❌ Nhân viên từ chối việc';
      const notifBody = `Công việc "${task.title}" đã được cập nhật: ${status}`;
      void supabase.from('notifications').insert({
        recipient_type: 'user', recipient_id: admin.id,
        title: notifTitle, content: notifBody, link: '/admin?tab=TASKS',
      }).then(() => {}, () => {});
    }
  }

  logAuditAction(session.user.id, 'UPDATE_TASK', `Cập nhật công việc '${task.title}' → ${status}`);
  return { success: true };
}

export async function deleteTask(taskId: string) {
  await checkAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', taskId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function cloneDailyTasks() {
  await checkAdminOrManager();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: yesterdayTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_type', 'daily')
    .lt('created_at', todayStart.toISOString())
    .gte('created_at', new Date(todayStart.getTime() - 86400000).toISOString());

  if (!yesterdayTasks || yesterdayTasks.length === 0) return { success: true, cloned: 0 };

  let cloned = 0;
  for (const task of yesterdayTasks) {
    const { error } = await supabase.from('tasks').insert({
      title: task.title,
      description: task.description,
      task_type: 'daily',
      assignee_id: task.assignee_id,
      assignee_type: task.assignee_type,
      deadline: task.deadline,
      time_slot: task.time_slot,
      priority: task.priority,
      created_by: task.created_by,
      original_task_id: task.original_task_id || task.id,
    });
    if (!error) cloned++;
  }

  return { success: true, cloned };
}
