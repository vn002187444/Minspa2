-- ========================================
-- P2.7: RLS Audit + Hardening — Toàn bộ tables
-- Chạy trong Supabase SQL Editor
-- ========================================

-- Lưu ý: Hiện tại project dùng SERVICE_ROLE_KEY (bypass RLS).
-- Các policy này là defense-in-depth, active khi chuyển sang anon key.

-- ========================================
-- 1. ENABLE RLS TRÊN TẤT CẢ TABLES
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_booking_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unaccepted_booking_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uncompleted_booking_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. PUBLIC-READ TABLES (SELECT cho tất cả, CRUD cho service_role)
-- ========================================

-- services
CREATE POLICY "Public read services" ON public.services
  FOR SELECT USING (true);
CREATE POLICY "Service role all services" ON public.services
  FOR ALL USING (true) WITH CHECK (true);

-- blogs
CREATE POLICY "Public read blogs" ON public.blogs
  FOR SELECT USING (true);
CREATE POLICY "Service role all blogs" ON public.blogs
  FOR ALL USING (true) WITH CHECK (true);

-- seo_articles
CREATE POLICY "Public read seo_articles" ON public.seo_articles
  FOR SELECT USING (true);
CREATE POLICY "Service role all seo_articles" ON public.seo_articles
  FOR ALL USING (true) WITH CHECK (true);

-- seo_settings (single config row)
CREATE POLICY "Public read seo_settings" ON public.seo_settings
  FOR SELECT USING (true);
CREATE POLICY "Service role all seo_settings" ON public.seo_settings
  FOR ALL USING (true) WITH CHECK (true);

-- banner_settings (single config row)
CREATE POLICY "Public read banner_settings" ON public.banner_settings
  FOR SELECT USING (true);
CREATE POLICY "Service role all banner_settings" ON public.banner_settings
  FOR ALL USING (true) WITH CHECK (true);

-- reviews (public testimonials)
CREATE POLICY "Public read reviews" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Service role all reviews" ON public.reviews
  FOR ALL USING (true) WITH CHECK (true);

-- treatment_packages (public pricing)
CREATE POLICY "Public read treatment_packages" ON public.treatment_packages
  FOR SELECT USING (true);
CREATE POLICY "Service role all treatment_packages" ON public.treatment_packages
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 3. AUTHENTICATED-READ TABLES (SELECT cho authenticated, CRUD cho service_role)
-- ========================================

-- customers (PII)
CREATE POLICY "Authenticated read customers" ON public.customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role all customers" ON public.customers
  FOR ALL USING (true) WITH CHECK (true);

-- appointments
CREATE POLICY "Authenticated read appointments" ON public.appointments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role all appointments" ON public.appointments
  FOR ALL USING (true) WITH CHECK (true);

-- appointment_services
CREATE POLICY "Authenticated read appointment_services" ON public.appointment_services
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role all appointment_services" ON public.appointment_services
  FOR ALL USING (true) WITH CHECK (true);

-- customer_packages
CREATE POLICY "Authenticated read customer_packages" ON public.customer_packages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role all customer_packages" ON public.customer_packages
  FOR ALL USING (true) WITH CHECK (true);

-- package_usage_logs
CREATE POLICY "Authenticated read package_usage_logs" ON public.package_usage_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role all package_usage_logs" ON public.package_usage_logs
  FOR ALL USING (true) WITH CHECK (true);

-- time_slot_locks
CREATE POLICY "Authenticated read time_slot_locks" ON public.time_slot_locks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role all time_slot_locks" ON public.time_slot_locks
  FOR ALL USING (true) WITH CHECK (true);

-- attendance
CREATE POLICY "Authenticated read attendance" ON public.attendance
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role all attendance" ON public.attendance
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 4. SERVICE-ROLE ONLY TABLES (không anon/authenticated access)
-- ========================================

-- users (chứa password_hash + CCCD)
CREATE POLICY "Service role all users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- audit_logs
CREATE POLICY "Service role all audit_logs" ON public.audit_logs
  FOR ALL USING (true) WITH CHECK (true);

-- bank_settings (chứa số tài khoản ngân hàng)
CREATE POLICY "Service role all bank_settings" ON public.bank_settings
  FOR ALL USING (true) WITH CHECK (true);

-- rate_limits
CREATE POLICY "Service role all rate_limits" ON public.rate_limits
  FOR ALL USING (true) WITH CHECK (true);

-- Reminder logs (internal, 4 tables)
CREATE POLICY "Service role all attendance_reminders_log" ON public.attendance_reminders_log
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all random_booking_reminders_log" ON public.random_booking_reminders_log
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all unaccepted_booking_reminders_log" ON public.unaccepted_booking_reminders_log
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all uncompleted_booking_reminders_log" ON public.uncompleted_booking_reminders_log
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 5. GRANT PERMISSIONS
-- ========================================

-- service_role: full access to all tables
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.appointments TO service_role;
GRANT ALL ON public.appointment_services TO service_role;
GRANT ALL ON public.reviews TO service_role;
GRANT ALL ON public.attendance TO service_role;
GRANT ALL ON public.treatment_packages TO service_role;
GRANT ALL ON public.customer_packages TO service_role;
GRANT ALL ON public.package_usage_logs TO service_role;
GRANT ALL ON public.blogs TO service_role;
GRANT ALL ON public.time_slot_locks TO service_role;
GRANT ALL ON public.attendance_reminders_log TO service_role;
GRANT ALL ON public.random_booking_reminders_log TO service_role;
GRANT ALL ON public.unaccepted_booking_reminders_log TO service_role;
GRANT ALL ON public.uncompleted_booking_reminders_log TO service_role;
GRANT ALL ON public.seo_settings TO service_role;
GRANT ALL ON public.seo_articles TO service_role;
GRANT ALL ON public.banner_settings TO service_role;
GRANT ALL ON public.bank_settings TO service_role;
GRANT ALL ON public.rate_limits TO service_role;

-- authenticated: SELECT on public + authenticated tables
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.blogs TO authenticated;
GRANT SELECT ON public.seo_articles TO authenticated;
GRANT SELECT ON public.seo_settings TO authenticated;
GRANT SELECT ON public.banner_settings TO authenticated;
GRANT SELECT ON public.reviews TO authenticated;
GRANT SELECT ON public.treatment_packages TO authenticated;
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.appointments TO authenticated;
GRANT SELECT ON public.appointment_services TO authenticated;
GRANT SELECT ON public.customer_packages TO authenticated;
GRANT SELECT ON public.package_usage_logs TO authenticated;
GRANT SELECT ON public.time_slot_locks TO authenticated;
GRANT SELECT ON public.attendance TO authenticated;

-- anon: SELECT on public-only tables
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.blogs TO anon;
GRANT SELECT ON public.seo_articles TO anon;
GRANT SELECT ON public.seo_settings TO anon;
GRANT SELECT ON public.banner_settings TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.treatment_packages TO anon;

-- ========================================
-- 6. MISSING TABLES: notifications, blog_views, blog_stats
-- ========================================

-- notifications (user-facing)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "Service role all notifications" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO authenticated;

-- blog_views (analytics, insert-only from RPC)
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role all blog_views" ON public.blog_views
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.blog_views TO service_role;

-- blog_stats (analytics, insert-only from RPC)
ALTER TABLE public.blog_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role all blog_stats" ON public.blog_stats
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.blog_stats TO service_role;
