-- V3.16+ Schema Fix Migration
-- Fix all column mismatches between code and database
-- Each ALTER TABLE uses IF NOT EXISTS to be idempotent

-- Fix attendance: add note column
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS note TEXT;

-- Fix cash_register: add is_active column for soft delete
ALTER TABLE cash_register ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fix appointments: add discount_amount column for financial reports
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Fix appointment_services: add columns for per-service pricing
ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Fix seo_settings: add theme override columns (V3.8 Real-time Theme)
ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS theme_override VARCHAR(50);
ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS theme_particles_enabled BOOLEAN DEFAULT true;

-- Fix seo_settings: add mascot columns (V3.6 Interactive Mascot)
ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS mascot_enabled BOOLEAN DEFAULT true;
ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS mascot_character VARCHAR(50) DEFAULT 'min';
ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS mascot_sound BOOLEAN DEFAULT true;

-- Fix seo_articles: add columns for auto-seo (V3.12)
ALTER TABLE seo_articles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE seo_articles ADD COLUMN IF NOT EXISTS topic_source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE seo_articles ADD COLUMN IF NOT EXISTS blog_slug VARCHAR(255);
ALTER TABLE seo_articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
