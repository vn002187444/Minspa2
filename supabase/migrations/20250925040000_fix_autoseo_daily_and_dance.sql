-- Fix AutoSEO: 1 bài/ngày lúc 04:00 UTC (11:00 VN) + tạo Dance Studio cron riêng
-- Chạy trong Supabase SQL Editor nếu pg_cron đã bật

-- 1. Update auto_seo_config về daily 11h VN
UPDATE auto_seo_config SET schedule_days = '["MON","TUE","WED","THU","FRI","SAT","SUN"]'::jsonb, schedule_hour = 11, updated_at = now() WHERE id = 1;

-- 2. Fix pg_cron: xóa job hourly cũ, tạo job daily 04:00 UTC
SELECT cron.unschedule('trigger-seo-publish') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='trigger-seo-publish');
SELECT cron.schedule(
  'trigger-seo-publish',
  '0 4 * * *',
  $$SELECT public.trigger_seo_publish()$$
);

-- 3. Tạo bảng riêng cho Dance Studio AutoSEO
CREATE TABLE IF NOT EXISTS auto_seo_dance_config (
  id int PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  schedule_days jsonb NOT NULL DEFAULT '["MON","TUE","WED","THU","FRI","SAT","SUN"]'::jsonb,
  schedule_hour int NOT NULL DEFAULT 12,
  topic_pool jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
INSERT INTO auto_seo_dance_config (id, enabled, schedule_days, schedule_hour, topic_pool)
VALUES (1, true, '["MON","TUE","WED","THU","FRI","SAT","SUN"]'::jsonb, 12, '["khiêu vũ hiện đại cho người mới bắt đầu tại Thủ Đức","lớp nhảy Kpop cho thiếu nhi Lavita Charm","học nhảy Zumba giảm cân tại Thủ Đức","kỹ thuật múa đương đại cơ bản","combo nhảy + fitness cho dân văn phòng Thủ Đức","lớp nhảy couple dance tại Lavita Charm","bí quyết giữ dáng với Dance Fitness","xu hướng nhảy TikTok 2026 tại Thủ Đức","lớp nhảy cho bé 5-10 tuổi tại Thủ Đức","giải phóng stress với nhảy đương đại"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Function + cron cho Dance Studio (05:00 UTC = 12:00 VN)
CREATE OR REPLACE FUNCTION public.trigger_dance_publish()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE app_url text := 'https://minhair.vercel.app';
BEGIN
  PERFORM extensions.http_post(
    url := app_url || '/api/cron/dance-publish',
    headers := '{"Content-Type": "application/json", "x-supabase-cron": "true"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN 'OK';
END;
$$;
GRANT EXECUTE ON FUNCTION public.trigger_dance_publish() TO service_role;
SELECT cron.unschedule('trigger-dance-publish') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='trigger-dance-publish');
SELECT cron.schedule(
  'trigger-dance-publish',
  '0 5 * * *',
  $$SELECT public.trigger_dance_publish()$$
);
