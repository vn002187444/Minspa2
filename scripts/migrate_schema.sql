-- Comprehensive schema migration
-- Chạy toàn bộ file này trong Supabase SQL Editor (Dashboard → SQL Editor)
-- 
-- So sánh database.sql với cấu trúc thực tế, phát hiện thiếu 16 cột trên 7 bảng.
-- Bổ sung thêm bảng audit_logs (chưa có trong database.sql)

-- ========================================
-- 0. audit_logs (bảng bị thiếu hoàn toàn)
-- ========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ========================================
-- 0a. seo_settings (bảng bị thiếu hoàn toàn)
-- ========================================
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  page_title VARCHAR(255) NOT NULL DEFAULT '',
  meta_description TEXT DEFAULT '',
  meta_keywords TEXT DEFAULT '',
  og_image_url VARCHAR(500) DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CHECK (id = 1)
);

INSERT INTO public.seo_settings (id, page_title, meta_description, meta_keywords, og_image_url)
VALUES (1, 'Min Nail & Hair', 'Tiệm gội đầu dưỡng sinh thảo dược.', 'gội đầu, nail, hair', '/og-placeholder.jpg')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 0b. seo_articles (bảng bị thiếu hoàn toàn)
-- ========================================
CREATE TABLE IF NOT EXISTS public.seo_articles (
  id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  topic VARCHAR(100) DEFAULT '',
  keywords TEXT DEFAULT '',
  article TEXT DEFAULT '',
  image_url VARCHAR(500) DEFAULT ''
);

-- ========================================
-- 0c. banner_settings (bảng bị thiếu hoàn toàn)
-- ========================================
CREATE TABLE IF NOT EXISTS public.banner_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN DEFAULT TRUE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CHECK (id = 1)
);

INSERT INTO public.banner_settings (id, is_enabled, content)
VALUES (1, TRUE, '✨ GIẢM NGAY 5% KHI ĐẶT LỊCH HẸN TRỰC TUYẾN ✨ HOTLINE: 0934 323 878')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 0d. bank_settings (bảng bị thiếu hoàn toàn)
-- ========================================
CREATE TABLE IF NOT EXISTS public.bank_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  bank_id VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_owner VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CHECK (id = 1)
);

INSERT INTO public.bank_settings (id, bank_id, bank_name, account_number, account_owner)
VALUES (1, 'vcb', 'Vietcombank', '13441413', 'HANG')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 1. users
-- ========================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ========================================
-- 2. services
-- ========================================
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;

-- ========================================
-- 3. appointments
-- ========================================
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_package_session BOOLEAN DEFAULT FALSE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS use_package_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS buy_package_id UUID;

-- ========================================
-- 4. attendance
-- ========================================
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 5. treatment_packages
-- ========================================
ALTER TABLE public.treatment_packages ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0;

-- ========================================
-- 6. customer_packages
-- ========================================
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.treatment_packages(id) ON DELETE CASCADE;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS total_sessions INT;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXHAUSTED'));
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS sold_by_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0;

-- ========================================
-- 7. package_usage_logs
-- ========================================
ALTER TABLE public.package_usage_logs ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.package_usage_logs ADD COLUMN IF NOT EXISTS notes TEXT;

-- ========================================
-- 8. treatment_packages: soft delete
-- ========================================
ALTER TABLE public.treatment_packages ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ========================================
-- 9. blogs: thêm cột updated_at (thiếu trong database.sql gốc)
-- ========================================
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- ========================================
-- 10. Foreign Key constraints for appointments
--    (chỉ thêm khi column đã tồn tại)
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'use_package_id') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_use_package') THEN
      ALTER TABLE public.appointments ADD CONSTRAINT fk_use_package FOREIGN KEY (use_package_id) REFERENCES public.customer_packages(id) ON DELETE SET NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'buy_package_id') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_buy_package') THEN
      ALTER TABLE public.appointments ADD CONSTRAINT fk_buy_package FOREIGN KEY (buy_package_id) REFERENCES public.treatment_packages(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ========================================
-- 10. Storage bucket cho ảnh SEO/Gemini
-- ========================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('seo-images', 'seo-images', true, false, 5242880, '{image/png,image/jpeg,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- Allow public access to seo-images bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access seo-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Access seo-images" ON storage.objects
      FOR SELECT USING (bucket_id = 'seo-images');
  END IF;
END $$;

-- ========================================
-- 11. Add online_discount columns to seo_settings
-- ========================================
ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS online_discount_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS online_discount_percent DECIMAL(5,2) DEFAULT 5.00;
ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS default_commission_percent DECIMAL(5,2) DEFAULT 15.00;
ALTER TABLE public.seo_settings ADD COLUMN IF NOT EXISTS hotline VARCHAR(20) DEFAULT '0934 323 878';
