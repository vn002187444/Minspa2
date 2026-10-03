-- Fix pg_cron trigger functions: pg_net exposes http_post in schema `net`,
-- NOT `extensions` (extension lives in `extensions`, functions live in `net`).
-- Symptom (2026-10-02/03): cron.job_run_details showed daily failures:
--   "function extensions.http_post(...) does not exist" for trigger-seo-publish
--   (jobid 8) and trigger-dance-publish (jobid 9), plus
--   "cross-database references are not implemented: extensions.net.http_post"
--   for trigger-reminders-check (jobid 4, every 10 min).
-- Combined with the removal of Vercel Crons (the only working trigger),
-- Auto SEO / Dance / Reminders all stopped firing.
-- Applied to production 2026-10-03. Safe to re-run (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public.trigger_seo_publish()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE app_url text := 'https://minhair.vercel.app';
BEGIN
  PERFORM net.http_post(
    url := app_url || '/api/cron/seo-publish',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN 'OK';
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_dance_publish()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE app_url text := 'https://minhair.vercel.app';
BEGIN
  PERFORM net.http_post(
    url := app_url || '/api/cron/dance-publish',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN 'OK';
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_reminders_check()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE app_url text := 'https://minhair.vercel.app';
BEGIN
  PERFORM net.http_post(
    url := app_url || '/api/cron/reminders',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN 'OK';
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_auto_seo_publish()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE app_url text := 'https://minhair.vercel.app';
BEGIN
  PERFORM net.http_post(
    url := app_url || '/api/cron/seo-publish',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN 'OK';
END;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_seo_publish() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_dance_publish() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_reminders_check() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_auto_seo_publish() TO service_role;

ALTER FUNCTION public.trigger_seo_publish() SET search_path = '';
ALTER FUNCTION public.trigger_dance_publish() SET search_path = '';
ALTER FUNCTION public.trigger_reminders_check() SET search_path = '';
ALTER FUNCTION public.trigger_auto_seo_publish() SET search_path = '';
