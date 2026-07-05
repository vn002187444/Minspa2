-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (created first because other tables reference it)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(50) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  cccd VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notification_token JSONB,
  base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CONSTRAINT users_role_cccd_check CHECK (role IN ('ADMIN', 'MANAGER') OR (role = 'STAFF' AND cccd IS NOT NULL))
);

-- Audit Logs Table (references users, so created after users)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  notification_token JSONB,
  email VARCHAR(255),
  birthday DATE,
  last_booking_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Services Table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('Móng', 'Gội dưỡng sinh', 'Massage', 'Deal')),
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration INT NOT NULL, -- minutes
  image_url TEXT,
  image_alt VARCHAR(500) DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  commission_percentage DECIMAL(5,2) DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED
);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING_RANDOM', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  is_package_session BOOLEAN DEFAULT FALSE,
  use_package_id UUID,  -- FK to customer_packages (set after table is created)
  buy_package_id UUID,  -- FK to treatment_packages (set after table is created)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Appointment Services Junction Table
CREATE TABLE appointment_services (
  id UUID DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  price DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  PRIMARY KEY (appointment_id, service_id)
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quick_tags JSONB,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Attendance Table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  note TEXT,
  UNIQUE(staff_id, date)
);

-- Treatment Packages Table
CREATE TABLE treatment_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  buy_count INT NOT NULL,
  free_count INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total_sessions INT,
  commission_percentage DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Customer Packages Table
CREATE TABLE customer_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  package_id UUID REFERENCES treatment_packages(id) ON DELETE CASCADE,
  remaining_sessions INT,
  total_sessions INT,
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXHAUSTED')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc', now()) + INTERVAL '2 years'),
  sold_by_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Add FK constraints for appointment package columns (after customer_packages is created)
ALTER TABLE appointments
  ADD CONSTRAINT fk_use_package FOREIGN KEY (use_package_id) REFERENCES customer_packages(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_buy_package FOREIGN KEY (buy_package_id) REFERENCES treatment_packages(id) ON DELETE SET NULL;

-- Package Usage Logs Table
CREATE TABLE package_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_package_id UUID REFERENCES customer_packages(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Blogs Table
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  image_alt VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, ''))) STORED
);

CREATE INDEX IF NOT EXISTS idx_blogs_search_vector ON blogs USING GIN (search_vector);

-- Time Slot Locks Table (Dynamic Locking for Booking System)
CREATE TABLE time_slot_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  lock_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_time_slot_locks_staff_date ON time_slot_locks(staff_id, lock_date);
CREATE INDEX idx_time_slot_locks_appointment ON time_slot_locks(appointment_id);
CREATE INDEX idx_time_slot_locks_active ON time_slot_locks(is_active);

-- Reminder Logs Tables
CREATE TABLE attendance_reminders_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE random_booking_reminders_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE unaccepted_booking_reminders_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE uncompleted_booking_reminders_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- SEO Settings Table (single-row config)
CREATE TABLE seo_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  page_title VARCHAR(255) NOT NULL DEFAULT '',
  meta_description TEXT DEFAULT '',
  meta_keywords TEXT DEFAULT '',
  og_image_url VARCHAR(500) DEFAULT '',
  online_discount_enabled BOOLEAN DEFAULT TRUE,
  online_discount_percent DECIMAL(5,2) DEFAULT 5.00,
  default_commission_percent DECIMAL(5,2) DEFAULT 15.00,
  hotline VARCHAR(20) DEFAULT '0934 323 878',
  facebook_url VARCHAR(500) DEFAULT 'https://facebook.com/minnailhair',
  zalo_url VARCHAR(500) DEFAULT 'https://zalo.me/0934323878',
  theme_override VARCHAR(50),
  theme_particles_enabled BOOLEAN DEFAULT TRUE,
  mascot_enabled BOOLEAN DEFAULT TRUE,
  mascot_character VARCHAR(50) DEFAULT 'min',
  mascot_sound BOOLEAN DEFAULT TRUE,
  logo_url VARCHAR(500) DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CHECK (id = 1)
);

