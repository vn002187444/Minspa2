-- Migration: Create payroll_records table
-- Date: 2026-11-19
-- Purpose: Store monthly payroll snapshots (base salary, commission, tip, bonus, deductions, net salary, attendance)

CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL CHECK (year >= 2024),
  base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.20,
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tip_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bonus_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deduction_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  work_days NUMERIC(5, 1) NOT NULL DEFAULT 0,
  completed_orders INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PAID')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CONSTRAINT payroll_records_staff_month_year_unique UNIQUE (staff_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_payroll_records_staff_month_year ON payroll_records(staff_id, month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON payroll_records(month, year);

ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_records' AND policyname = 'service_role_all_payroll'
  ) THEN
    CREATE POLICY "service_role_all_payroll" ON payroll_records
      FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_records' AND policyname = 'staff_view_own_payroll'
  ) THEN
    CREATE POLICY "staff_view_own_payroll" ON payroll_records
      FOR SELECT USING (auth.uid() = staff_id);
  END IF;
END $$;
