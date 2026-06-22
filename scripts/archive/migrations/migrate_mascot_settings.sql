-- Migration: Thêm cột mascot settings vào seo_settings
-- V3.6 — Interactive Mascot

ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS mascot_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS mascot_character VARCHAR(20) DEFAULT 'min';
ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS mascot_sound BOOLEAN DEFAULT TRUE;