INSERT INTO seo_settings (id, page_title, meta_description, meta_keywords, og_image_url)
VALUES (1, 'Min Nail & Hair', 'Tiệm gội đầu dưỡng sinh thảo dược.', 'gội đầu, nail, hair', '/og-image.png')
ON CONFLICT (id) DO NOTHING;

-- SEO Articles Table
CREATE TABLE seo_articles (
  id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  topic VARCHAR(100) DEFAULT '',
  keywords TEXT DEFAULT '',
  article TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  image_alt VARCHAR(500) DEFAULT '',
  status VARCHAR(20) DEFAULT 'draft',
  topic_source VARCHAR(50) DEFAULT 'manual',
  blog_slug VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(topic, '') || ' ' || coalesce(keywords, '') || ' ' || coalesce(article, ''))) STORED
);

-- Banner Settings Table (single-row config)
CREATE TABLE banner_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN DEFAULT TRUE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CHECK (id = 1)
);

INSERT INTO banner_settings (id, is_enabled, content)
VALUES (1, TRUE, '✨ GIẢM NGAY 5% KHI ĐẶT LỊCH HẸN TRỰC TUYẾN ✨ HOTLINE: 0934 323 878')
ON CONFLICT (id) DO NOTHING;

-- Bank Settings Table (single-row config for VietQR payments)
CREATE TABLE bank_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  bank_id VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_owner VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CHECK (id = 1)
);

INSERT INTO bank_settings (id, bank_id, bank_name, account_number, account_owner)
VALUES (1, 'vcb', 'Vietcombank', '13441413', 'HANG')
ON CONFLICT (id) DO NOTHING;

-- Insert Seed Data for Services
INSERT INTO services (name, category, description, price, duration, discount_percentage) VALUES
('Gội nhanh', 'Gội dưỡng sinh', 'Gội nhanh', 65000, 30, 0),
('Gội thư giãn', 'Gội dưỡng sinh', 'Gội thư giãn', 69000, 30, 0),
('Gội dưỡng sinh CB1 - An Yên', 'Gội dưỡng sinh', 'Combo 1 An Yên', 149000, 60, 0),
('Gội dưỡng sinh CB2 - Tầm Trung', 'Gội dưỡng sinh', 'Combo 2 Tầm Trung', 199000, 70, 0),
('Gội dưỡng sinh CB3 - Chuyên Sâu', 'Gội dưỡng sinh', 'Combo 3 Chuyên Sâu', 279000, 80, 0),
('Gội dưỡng sinh CB4 - Thượng Hạng', 'Gội dưỡng sinh', 'Combo 4 Thượng Hạng', 379000, 90, 0),
('Massage Body 60p', 'Massage', 'Massage body 60 phút', 300000, 60, 5),
('Massage Body 75p', 'Massage', 'Massage body 75 phút', 375000, 75, 5),
('Massage Body 90p', 'Massage', 'Massage body 90 phút', 425000, 90, 5),
('Massage Body 120p', 'Massage', 'Massage body 120 phút', 525000, 120, 5),
('Chà gót chân lẻ', 'Móng', 'Chà gót chân lẻ', 120000, 30, 0),
('Combo chà gót chân 5 bước chuyên sâu', 'Móng', 'Combo chà gót chân chuyên sâu 5 bước', 149000, 45, 0),
('Nhặt da lẻ', 'Móng', 'Chăm sóc móng: Nhặt da lẻ', 45000, 20, 0),
('Phá sơn gel', 'Móng', 'Chăm sóc móng: Phá sơn gel', 20000, 15, 0),
('Tháo móng bột', 'Móng', 'Chăm sóc móng: Tháo móng bột', 40000, 20, 0),
('Sơn gel', 'Móng', 'Chăm sóc móng: Sơn gel', 110000, 30, 0),
('Nối móng úp', 'Móng', 'Chăm sóc móng: Nối móng úp', 150000, 45, 0),
('Tráng gương / Mắt mèo', 'Móng', 'Chăm sóc móng: Tráng gương, mắt mèo', 150000, 45, 0),
('Combo Sơn Gel + cắt da', 'Deal', 'Deal: Sơn gel + cắt da', 99000, 45, 0),
('Combo Sơn Thạch + cắt da', 'Deal', 'Deal: Sơn thạch + cắt da', 119000, 45, 0),
('Combo Mắt mèo + cắt da', 'Deal', 'Deal: Mắt mèo + cắt da', 139000, 45, 0),
('Chà gót chân theo combo', 'Deal', 'Deal: Chà gót chân theo combo', 99000, 30, 0);

