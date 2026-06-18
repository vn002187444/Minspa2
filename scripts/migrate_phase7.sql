-- ========================================
-- PHASE 7 MIGRATION: P7.10 + P7.12
-- Chạy trong Supabase SQL Editor
-- Ngày: 18/06/2026
-- ========================================

-- ========================================
-- P7.10: PostgreSQL VIEW cho Commission Report
-- ========================================
CREATE OR REPLACE VIEW public.commission_report_view AS
SELECT
  a.id AS appointment_id,
  a.start_time,
  a.end_time,
  a.status,
  a.total_amount,
  a.commission_amount,
  a.tip_amount,
  a.staff_id,
  u.full_name AS staff_name,
  u.username AS staff_username,
  c.full_name AS customer_name,
  c.phone AS customer_phone,
  a.created_at
FROM public.appointments a
LEFT JOIN public.users u ON a.staff_id = u.id
LEFT JOIN public.customers c ON a.customer_id = c.id
WHERE a.status = 'COMPLETED';

-- Grant permissions
GRANT SELECT ON public.commission_report_view TO service_role;
GRANT SELECT ON public.commission_report_view TO authenticated;

-- ========================================
-- P7.12: RLS Policy cho notifications table
-- ========================================

-- 1. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users xem được notifications của mình
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    (recipient_type = 'user' AND recipient_id::text = auth.uid()::text)
    OR
    (recipient_type = 'customer' AND recipient_id::text = auth.uid()::text)
  );

-- 3. Policy: Server insert
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- 4. Policy: Server update
CREATE POLICY "Service role can update notifications"
  ON public.notifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Grant permissions
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO authenticated;

-- ========================================
-- XONG. Kiểm tra:
-- SELECT * FROM commission_report_view LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename = 'notifications';
-- ========================================
