'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { PayrollRecord, PayrollSummary, UpdatePayrollAdjustmentInput } from "@/types/payroll";

const DEFAULT_BASE_SALARY = 5000000; // 5,000,000 VND standard base salary
const COMMISSION_RATE = 0.20; // 20% on completed orders

export async function calculateAndSaveMonthlyPayroll(month: number, year: number): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized: Chỉ Admin và Manager mới có quyền tính bảng lương' };
    }

    const supabase = await createClient();

    // 1. Fetch all active staff
    const { data: staffList, error: staffError } = await supabase
      .from('users')
      .select('id, full_name, username, role')
      .in('role', ['STAFF', 'MANAGER'])
      .eq('is_active', true);

    if (staffError || !staffList) {
      logger.error('[Payroll] Failed to fetch staff list', staffError);
      return { success: false, error: 'Không thể lấy danh sách nhân viên' };
    }

    // Date range for the requested month
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
    const datePrefix = `${year}-${month.toString().padStart(2, '0')}`;

    // 2. Fetch completed appointments for this month
    const { data: completedAppts, error: apptError } = await supabase
      .from('appointments')
      .select('id, staff_id, total_price, start_time, tip_amount')
      .eq('status', 'COMPLETED')
      .gte('start_time', startOfMonth)
      .lte('start_time', endOfMonth);

    if (apptError) {
      logger.error('[Payroll] Failed to fetch completed appointments', apptError);
    }

    // 3. Fetch attendance records for this month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const { data: attendanceList, error: attError } = await supabase
      .from('attendance')
      .select('staff_id, date, status')
      .eq('status', 'PRESENT')
      .gte('date', `${datePrefix}-01`)
      .lte('date', `${datePrefix}-${String(lastDayOfMonth).padStart(2, '0')}`);

    if (attError) {
      logger.error('[Payroll] Failed to fetch attendance', attError);
    }

    // 4. Fetch existing payroll snapshots to preserve custom bonus/deduction/notes
    const { data: existingRecords } = await supabase
      .from('payroll_records')
      .select('id, staff_id, bonus_amount, deduction_amount, notes, status, base_salary')
      .eq('month', month)
      .eq('year', year);

    const existingMap = new Map((existingRecords || []).map(r => [r.staff_id, r]));

    // 5. Calculate for each staff
    const recordsToUpsert = [];

    for (const staff of staffList) {
      const staffAppts = (completedAppts || []).filter(a => a.staff_id === staff.id);
      const completedOrders = staffAppts.length;

      // Sum service total for commission
      const totalRevenue = staffAppts.reduce((sum, a) => sum + (Number(a.total_price) || 0), 0);
      const commissionAmount = Math.round(totalRevenue * COMMISSION_RATE);

      // Sum tips
      const tipAmount = staffAppts.reduce((sum, a) => sum + (Number(a.tip_amount) || 0), 0);

      // Work days from attendance
      const staffWorkDays = new Set((attendanceList || []).filter(a => a.staff_id === staff.id).map(a => a.date)).size;

      // Preserve existing manual adjustments
      const existing = existingMap.get(staff.id);
      const baseSalary = existing?.base_salary ? Number(existing.base_salary) : DEFAULT_BASE_SALARY;
      const bonusAmount = existing?.bonus_amount ? Number(existing.bonus_amount) : 0;
      const deductionAmount = existing?.deduction_amount ? Number(existing.deduction_amount) : 0;
      const status = existing?.status || 'DRAFT';
      const notes = existing?.notes || null;

      // Net salary = Base + Commission (20%) + Tip + Bonus - Deduction
      const netSalary = Math.max(0, baseSalary + commissionAmount + tipAmount + bonusAmount - deductionAmount);

      recordsToUpsert.push({
        staff_id: staff.id,
        month,
        year,
        base_salary: baseSalary,
        commission_rate: COMMISSION_RATE,
        commission_amount: commissionAmount,
        tip_amount: tipAmount,
        bonus_amount: bonusAmount,
        deduction_amount: deductionAmount,
        net_salary: netSalary,
        work_days: staffWorkDays,
        completed_orders: completedOrders,
        status,
        notes,
        updated_at: new Date().toISOString()
      });
    }

    if (recordsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('payroll_records')
        .upsert(recordsToUpsert, { onConflict: 'staff_id,month,year' });

      if (upsertError) {
        logger.error('[Payroll] Failed to upsert payroll records', upsertError);
        return { success: false, error: 'Lỗi lưu bảng lương: ' + upsertError.message };
      }
    }

    revalidatePath('/admin');
    return { success: true, count: recordsToUpsert.length };
  } catch (err) {
    logger.error('[Payroll] calculateAndSaveMonthlyPayroll exception', err instanceof Error ? err : new Error(String(err)));
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getMonthlyPayroll(month: number, year: number): Promise<{
  success: boolean;
  records: PayrollRecord[];
  summary: PayrollSummary | null;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, records: [], summary: null, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Fetch payroll records for this month
    let { data: records, error } = await supabase
      .from('payroll_records')
      .select(`
        id, staff_id, month, year, base_salary, commission_rate,
        commission_amount, tip_amount, bonus_amount, deduction_amount,
        net_salary, work_days, completed_orders, status, paid_at,
        notes, created_at, updated_at,
        users!staff_id ( id, full_name, username, role )
      `)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('[Payroll] Failed to get payroll records', error);
      return { success: false, records: [], summary: null, error: error.message };
    }

    // If no records yet, auto-generate initial snapshot
    if (!records || records.length === 0) {
      const calcRes = await calculateAndSaveMonthlyPayroll(month, year);
      if (calcRes.success) {
        const refetch = await supabase
          .from('payroll_records')
          .select(`
            id, staff_id, month, year, base_salary, commission_rate,
            commission_amount, tip_amount, bonus_amount, deduction_amount,
            net_salary, work_days, completed_orders, status, paid_at,
            notes, created_at, updated_at,
            users!staff_id ( id, full_name, username, role )
          `)
          .eq('month', month)
          .eq('year', year)
          .order('created_at', { ascending: true });

        records = refetch.data || [];
      }
    }

    const formattedRecords: PayrollRecord[] = (records || []).map(r => ({
      ...r,
      base_salary: Number(r.base_salary),
      commission_rate: Number(r.commission_rate),
      commission_amount: Number(r.commission_amount),
      tip_amount: Number(r.tip_amount),
      bonus_amount: Number(r.bonus_amount),
      deduction_amount: Number(r.deduction_amount),
      net_salary: Number(r.net_salary),
      work_days: Number(r.work_days),
      completed_orders: Number(r.completed_orders),
      staff: (r as any).users ? {
        id: (r as any).users.id,
        full_name: (r as any).users.full_name,
        username: (r as any).users.username,
        role: (r as any).users.role,
      } : undefined
    }));

    // Build summary
    const summary: PayrollSummary = {
      month,
      year,
      total_staff: formattedRecords.length,
      total_base_salary: formattedRecords.reduce((sum, r) => sum + r.base_salary, 0),
      total_commission: formattedRecords.reduce((sum, r) => sum + r.commission_amount, 0),
      total_tips: formattedRecords.reduce((sum, r) => sum + r.tip_amount, 0),
      total_bonuses: formattedRecords.reduce((sum, r) => sum + r.bonus_amount, 0),
      total_deductions: formattedRecords.reduce((sum, r) => sum + r.deduction_amount, 0),
      total_net_salary: formattedRecords.reduce((sum, r) => sum + r.net_salary, 0),
      total_completed_orders: formattedRecords.reduce((sum, r) => sum + r.completed_orders, 0),
    };

    return { success: true, records: formattedRecords, summary };
  } catch (err) {
    logger.error('[Payroll] getMonthlyPayroll exception', err instanceof Error ? err : new Error(String(err)));
    return { success: false, records: [], summary: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updatePayrollAdjustment(input: UpdatePayrollAdjustmentInput): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Fetch existing record to recompute net salary
    const { data: record, error: fetchErr } = await supabase
      .from('payroll_records')
      .select('*')
      .eq('id', input.id)
      .single();

    if (fetchErr || !record) {
      return { success: false, error: 'Không tìm thấy bản ghi lương' };
    }

    const baseSalary = Number(record.base_salary);
    const commissionAmount = Number(record.commission_amount);
    const tipAmount = Number(record.tip_amount);
    const bonusAmount = input.bonus_amount !== undefined ? Number(input.bonus_amount) : Number(record.bonus_amount);
    const deductionAmount = input.deduction_amount !== undefined ? Number(input.deduction_amount) : Number(record.deduction_amount);
    const notes = input.notes !== undefined ? input.notes : record.notes;
    const status = input.status || record.status;
    const paidAt = status === 'PAID' ? new Date().toISOString() : record.paid_at;

    const netSalary = Math.max(0, baseSalary + commissionAmount + tipAmount + bonusAmount - deductionAmount);

    const { error: updateErr } = await supabase
      .from('payroll_records')
      .update({
        bonus_amount: bonusAmount,
        deduction_amount: deductionAmount,
        net_salary: netSalary,
        notes,
        status,
        paid_at: paidAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', input.id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    logger.error('[Payroll] updatePayrollAdjustment exception', err instanceof Error ? err : new Error(String(err)));
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function generatePayrollExcelBase64(month: number, year: number): Promise<{ success: boolean; base64?: string; filename?: string; error?: string }> {
  try {
    const ExcelJS = await import('exceljs');
    const { records, summary } = await getMonthlyPayroll(month, year);

    if (!records || records.length === 0) {
      return { success: false, error: 'Không có dữ liệu bảng lương tháng này' };
    }

    const workbook = new ExcelJS.default.Workbook();
    workbook.creator = 'Min Nail & Hair Salon';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Bảng Lương T${month}-${year}`);

    // Title
    sheet.mergeCells('A1:M1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `MIN NAIL & HAIR SALON - BẢNG LƯƠNG THÁNG ${month}/${year}`;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF832729' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;

    // Headers
    const headers = [
      'STT', 'Mã NV', 'Họ Và Tên', 'Ngày Công', 'Đơn Hoàn Thành',
      'Lương Cứng', 'Hoa Hồng (20%)', 'Tiền Tip', 'Thưởng', 'Phạt/Ứng', 'Thực Nhận', 'Trạng Thái', 'Ghi Chú'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF832729' }
    };
    headerRow.height = 25;

    // Data rows
    records.forEach((r, idx) => {
      const row = sheet.addRow([
        idx + 1,
        r.staff?.username || 'N/A',
        r.staff?.full_name || 'N/A',
        r.work_days,
        r.completed_orders,
        r.base_salary,
        r.commission_amount,
        r.tip_amount,
        r.bonus_amount,
        r.deduction_amount,
        r.net_salary,
        r.status === 'PAID' ? 'ĐÃ CHI TRẢ' : (r.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : 'TẠM TÍNH'),
        r.notes || ''
      ]);

      // Format currency
      [6, 7, 8, 9, 10, 11].forEach(colIndex => {
        row.getCell(colIndex).numFmt = '#,##0 "₫"';
      });
    });

    // Summary Row
    if (summary) {
      const sumRow = sheet.addRow([
        '', '', 'TỔNG CỘNG', '', summary.total_completed_orders,
        summary.total_base_salary, summary.total_commission, summary.total_tips,
        summary.total_bonuses, summary.total_deductions, summary.total_net_salary, '', ''
      ]);
      sumRow.font = { bold: true };
      [6, 7, 8, 9, 10, 11].forEach(colIndex => {
        sumRow.getCell(colIndex).numFmt = '#,##0 "₫"';
      });
    }

    // Auto fit column width
    sheet.columns.forEach(col => {
      let maxLen = 12;
      col.eachCell?.({ includeEmpty: false }, cell => {
        const val = cell.value ? cell.value.toString() : '';
        if (val.length > maxLen) maxLen = Math.min(val.length + 3, 35);
      });
      col.width = maxLen;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const filename = `Bang_Luong_Min_Nail_Hair_T${month}_${year}.xlsx`;

    return { success: true, base64, filename };
  } catch (err) {
    logger.error('[Payroll] generatePayrollExcelBase64 exception', err instanceof Error ? err : new Error(String(err)));
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