-- ========================================
-- Notifications Table (In-app notification system)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'customer')),
  recipient_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_type, recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_search_vector ON services USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_treatment_packages_is_active ON treatment_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance(date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time_status ON appointments(start_time, status);

-- Storage bucket cho ảnh SEO/Gemini
-- ========================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('seo-images', 'seo-images', true, false, 5242880, '{image/png,image/jpeg,image/webp}')
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access seo-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Access seo-images" ON storage.objects
      FOR SELECT USING (bucket_id = 'seo-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Upload seo-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Upload seo-images" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'seo-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Update seo-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Update seo-images" ON storage.objects
      FOR UPDATE USING (bucket_id = 'seo-images') WITH CHECK (bucket_id = 'seo-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Delete seo-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Delete seo-images" ON storage.objects
      FOR DELETE USING (bucket_id = 'seo-images');
  END IF;
END $$;

-- Seed users
INSERT INTO users (id, role, username, password_hash, full_name, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'ADMIN', 'admin', 'Admin', 'Admin', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, role, username, password_hash, full_name, cccd, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'STAFF', 'staff1', 'Staff@1', N'Thợ Makeup 1', '000000000000', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, role, username, password_hash, full_name, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'MANAGER', 'manager', 'Manager@1', N'Quản lý', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Blog Analytics Tables
CREATE TABLE blog_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  ip_hash VARCHAR(64),
  user_agent TEXT
);

CREATE INDEX idx_blog_views_post_id ON blog_views(post_id);
CREATE INDEX idx_blog_views_viewed_at ON blog_views(viewed_at);

CREATE TABLE blog_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  UNIQUE(post_id, date)
);

CREATE INDEX idx_blog_stats_date ON blog_stats(date);

-- ========================================
-- Migration Tables (added after initial schema)
-- ========================================

-- Rate limits (V3.10)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  last_request TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI cache (V3.11)
CREATE TABLE IF NOT EXISTS ai_cache (
  id TEXT PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff skills & certificates (V3.3)
CREATE TABLE IF NOT EXISTS staff_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  skill_level INT DEFAULT 3 CHECK (skill_level BETWEEN 1 AND 5),
  certificate_name VARCHAR(255),
  certificate_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(staff_id, service_id)
);

-- Auto-assign history logs (V3.3)
CREATE TABLE IF NOT EXISTS auto_assign_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  previous_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Slot booking limits (V3.3)
CREATE TABLE IF NOT EXISTS slot_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lock_date DATE NOT NULL,
  time_slot VARCHAR(5) NOT NULL,
  max_bookings INT NOT NULL DEFAULT 1,
  current_bookings INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(lock_date, time_slot)
);

-- Tasks (V3.4, fixed V3.13)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(20) NOT NULL DEFAULT 'one_time'
    CHECK (task_type IN ('daily', 'one_time')),
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assignee_type VARCHAR(10) NOT NULL DEFAULT 'specific'
    CHECK (assignee_type IN ('specific', 'all')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'REJECTED')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  deadline TIMESTAMP WITH TIME ZONE,
  time_slot VARCHAR(20),
  original_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Auto SEO config (V3.12 → V3.13)
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

CREATE TABLE IF NOT EXISTS cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('THU', 'CHI')),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT DEFAULT '',
  reference_type VARCHAR(30),
  reference_id UUID,
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  is_active BOOLEAN DEFAULT TRUE
);

-- Cron job logs (V3.13)
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  job_name VARCHAR(100) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Background tasks queue (V3.13)
CREATE TABLE IF NOT EXISTS background_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Salary payments (V3.14 Payroll)
CREATE TABLE IF NOT EXISTS salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_tips DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_package_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus DECIMAL(10,2) NOT NULL DEFAULT 0,
  deduction DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_pay DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  notes TEXT,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FAQs (V3.15 SEO FAQ System)
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);

