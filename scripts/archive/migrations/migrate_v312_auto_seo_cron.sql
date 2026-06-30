-- ========================================
-- V3.12: Auto SEO publish via pg_cron + pg_net
-- Chạy trong Supabase SQL Editor
-- Yêu cầu: pg_cron + pg_net extensions enabled
-- ========================================

-- 1. Enable extensions (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Tạo function gọi seo-publish endpoint
CREATE OR REPLACE FUNCTION public.trigger_seo_publish()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_url text := 'https://minhair.vercel.app';
BEGIN
  PERFORM extensions.http_post(
    url := app_url || '/api/cron/seo-publish',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN 'OK';
END;
$$;

-- 3. Grant
GRANT EXECUTE ON FUNCTION public.trigger_seo_publish() TO service_role;

-- 4. Schedule: mỗi giờ ở phút 0
-- runAutoSeo() kiểm tra schedule_day + schedule_hour từ auto_seo_config
SELECT cron.schedule(
  'trigger-seo-publish',
  '0 * * * *',
  $$SELECT public.trigger_seo_publish()$$
);
