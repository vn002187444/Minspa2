-- ========================================
-- V3.13: Auto SEO - multiple schedule days
-- ========================================

ALTER TABLE auto_seo_config
  ADD COLUMN IF NOT EXISTS schedule_days JSONB NOT NULL DEFAULT '["THU"]'::jsonb;

-- Migrate existing single-day config to new array format
UPDATE auto_seo_config
  SET schedule_days = to_jsonb(ARRAY[schedule_day])
  WHERE schedule_days IS NULL AND schedule_day IS NOT NULL;

-- Add check constraint: must be non-empty array of valid day codes
ALTER TABLE auto_seo_config
  DROP CONSTRAINT IF EXISTS auto_seo_config_schedule_days_check;

ALTER TABLE auto_seo_config
  ADD CONSTRAINT auto_seo_config_schedule_days_check
  CHECK (
    jsonb_typeof(schedule_days) = 'array'
    AND jsonb_array_length(schedule_days) > 0
    AND schedule_days <@ '["MON","TUE","WED","THU","FRI","SAT","SUN"]'::jsonb
  );
