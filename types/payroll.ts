export type PayrollStatus = 'DRAFT' | 'CONFIRMED' | 'PAID';

export interface PayrollRecord {
  id: string;
  staff_id: string;
  month: number;
  year: number;
  base_salary: number;
  commission_rate: number;
  commission_amount: number;
  tip_amount: number;
  bonus_amount: number;
  deduction_amount: number;
  net_salary: number;
  work_days: number;
  completed_orders: number;
  status: PayrollStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation
  staff?: {
    id: string;
    full_name: string;
    username: string;
    role: string;
  };
}

export interface PayrollSummary {
  month: number;
  year: number;
  total_staff: number;
  total_base_salary: number;
  total_commission: number;
  total_tips: number;
  total_bonuses: number;
  total_deductions: number;
  total_net_salary: number;
  total_completed_orders: number;
}

export interface CalculatePayrollInput {
  month: number;
  year: number;
}

export interface UpdatePayrollAdjustmentInput {
  id: string;
  bonus_amount?: number;
  deduction_amount?: number;
  notes?: string;
  status?: PayrollStatus;
}
