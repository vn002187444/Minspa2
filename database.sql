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
  image_url VARCHAR(255),
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
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  is_package_session BOOLEAN DEFAULT FALSE,
  use_package_id UUID,  -- FK to customer_packages (set after table is created)
  buy_package_id UUID,  -- FK to treatment_packages (set after table is created)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Appointment Services Junction Table
CREATE TABLE appointment_services (
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
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
  image_url VARCHAR(255),
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CHECK (id = 1)
);

INSERT INTO seo_settings (id, page_title, meta_description, meta_keywords, og_image_url)
VALUES (1, 'Min Nail & Hair', 'Tiệm gội đầu dưỡng sinh thảo dược.', 'gội đầu, nail, hair', '/og-placeholder.jpg')
ON CONFLICT (id) DO NOTHING;

-- SEO Articles Table
CREATE TABLE seo_articles (
  id VARCHAR(50) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  topic VARCHAR(100) DEFAULT '',
  keywords TEXT DEFAULT '',
  article TEXT DEFAULT '',
  image_url VARCHAR(500) DEFAULT '',
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  count INT NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI cache (V3.11)
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_hash VARCHAR(64) NOT NULL UNIQUE,
  response TEXT NOT NULL,
  model VARCHAR(50) NOT NULL,
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

-- Auto SEO config (V3.12)
CREATE TABLE IF NOT EXISTS auto_seo_config (
  id BIGINT PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_day VARCHAR(10) NOT NULL DEFAULT 'THU',
  schedule_hour INTEGER NOT NULL DEFAULT 20,
  topic_pool JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('THU', 'CHI')),
  category VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  description TEXT DEFAULT '',
  reference_type VARCHAR(30),
  reference_id UUID,
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
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

-- RLS policies for new tables added via V3.9/V3.13
CREATE POLICY cash_register_admin_all ON cash_register
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "service_role_all" ON cron_job_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_select" ON cron_job_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "service_role_all" ON background_tasks
  FOR ALL USING (true) WITH CHECK (true);
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
-- TOTAL TABLES: 34 (all ✅ RLS enabled)
--
-- Bảng có Realtime (8): appointments, appointment_services, attendance,
--   auto_assign_logs, cron_job_logs, notifications, staff_skills, tasks, time_slot_locks
--
-- Bảng KHÔNG có Realtime (26): ai_cache, attendance_reminders_log,
--   audit_logs, auto_seo_config, background_tasks, bank_settings, banner_settings,
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

  INSERT INTO package_usage_logs (customer_package_id, appointment_id, deducted_by)
  VALUES (p_customer_package_id, p_appointment_id, p_staff_id);

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining);
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
  SELECT tp.session_count INTO v_total_sessions
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
