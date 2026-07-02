-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Remove old job if exists
SELECT cron.unschedule('auto-seo-publish');

-- 3. Schedule new job: Run every hour (0 * * * *)
-- We use net.http_post to call the Next.js API route
SELECT cron.schedule(
  'auto-seo-publish',
  '0 * * * *',
  'SELECT net.http_post(
    url := ''https://minhair.vercel.app/api/cron/seo-publish'',
    headers := ''{"Content-Type": "application/json", "x-supabase-cron": "true"}''::jsonb
  );'
);