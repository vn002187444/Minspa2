'use server'

import {
  createClient, getSession, revalidatePath, logAuditAction,
  hashPassword, format, startOfMonth, endOfMonth,
  checkAdminOrManager, checkAdmin, StaffInput,
} from "./_shared";

export async function getStaffs() {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from('users')
      .select('id, username, full_name, role, cccd, is_active, created_at')
      .in('role', ['STAFF', 'MANAGER'])
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    console.info('Fetched staff count:', data?.length);
    return data || [];
  } catch (error: unknown) {
    if (error != null && typeof error === 'object' && 'code' in error && (error as any).code === '42703') {
      console.warn('is_active column missing from users table, retrying query without it');
      const { data, error: err2 } = await supabase.from('users')
        .select('id, username, full_name, role, cccd, created_at')
        .in('role', ['STAFF', 'MANAGER'])
        .order('created_at', { ascending: false })
        .limit(100);
      if (err2) {
        console.error('Error fetching staff list (fallback):', err2);
        return [];
      }
      return (data || []).map(s => ({ ...s, is_active: true }));
    }
    console.error('Error fetching staff list:', error);
    return [];
  }
}

export async function createStaff(staffData: StaffInput) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const hashedPw = await hashPassword((staffData.password || '').trim());
  const { error } = await supabase.from('users').insert({
    role: staffData.role || 'STAFF',
    username: (staffData.username || '').trim().toLowerCase(),
    password_hash: hashedPw,
    full_name: (staffData.fullName || '').trim(),
    cccd: (staffData.cccd || '').trim()
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateStaff(staffId: string, staffData: StaffInput) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('users')
    .select('role, cccd')
    .eq('id', staffId)
    .single();

  const newRole = staffData.role || current?.role;
  const newCccd = staffData.cccd?.trim() ?? '';

  if (newRole === 'STAFF' && !newCccd) {
    return { success: false, error: 'CCCD là bắt buộc khi phân quyền là STAFF. Vui lòng nhập số CCCD.' };
  }

  const updates: Record<string, unknown> = {
    username: staffData.username,
    full_name: staffData.full_name,
  };

  if (staffData.role) updates.role = staffData.role;
  if (staffData.cccd !== undefined) updates.cccd = newCccd;

  const { error } = await supabase.from('users').update(updates).eq('id', staffId);

  if (!error) {
    await logAuditAction(session.user.id, "EDIT_STAFF", `Sửa thông tin nhân viên: ${staffData.full_name} (${staffData.username})`);
  }

  return { success: !error, error: error?.message };
}

export async function resetStaffPassword(staffId: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const hashedResetPw = await hashPassword('123456');
  const { error } = await supabase.from('users').update({
    password_hash: hashedResetPw
  }).eq('id', staffId);

  if (!error) {
    const { data: user } = await supabase.from('users').select('username').eq('id', staffId).single();
    await logAuditAction(session.user.id, "RESET_PASSWORD", `Reset mật khẩu nhân viên: ${user?.username || staffId}`);
  }

  return { success: !error, error: error?.message };
}

export async function getStaffDetail(staffId: string, startDateStr?: string, endDateStr?: string) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const today = new Date();

  const startMonth = startDateStr ? new Date(startDateStr).toISOString() : startOfMonth(today).toISOString();
  const endMonth = endDateStr ? new Date(endDateStr).toISOString() : endOfMonth(today).toISOString();

  try {
    const { data: appointments, error: err1 } = await supabase
      .from('appointments')
      .select(`id, total_amount, commission_amount, tip_amount, customer_id, customers(full_name), appointment_services(services(name))`)
      .eq('staff_id', staffId)
      .eq('status', 'COMPLETED')
      .gte('start_time', startMonth)
      .lte('start_time', endMonth)
      .limit(1000);

    if (err1) throw err1;

    const { data: attendance, error: err2 } = await supabase
      .from('attendance')
      .select('id, date, status, check_in_time, check_out_time')
      .eq('staff_id', staffId)
      .gte('date', format(new Date(startMonth), 'yyyy-MM-dd'))
      .lte('date', format(new Date(endMonth), 'yyyy-MM-dd'))
      .limit(100);

    if (err2) throw err2;

    let totalRevenue = 0, totalCommission = 0, totalTip = 0;
    const customerCount: Record<string, {name: string, count: number}> = {};
    const serviceCount: Record<string, number> = {};

    if (appointments) {
      appointments.forEach((app: any) => {
        totalRevenue += Number(app.total_amount) || 0;
        totalCommission += Number(app.commission_amount) || 0;
        totalTip += Number(app.tip_amount) || 0;
        if (app.customer_id) {
          if (!customerCount[app.customer_id]) customerCount[app.customer_id] = { name: app.customers?.full_name || 'Khách', count: 0 };
          customerCount[app.customer_id].count += 1;
        }
        app.appointment_services?.forEach((as: any) => {
          const sName = as.services?.name;
          if (sName) serviceCount[sName] = (serviceCount[sName] || 0) + 1;
        });
      });
    }

    const daysPresent = attendance?.filter((a: any) => a.status === 'PRESENT').length || 0;
    const daysAbsent = attendance?.filter((a: any) => a.status === 'ABSENT').length || 0;
    const topCustomers = Object.values(customerCount).sort((a, b) => b.count - a.count).slice(0, 10);
    const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => ({ name: e[0], count: e[1] }));

    return { totalRevenue, totalCommission, totalTip, daysPresent, daysAbsent, topCustomers, topServices, totalCompleted: appointments?.length || 0 };
  } catch {
    return { totalRevenue: 0, totalCommission: 0, totalTip: 0, daysPresent: 0, daysAbsent: 0, topCustomers: [], topServices: [], totalCompleted: 0 };
  }
}

export async function deleteStaffSafely(staffId: string, staffName: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  try {
    const { error: updateErr } = await supabase
      .from('users')
      .update({ is_active: false, cccd: '' })
      .eq('id', staffId);

    if (updateErr) throw updateErr;

    await logAuditAction(session.user.id, "SOFT_DELETE_STAFF", `Ẩn nhân viên: '${staffName}'`);

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: 'Đã ẩn nhân viên thành công.' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function toggleStaffActive(staffId: string, newStatus: boolean) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  try {
    const { error: updateErr } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', staffId);

    if (updateErr) throw updateErr;

    await logAuditAction(
      session.user.id,
      newStatus ? "RESTORE_STAFF" : "SOFT_DELETE_STAFF",
      `${newStatus ? 'Kích hoạt lại' : 'Vô hiệu hóa'} nhân viên ID: '${staffId}'`
    );

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: newStatus ? 'Đã kích hoạt lại nhân viên.' : 'Đã vô hiệu hóa nhân viên.' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getStaffSkills(staffId: string) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_skills')
    .select('*, services(name)')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveStaffSkill(skillData: {
  staff_id: string;
  service_id: string;
  skill_level: number;
  certificate_name?: string;
  certificate_url?: string;
  is_active: boolean;
}) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const { error } = await supabase
    .from('staff_skills')
    .upsert({
      staff_id: skillData.staff_id,
      service_id: skillData.service_id,
      skill_level: skillData.skill_level,
      certificate_name: skillData.certificate_name,
      certificate_url: skillData.certificate_url,
      is_active: skillData.is_active,
    }, { onConflict: 'staff_id,service_id' });
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function deleteStaffSkill(skillId: string) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const { error } = await supabase
    .from('staff_skills')
    .delete()
    .eq('id', skillId);
  if (error) throw error;
  revalidatePath('/admin');
  return { success: true };
}