-- ========================================
-- Row Level Security (RLS) for ALL tables
-- ========================================
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_assign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_seo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables added via V3.9/V3.13
CREATE POLICY faqs_admin_all ON faqs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY faqs_public_read ON faqs
  FOR SELECT USING (true);
CREATE POLICY cash_register_admin_all ON cash_register
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY salary_payments_admin_all ON salary_payments
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "service_role_all" ON cron_job_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_select" ON cron_job_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "service_role_all" ON background_tasks
  FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE random_booking_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_articles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_seo_articles_search_vector ON seo_articles USING GIN (search_vector);
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE unaccepted_booking_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE uncompleted_booking_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Realtime publication membership
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'appointments', 'appointment_services', 'attendance',
    'auto_assign_logs', 'notifications', 'staff_skills',
    'tasks', 'time_slot_locks'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication p
      JOIN pg_publication_rel pr ON pr.prpubid = p.oid
      WHERE p.pubname = 'supabase_realtime'
        AND pr.prrelid = quote_ident(tbl)::regclass
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    END IF;
  END LOOP;
END $$;

-- ========================================
-- Database Review Summary (June 2026)
-- ========================================
-- TOTAL TABLES: 35 (all ✅ RLS enabled)
--
-- Bảng có Realtime (8): appointments, appointment_services, attendance,
--   auto_assign_logs, cron_job_logs, notifications, staff_skills, tasks, time_slot_locks
--
-- Bảng KHÔNG có Realtime (27): ai_cache, attendance_reminders_log,
--   audit_logs, auto_seo_config, background_tasks, bank_settings, banner_settings,
--   faqs,
--   blog_stats, blog_views, blogs, cash_register, customer_packages, customers,
--   package_usage_logs, random_booking_reminders_log, rate_limits, reviews,
--   seo_articles, seo_settings, services, slot_limits, treatment_packages,
--   unaccepted_booking_reminders_log, uncompleted_booking_reminders_log, users

