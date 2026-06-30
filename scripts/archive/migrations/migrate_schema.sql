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

-- Fix unnamed 'users_check' constraint → đặt tên rõ ràng, tránh lỗi constraint
-- (Lỗi "new row... violates check constraint 'users_check'" khi đổi role)
DO $$
BEGIN
  -- Drop auto-generated column constraint (users_role_check) if it exists,
  -- because it was created before MANAGER was added to the allowed roles.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check' AND conrelid = 'users'::regclass) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_role_check;
  END IF;
  -- Also try the old name in case someone renamed it
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_check' AND conrelid = 'users'::regclass) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_check;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_cccd_check' AND conrelid = 'users'::regclass) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_role_cccd_check
      CHECK (role IN ('ADMIN', 'MANAGER') OR (role = 'STAFF' AND cccd IS NOT NULL));
  END IF;
END $$;

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
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc', now()) + INTERVAL '2 years');
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS sold_by_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.customer_packages ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0;

-- Backfill expires_at for existing records (2 years from purchased_at or created_at)
UPDATE public.customer_packages
SET expires_at = COALESCE(purchased_at, created_at, timezone('utc', now())) + INTERVAL '2 years'
WHERE expires_at IS NULL;

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

-- ========================================
-- 12. appointments: cascade shift columns
-- ========================================
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 13. notifications table (in-app notification system)
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'customer')),
  recipient_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_type, recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ========================================
-- 14. is_active indexes + NOT NULL constraints
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_treatment_packages_is_active ON public.treatment_packages(is_active);

ALTER TABLE public.users ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.treatment_packages ALTER COLUMN is_active SET NOT NULL;

-- ========================================
-- 15. Composite indexes for booking queries
-- ========================================
CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON public.attendance(date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time_status ON public.appointments(start_time, status);

-- ========================================
-- 16. RPC: Atomic package session deduction (avoids race condition)
-- ========================================
CREATE OR REPLACE FUNCTION public.deduct_package_session(
  p_pkg_id UUID,
  p_appt_id UUID,
  p_used_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.customer_packages
  SET remaining_sessions = remaining_sessions - 1,
      status = CASE
        WHEN remaining_sessions - 1 <= 0 THEN 'EXHAUSTED'
        ELSE 'ACTIVE'
      END
  WHERE id = p_pkg_id
    AND remaining_sessions > 0;

  IF FOUND THEN
    INSERT INTO public.package_usage_logs (customer_package_id, appointment_id, used_at, notes)
    VALUES (p_pkg_id, p_appt_id, p_used_at, 'Khấu trừ tự động 1 buổi khi hoàn thành lịch hẹn');
  END IF;
END;
$$;

-- ========================================
-- 17. RPC: Refund package session (for cancellation)
-- ========================================
CREATE OR REPLACE FUNCTION public.refund_package_session(
  p_pkg_id UUID,
  p_appt_id UUID,
  p_used_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.customer_packages
  SET remaining_sessions = remaining_sessions + 1,
      status = CASE
        WHEN status = 'EXHAUSTED' THEN 'ACTIVE'
        ELSE status
      END
  WHERE id = p_pkg_id;

  IF FOUND THEN
    INSERT INTO public.package_usage_logs (customer_package_id, appointment_id, used_at, notes)
    VALUES (p_pkg_id, p_appt_id, p_used_at, 'Hoàn buổi do khách hàng hủy lịch');
  END IF;
END;
$$;

-- ========================================
-- 18. Index for customer_packages expiry queries
-- ========================================
CREATE INDEX IF NOT EXISTS idx_customer_packages_expires_at ON public.customer_packages(expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_status ON public.customer_packages(customer_id, status);
