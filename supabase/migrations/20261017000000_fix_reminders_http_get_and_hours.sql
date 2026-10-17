-- Fix reminders cron: dùng net.http_get (route chỉ export GET → http_post trả 405)
-- + đổi lịch: mỗi 15 phút, chỉ trong giờ mở cửa 08:00–20:45 VN (01:00–13:45 UTC).
-- Không gọi ban đêm (sau 21:00 → trước 08:00 VN).
-- Giờ mở cửa thực tế 09:00–20:30 (app/page.tsx).
-- Áp dụng: Supabase SQL Editor. An toàn để chạy lại (CREATE OR REPLACE).

-- 1. Đổi method gọi endpoint từ POST -> GET (khớp handler GET trong
--    app/api/cron/reminders/route.ts). net.http_get không có tham số body.
CREATE OR REPLACE FUNCTION public.trigger_reminders_check()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE app_url text := 'https://spa.minds.io.vn';
BEGIN
  PERFORM net.http_get(
    url := app_url || '/api/cron/reminders',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb
  );
  RETURN 'OK';
END;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_reminders_check() TO service_role;
ALTER FUNCTION public.trigger_reminders_check() SET search_path = '';

-- 2. Đổi lịch: bỏ job cũ (mỗi 10 phút, chạy 24/7) và tạo job mới.
--    */15 1-13 * * * = mỗi 15 phút, từ 01:00–13:45 UTC = 08:00–20:45 giờ VN.
SELECT cron.unschedule('trigger-reminders-check')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'trigger-reminders-check');

SELECT cron.schedule(
  'trigger-reminders-check',
  '*/15 1-13 * * *',
  $$SELECT public.trigger_reminders_check()$$
);
