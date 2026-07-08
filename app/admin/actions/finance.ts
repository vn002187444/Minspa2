'use server'

import {
  createClient, getSession, format, checkAdminOrManager, checkAdmin,
  CashInput, StaffPayrollInfo, PayrollStaffRow, PayrollRecord, BankInput,
} from "./_shared";

export async function getStaffPayrollInfo(): Promise<StaffPayrollInfo[]> {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('id, full_name, username, role, is_active, base_salary, bank_account, bank_name')
    .in('role', ['STAFF', 'MANAGER'])
    .order('full_name');
  return (data || []).map((u: any) => ({
    id: u.id,
    fullName: u.full_name,
    username: u.username,
    role: u.role,
    isActive: u.is_active,
    baseSalary: Number(u.base_salary) || 0,
    bankAccount: u.bank_account || null,
    bankName: u.bank_name || null,
  }));
}

export async function updateStaffSalary(staffId: string, baseSalary: number, bankAccount: string, bankName: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');
  const supabase = await createClient();
  const { error } = await supabase.from('users').update({
    base_salary: baseSalary,
    bank_account: bankAccount || null,
    bank_name: bankName || null,
  }).eq('id', staffId);
  if (error) throw error;
}

export async function calculatePayroll(periodStart: string, periodEnd: string): Promise<PayrollStaffRow[]> {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const staffs = await getStaffPayrollInfo();

  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  endDate.setHours(23, 59, 59, 999);

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  const result: PayrollStaffRow[] = [];

  for (const staff of staffs) {
    if (!staff.isActive) continue;

    const { data: appointments } = await supabase
      .from('appointments')
      .select('commission_amount, tip_amount, total_amount')
      .eq('staff_id', staff.id)
      .eq('status', 'COMPLETED')
      .gte('start_time', startISO)
      .lte('start_time', endISO);

    const { data: packages } = await supabase
      .from('customer_packages')
      .select('commission_amount')
      .eq('sold_by_staff_id', staff.id)
      .gte('purchased_at', startISO)
      .lte('purchased_at', endISO);

    const { data: attendance } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('staff_id', staff.id)
      .gte('date', periodStart)
      .lte('date', periodEnd);

    const totalCommission = (appointments || []).reduce((s, a: any) => s + Number(a.commission_amount || 0), 0);
    const totalTips = (appointments || []).reduce((s, a: any) => s + Number(a.tip_amount || 0), 0);
    const totalPackageCommission = (packages || []).reduce((s, p: any) => s + Number(p.commission_amount || 0), 0);
    const totalSales = (appointments || []).reduce((s, a: any) => s + Number(a.total_amount || 0), 0);
    const appointmentCount = (appointments || []).length;
    const absentDays = (attendance || []).filter((a: any) => a.status === 'ABSENT').length;
    const workingDays = (attendance || []).length;

    result.push({
      staffId: staff.id,
      fullName: staff.fullName,
      baseSalary: staff.baseSalary,
      totalCommission: Math.round(totalCommission),
      totalTips: Math.round(totalTips),
      totalPackageCommission: Math.round(totalPackageCommission),
      totalSales: Math.round(totalSales),
      appointmentCount,
      absentDays,
      workingDays,
    });
  }

  return result;
}

export async function getSalaryPayments(periodStart: string, periodEnd: string): Promise<PayrollRecord[]> {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from('salary_payments')
    .select('*, users!staff_id(full_name)')
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd)
    .order('created_at', { ascending: false });

  return (data || []).map((p: any) => ({
    id: p.id,
    staffId: p.staff_id,
    fullName: p.users?.full_name || '',
    periodStart: p.period_start,
    periodEnd: p.period_end,
    baseSalary: Number(p.base_salary),
    totalCommission: Number(p.total_commission),
    totalTips: Number(p.total_tips),
    totalPackageCommission: Number(p.total_package_commission),
    bonus: Number(p.bonus),
    deduction: Number(p.deduction),
    advance: Number(p.advance),
    netPay: Number(p.net_pay),
    status: p.status,
    notes: p.notes,
    paidAt: p.paid_at,
  }));
}

