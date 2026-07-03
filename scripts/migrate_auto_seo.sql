-- ========================================
-- Auto SEO: Complete DB setup
-- Run in Supabase SQL Editor (1 lần duy nhất)
-- ========================================

-- 1. Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create/update auto_seo_config table
CREATE TABLE IF NOT EXISTS auto_seo_config (
  id BIGINT PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_day VARCHAR(10) DEFAULT 'THU',
  schedule_hour INTEGER NOT NULL DEFAULT 20,
  schedule_days JSONB NOT NULL DEFAULT '["THU"]'::jsonb,
  topic_pool JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (id = 1)
);

-- 3. Add schedule_days column if missing (V3.13 migration)
ALTER TABLE auto_seo_config
  ADD COLUMN IF NOT EXISTS schedule_days JSONB NOT NULL DEFAULT '["THU"]'::jsonb;

-- 4. Migrate existing single-day config to array
UPDATE auto_seo_config
  SET schedule_days = to_jsonb(ARRAY[schedule_day])
  WHERE schedule_days IS NULL AND schedule_day IS NOT NULL;

-- 5. Insert default row if empty
INSERT INTO auto_seo_config (id, enabled, schedule_day, schedule_hour, schedule_days, topic_pool)
VALUES (1, false, 'THU', 20, '["THU"]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 6. RLS
ALTER TABLE auto_seo_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON auto_seo_config;
CREATE POLICY "service_role_all" ON auto_seo_config
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON auto_seo_config TO service_role;
GRANT SELECT ON auto_seo_config TO anon, authenticated;

-- 7. Create function and cron schedule
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

GRANT EXECUTE ON FUNCTION public.trigger_seo_publish() TO service_role;

-- Remove old schedule if exists, then create new
SELECT cron.unschedule('trigger-seo-publish');
SELECT cron.schedule(
  'trigger-seo-publish',
  '0 * * * *',
  $$SELECT public.trigger_seo_publish()$$
);
