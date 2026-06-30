-- ========================================
-- P7.13: EXPLAIN ANALYZE Monitoring Script
-- Chạy trong Supabase SQL Editor khi cần check performance
-- ========================================

-- 1. Check slow queries trong pg_stat_statements (nếu enabled)
-- SELECT
--   query,
--   calls,
--   total_exec_time AS total_ms,
--   mean_exec_time AS avg_ms,
--   rows
-- FROM pg_stat_statements
-- ORDER BY total_exec_time DESC
-- LIMIT 20;

-- 2. EXPLAIN ANALYZE cho các query thường gặp

-- Query 1: Lấy appointments theo date range (getDashboardData)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, total_amount, commission_amount, tip_amount, created_at, start_time, status, staff_id
FROM appointments
WHERE status = 'COMPLETED'
  AND start_time >= '2026-06-01T00:00:00+07:00'
  AND start_time <= '2026-06-30T23:59:59+07:00'
LIMIT 1000;

-- Query 2: Lấy staff list (getStaffs)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, username, full_name, role, cccd, is_active, created_at
FROM users
WHERE role IN ('STAFF', 'MANAGER')
ORDER BY created_at DESC
LIMIT 100;

-- Query 3: Lấy appointments theo staff (getStaffData)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, start_time, end_time, status, total_amount, staff_id
FROM appointments
WHERE staff_id = '00000000-0000-0000-0000-000000000001'
  AND start_time >= '2026-06-18T00:00:00+07:00'
  AND start_time <= '2026-06-18T23:59:59+07:00'
ORDER BY start_time ASC
LIMIT 50;

-- Query 4: Lấy notifications theo recipient (NotificationBell)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, title, content, is_read, created_at
FROM notifications
WHERE recipient_type = 'user'
  AND recipient_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC
LIMIT 20;

-- Query 5: Customer packages active (checkCustomerHistory)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, customer_id, package_id, total_sessions, remaining_sessions, status,
       purchased_at, expires_at
FROM customer_packages
WHERE customer_id = 'test-customer-id'
  AND status = 'ACTIVE'
  AND expires_at > now()
  AND remaining_sessions > 0
LIMIT 50;

-- Query 6: Time slot locks theo ngày (getScheduleData)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, staff_id, appointment_id, start_time, end_time
FROM time_slot_locks
WHERE lock_date = '2026-06-18'
  AND is_active = true
LIMIT 500;

-- 3. Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS times_used,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 4. Check table sizes
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 5. Check slow queries trong Supabase Dashboard
-- Truy cập: Dashboard → Database → Query Performance
-- Hoặc: Dashboard → Logs → Postgres
