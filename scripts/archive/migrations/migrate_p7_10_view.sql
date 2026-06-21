-- ========================================
-- P7.10: PostgreSQL VIEW cho Commission Report
-- Chạy trong Supabase SQL Editor
-- ========================================

-- VIEW: commission_report_view
-- Giảm CPU cho aggregation queries bằng cách cache kết quả
-- Sử dụng: SELECT * FROM commission_report_view WHERE staff_id = 'xxx' AND start_time >= '2026-06-01';

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

-- Index cho performance (trên underlying tables)
-- Đã có: idx_appointments_start_time_status, idx_users_is_active
