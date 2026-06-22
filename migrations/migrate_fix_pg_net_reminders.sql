-- Fix: trigger_reminders_check() used wrong pg_net syntax
-- Old: extensions.http_post() → Correct: extensions.net.http_post()
-- This function was deployed with the broken call in migrate_p3_16_vercel_cron_to_pgcron.sql
-- The cron reminders have been dead since that migration was applied.

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

GRANT EXECUTE ON FUNCTION public.trigger_reminders_check() TO service_role;
