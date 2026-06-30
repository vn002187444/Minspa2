-- ========================================
-- P2.17: Audit log + Reminder log retention (pg_cron)
-- Chạy trong Supabase SQL Editor
-- Yêu cầu: pg_cron extension enabled
-- ========================================

-- 1. Enable pg_cron extension (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Hàm cleanup: xoá audit_logs > 90 ngày
CREATE OR REPLACE FUNCTION public.cleanup_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- 3. Hàm cleanup: xoá reminder logs > 30 ngày
CREATE OR REPLACE FUNCTION public.cleanup_reminder_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.attendance_reminders_log
  WHERE sent_at < now() - interval '30 days';
  DELETE FROM public.random_booking_reminders_log
  WHERE sent_at < now() - interval '30 days';
  DELETE FROM public.unaccepted_booking_reminders_log
  WHERE sent_at < now() - interval '30 days';
  DELETE FROM public.uncompleted_booking_reminders_log
  WHERE sent_at < now() - interval '30 days';
END;
$$;

-- 4. Schedule pg_cron jobs (chạy mỗi ngày lúc 2AM)

SELECT cron.schedule(
  'cleanup-audit-logs',      -- job name
  '0 2 * * *',               -- daily at 02:00 UTC (09:00 Vietnam)
  $$SELECT public.cleanup_audit_logs()$$
);

SELECT cron.schedule(
  'cleanup-reminder-logs',   -- job name
  '0 2 * * *',               -- daily at 02:00 UTC
  $$SELECT public.cleanup_reminder_logs()$$
);

-- 5. Kiểm tra jobs đã tạo
-- SELECT * FROM cron.job;
