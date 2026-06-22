-- ========================================
-- P3.16: Migrate Vercel cron → Supabase pg_cron + pg_net
-- Chạy trong Supabase SQL Editor
-- Yêu cầu: pg_cron + pg_net extensions enabled
-- ========================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Tạo function gọi reminders endpoint
CREATE OR REPLACE FUNCTION public.trigger_reminders_check()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_url text := 'https://minhair.vercel.app';
BEGIN
  PERFORM extensions.net.http_post(
    url := app_url || '/api/cron/reminders',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN 'OK';
END;
$$;

-- 3. Grant
GRANT EXECUTE ON FUNCTION public.trigger_reminders_check() TO service_role;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- 4. Schedule: mỗi 10 phút
SELECT cron.schedule(
  'trigger-reminders-check',
  '*/10 * * * *',
  $$SELECT public.trigger_reminders_check()$$
);
