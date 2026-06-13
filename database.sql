-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF')),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  cccd VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  notification_token JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  CHECK (role IN ('ADMIN', 'MANAGER') OR (role = 'STAFF' AND cccd IS NOT NULL))
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
  is_active BOOLEAN DEFAULT TRUE,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  commission_percentage DECIMAL(5,2) DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,


);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
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
  is_active BOOLEAN DEFAULT TRUE,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

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
  image_url VARCHAR(500) DEFAULT ''
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
