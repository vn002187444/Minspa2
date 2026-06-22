-- V3.12: Auto SEO Posting
-- Run this in Supabase SQL Editor

-- 1. Add columns to seo_articles
ALTER TABLE seo_articles
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS topic_source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS backlinks JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS blog_slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 2. Create auto_seo_config table (single-row config)
CREATE TABLE IF NOT EXISTS auto_seo_config (
  id BIGINT PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_day VARCHAR(10) NOT NULL DEFAULT 'THU',
  schedule_hour INTEGER NOT NULL DEFAULT 20,
  topic_pool JSONB NOT NULL DEFAULT '["nail art xu hướng 2026", "cách chăm sóc tóc tại nhà", "gội đầu dưỡng sinh thảo dược", "nail màu sắc hợp mệnh", "dịch vụ spa tại thủ đức"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default config row
INSERT INTO auto_seo_config (id, enabled)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE auto_seo_config ENABLE ROW LEVEL SECURITY;

-- Policies for auto_seo_config
CREATE POLICY "Admin can manage auto_seo_config"
  ON auto_seo_config
  FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' IN ('ADMIN', 'MANAGER'))
  WITH CHECK (auth.jwt()->>'role' IN ('ADMIN', 'MANAGER'));

-- Policy for cron (service role)
CREATE POLICY "Cron can read auto_seo_config"
  ON auto_seo_config
  FOR SELECT
  TO service_role
  USING (true);

-- 3. pg_cron: schedule SEO publish every Thursday 20:00
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_auto_seo_publish()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_url text := 'https://minhair.vercel.app';
BEGIN
  PERFORM extensions.net.http_post(
    url := app_url || '/api/cron/seo-publish',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN 'OK';
END;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_auto_seo_publish() TO service_role;
GRANT USAGE ON SCHEMA extensions TO service_role;

SELECT cron.schedule(
  'auto-seo-publish',
  '0 20 * * 4',
  $$SELECT public.trigger_auto_seo_publish()$$
);