CREATE OR REPLACE FUNCTION increment_blog_view(p_post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_stats
  SET views = views + 1
  WHERE post_id = p_post_id AND date = CURRENT_DATE;
  IF NOT FOUND THEN
    INSERT INTO blog_stats (post_id, date, views) VALUES (p_post_id, CURRENT_DATE, 1);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- RPC Functions (V3.13)
-- ========================================

-- enqueue_background_task: Insert a task into background_tasks queue
CREATE OR REPLACE FUNCTION enqueue_background_task(
  task_type TEXT,
  task_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_id UUID;
BEGIN
  INSERT INTO background_tasks (task_type, payload, status)
  VALUES (task_type, task_payload, 'pending')
  RETURNING id INTO task_id;
  RETURN task_id;
END;
$$;

-- dequeue_all_background_tasks: Claim all pending tasks atomically
CREATE OR REPLACE FUNCTION dequeue_all_background_tasks()
RETURNS SETOF background_tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE background_tasks
  SET status = 'processing', updated_at = NOW()
  WHERE status = 'pending'
  RETURNING *;
END;
$$;

-- deduct_package_session: Atomically deduct a session from customer_packages
-- Note: DB has TWO overloads — this is the jsonb version (SECURITY DEFINER, full logic).
-- The void version (used by staff/actions.ts) is simpler and does not reference updated_at.
CREATE OR REPLACE FUNCTION deduct_package_session(
  p_customer_package_id UUID,
  p_appointment_id UUID,
  p_staff_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
  v_result JSONB;
BEGIN
  UPDATE customer_packages
  SET remaining_sessions = remaining_sessions - 1,
      updated_at = NOW()
  WHERE id = p_customer_package_id
    AND remaining_sessions > 0
  RETURNING remaining_sessions INTO v_remaining;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No remaining sessions');
  END IF;

  INSERT INTO package_usage_logs (customer_package_id, appointment_id, staff_id)
  VALUES (p_customer_package_id, p_appointment_id, p_staff_id);

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining);
END;
$$;

-- Void overload of deduct_package_session (used by staff complete appointment flow)
CREATE OR REPLACE FUNCTION deduct_package_session(
  p_pkg_id UUID,
  p_appt_id UUID,
  p_used_at TIMESTAMP WITH TIME ZONE
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE customer_packages
  SET remaining_sessions = remaining_sessions - 1,
      status = CASE
        WHEN remaining_sessions - 1 <= 0 THEN 'EXHAUSTED'
        ELSE 'ACTIVE'
      END
  WHERE id = p_pkg_id
    AND remaining_sessions > 0;

  IF FOUND THEN
    INSERT INTO package_usage_logs (customer_package_id, appointment_id, used_at, notes)
    VALUES (p_pkg_id, p_appt_id, p_used_at, 'Khấu trừ tự động 1 buổi khi hoàn thành lịch hẹn');
  END IF;
END;
$$;

-- refund_package_session: Refund a session when appointment is cancelled
CREATE OR REPLACE FUNCTION refund_package_session(
  p_customer_package_id UUID,
  p_appointment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
  v_total_sessions INTEGER;
BEGIN
  SELECT tp.total_sessions INTO v_total_sessions
  FROM customer_packages cp
  JOIN treatment_packages tp ON tp.id = cp.package_id
  WHERE cp.id = p_customer_package_id;

  UPDATE customer_packages
  SET remaining_sessions = LEAST(remaining_sessions + 1, v_total_sessions),
      updated_at = NOW()
  WHERE id = p_customer_package_id
  RETURNING remaining_sessions INTO v_remaining;

  DELETE FROM package_usage_logs
  WHERE customer_package_id = p_customer_package_id
    AND appointment_id = p_appointment_id;

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining);
END;
$$;

-- Void overload of refund_package_session (used by customer cancel flow)
CREATE OR REPLACE FUNCTION refund_package_session(
  p_pkg_id UUID,
  p_appt_id UUID,
  p_used_at TIMESTAMP WITH TIME ZONE
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE customer_packages
  SET remaining_sessions = remaining_sessions + 1,
      status = CASE
        WHEN status = 'EXHAUSTED' THEN 'ACTIVE'
        ELSE status
      END
  WHERE id = p_pkg_id;

  IF FOUND THEN
    INSERT INTO package_usage_logs (customer_package_id, appointment_id, used_at, notes)
    VALUES (p_pkg_id, p_appt_id, p_used_at, 'Hoàn buổi do khách hàng hủy lịch');
  END IF;
END;
$$;

-- ========================================
-- FK Indexes (Phase 4 — Database Hardening)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_use_package_id ON appointments(use_package_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON appointment_services(service_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_package_id ON customer_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_id ON customer_packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_sold_by_staff_id ON customer_packages(sold_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_package_usage_logs_customer_package_id ON package_usage_logs(customer_package_id);
CREATE INDEX IF NOT EXISTS idx_package_usage_logs_appointment_id ON package_usage_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_package_usage_logs_staff_id ON package_usage_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_salary_payments_staff_id ON salary_payments(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_paid_by ON salary_payments(paid_by);
CREATE INDEX IF NOT EXISTS idx_cash_register_recorded_by ON cash_register(recorded_by);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_auto_assign_logs_appointment_id ON auto_assign_logs(appointment_id);

-- ========================================
-- updated_at auto trigger
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
  tables_with_updated_at text[] := ARRAY[
    'customer_packages', 'blogs', 'cash_register', 'background_tasks',
    'faqs', 'auto_seo_config', 'tasks', 'seo_settings',
    'banner_settings', 'bank_settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_with_updated_at
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trigger_update_updated_at'
        AND tgrelid = quote_ident(tbl)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ========================================
-- CHECK constraints
-- ========================================
ALTER TABLE time_slot_locks DROP CONSTRAINT IF EXISTS chk_time_slot_locks_end_gt_start;
ALTER TABLE time_slot_locks ADD CONSTRAINT chk_time_slot_locks_end_gt_start CHECK (end_time > start_time);

ALTER TABLE salary_payments DROP CONSTRAINT IF EXISTS chk_salary_payments_period_end_gt_start;
ALTER TABLE salary_payments ADD CONSTRAINT chk_salary_payments_period_end_gt_start CHECK (period_end > period_start);

ALTER TABLE customers DROP CONSTRAINT IF EXISTS chk_customers_email_format;
ALTER TABLE customers ADD CONSTRAINT chk_customers_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
