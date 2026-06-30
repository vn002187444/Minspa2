-- P1.8: Database Indexes Optimization
-- Based on query analysis from booking actions

-- customers: phone lookup (customer.ts line 12, 68)
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- appointments: customer history + status (customer.ts line 24)
CREATE INDEX IF NOT EXISTS idx_appointments_customer_status ON appointments(customer_id, status);

-- appointments: staff availability check (slots.ts line 51)
CREATE INDEX IF NOT EXISTS idx_appointments_staff_start_time ON appointments(staff_id, start_time);

-- appointment_services: join by appointment_id
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment ON appointment_services(appointment_id);

-- customer_packages: active package lookup (customer.ts line 41)
CREATE INDEX IF NOT EXISTS idx_customer_packages_active ON customer_packages(customer_id, status, expires_at);

-- users: role + active lookup (slots.ts line 29, booking.ts line 121)
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- blog_views: dedup check + aggregation
CREATE INDEX IF NOT EXISTS idx_blog_views_post_ip ON blog_views(post_id, ip_hash);

-- time_slot_locks: date range query
CREATE INDEX IF NOT EXISTS idx_time_slot_locks_lock_date ON time_slot_locks(lock_date);

-- reviews: appointment lookup
CREATE INDEX IF NOT EXISTS idx_reviews_appointment ON reviews(appointment_id);
