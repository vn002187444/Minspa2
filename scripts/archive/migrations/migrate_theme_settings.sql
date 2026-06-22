-- Migration: Thêm cột theme settings vào seo_settings
-- V3.8 — Real-time Theme (Theo mùa + Particles)

ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS theme_override VARCHAR(20) DEFAULT NULL;
ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS theme_particles_enabled BOOLEAN DEFAULT TRUE;
