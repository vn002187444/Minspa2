-- ===== V3.13 — Fix tasks schema, create cron_job_logs, create 4 RPCs =====
-- Applied: 2026-06-23

-- 1. Fix tasks table: rename columns + add missing columns
DO $$
BEGIN
  -- Rename assigned_to → assignee_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
    ALTER TABLE tasks RENAME COLUMN assigned_to TO assignee_id;
  END IF;

  -- Rename due_date → deadline
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
    ALTER TABLE tasks RENAME COLUMN due_date TO deadline;
  END IF;

  -- Drop old assigned_by if exists (replaced by created_by)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_by') THEN
    ALTER TABLE tasks DROP COLUMN assigned_by;
  END IF;

  -- Add missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'task_type') THEN
    ALTER TABLE tasks ADD COLUMN task_type VARCHAR(20) NOT NULL DEFAULT 'one_time'
      CHECK (task_type IN ('daily', 'one_time'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assignee_type') THEN
    ALTER TABLE tasks ADD COLUMN assignee_type VARCHAR(10) NOT NULL DEFAULT 'specific'
      CHECK (assignee_type IN ('specific', 'all'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'time_slot') THEN
    ALTER TABLE tasks ADD COLUMN time_slot VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'original_task_id') THEN
    ALTER TABLE tasks ADD COLUMN original_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
    ALTER TABLE tasks ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Create cron_job_logs table
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  job_name VARCHAR(100) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "service_role_all" ON cron_job_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Allow authenticated users to read cron_job_logs
CREATE POLICY "authenticated_select" ON cron_job_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add to supabase_realtime publication (for admin dashboard monitoring)
-- Use pg_publication_tables view (more compatible with connection poolers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'cron_job_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cron_job_logs;
  END IF;
END $$;

-- 3. Create background_tasks table (must exist before RPC functions reference it)
CREATE TABLE IF NOT EXISTS background_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE background_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON background_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Create 4 RPC functions

-- 4a. enqueue_background_task
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

-- 3b. dequeue_all_background_tasks
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

-- 3c. deduct_package_session
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
  -- Optimistic lock: update only if remaining > 0
  UPDATE customer_packages
  SET remaining_sessions = remaining_sessions - 1,
      updated_at = NOW()
  WHERE id = p_customer_package_id
    AND remaining_sessions > 0
  RETURNING remaining_sessions INTO v_remaining;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No remaining sessions');
  END IF;

  -- Log usage
  INSERT INTO package_usage_logs (customer_package_id, appointment_id, deducted_by)
  VALUES (p_customer_package_id, p_appointment_id, p_staff_id);

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining);
END;
$$;

-- 3d. refund_package_session
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
  -- Get total sessions for the package
  SELECT tp.session_count INTO v_total_sessions
  FROM customer_packages cp
  JOIN treatment_packages tp ON tp.id = cp.package_id
  WHERE cp.id = p_customer_package_id;

  -- Refund: add back a session only if under total
  UPDATE customer_packages
  SET remaining_sessions = LEAST(remaining_sessions + 1, v_total_sessions),
      updated_at = NOW()
  WHERE id = p_customer_package_id
  RETURNING remaining_sessions INTO v_remaining;

  -- Delete the usage log
  DELETE FROM package_usage_logs
  WHERE customer_package_id = p_customer_package_id
    AND appointment_id = p_appointment_id;
  RETURN jsonb_build_object('success', true, 'remaining', v_remaining);
END;
$$;