export async function savePayrollCalculations(
  periodStart: string,
  periodEnd: string,
  rows: PayrollStaffRow[]
) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  for (const row of rows) {
    const netPay = row.baseSalary + row.totalCommission + row.totalTips + row.totalPackageCommission;

    const { error } = await supabase.from('salary_payments').insert({
      staff_id: row.staffId,
      period_start: periodStart,
      period_end: periodEnd,
      base_salary: row.baseSalary,
      total_commission: row.totalCommission,
      total_tips: row.totalTips,
      total_package_commission: row.totalPackageCommission,
      bonus: 0,
      deduction: 0,
      advance: 0,
      net_pay: netPay,
      status: 'PENDING',
    });
    if (error) console.error(`[PAYROLL] Failed to save ${row.fullName}:`, error);
  }
}

export async function processPayrollPayment(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from('salary_payments')
    .select('*, users!staff_id(full_name)')
    .eq('id', id)
    .single();

  if (!payment) throw new Error('Không tìm thấy bản ghi lương');
  if (payment.status === 'PAID') throw new Error('Kỳ lương này đã được thanh toán');

  const fullName = (payment.users as any)?.full_name || 'Nhân viên';

  const { error: updateError } = await supabase
    .from('salary_payments')
    .update({ status: 'PAID', paid_at: new Date().toISOString(), paid_by: session.user.id })
    .eq('id', id);
  if (updateError) throw updateError;

  const { error: cashError } = await supabase.from('cash_register').insert({
    type: 'CHI',
    category: 'Chi lương',
    amount: payment.net_pay,
    description: `Lương ${fullName} - ${payment.period_start} đến ${payment.period_end}`,
    reference_type: 'salary_payment',
    reference_id: payment.id,
    recorded_by: session.user.id,
  });
  if (cashError) throw cashError;
}

export async function getCashRegisterTransactions(month?: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const now = new Date();
  const ym = month || format(now, 'yyyy-MM');
  const startISO = new Date(`${ym}-01T00:00:00+07:00`).toISOString();
  const endISO = new Date(new Date(startISO).getFullYear(), new Date(startISO).getMonth() + 1, 1).toISOString();

  const { data: rows, error } = await supabase
    .from('cash_register')
    .select('*, users(full_name)')
    .gte('recorded_at', startISO)
    .lt('recorded_at', endISO)
    .eq('is_active', true)
    .order('recorded_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  const items = (rows || []).map((r: any) => ({
    id: r.id,
    type: r.type,
    category: r.category,
    amount: r.amount,
    description: r.description,
    referenceType: r.reference_type,
    referenceId: r.reference_id,
    recordedBy: r.users?.full_name || '',
    recordedAt: r.recorded_at,
  }));

  const totalThu = items.filter((i) => i.type === 'THU').reduce((s, i) => s + i.amount, 0);
  const totalChi = items.filter((i) => i.type === 'CHI').reduce((s, i) => s + i.amount, 0);
  const balance = totalThu - totalChi;

  return { items, totalThu, totalChi, balance };
}

export async function addCashTransaction(data: CashInput) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  const { error } = await supabase.from('cash_register').insert({
    type: data.type,
    category: data.category,
    amount: data.amount,
    description: data.description || '',
    reference_type: data.reference_type || null,
    reference_id: data.reference_id || null,
    recorded_by: session.user.id,
  });

  if (error) throw error;
}

export async function deleteCashTransaction(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  await supabase.from('cash_register').update({ is_active: false }).eq('id', id);
}

export async function getBankSettings() {
  const session = await getSession();
  if (!session) {
    throw new Error('Chưa đăng nhập');
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('bank_settings').select('bank_id, bank_name, account_number, account_owner').eq('id', 1).single();
    if (error) throw error;
    if (data) {
      return {
        bank_id: data.bank_id,
        bank_name: data.bank_name,
        account_number: data.account_number,
        account_owner: data.account_owner,
      };
    }
  } catch (e: unknown) {
    console.error(e);
  }
  return { bank_id: 'vcb', bank_name: 'Vietcombank', account_number: '', account_owner: '' };
}

export async function saveBankSettings(payload: BankInput) {
  await checkAdmin();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('bank_settings').upsert({
      id: 1,
      bank_id: payload.bank_id,
      bank_name: payload.bank_name,
      account_number: payload.account_number,
      account_owner: payload.account_owner,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
