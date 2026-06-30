-- ========================================
-- P3.18: pgmq background queue
-- Chạy trong Supabase SQL Editor
-- Yêu cầu: pgmq extension
-- ========================================

-- 1. Enable pgmq extension
CREATE EXTENSION IF NOT EXISTS pgmq WITH SCHEMA extensions;

-- 2. Tạo queue (nếu chưa có)
-- pgmq schema được tạo tự động khi enable extension
-- Queue được tạo bằng cách gọi pgmq.create() — nếu lỗi cross-db thì queue đã tồn tại sẵn
DO $$
BEGIN
  PERFORM extensions.pgmq.create('background_tasks');
EXCEPTION WHEN OTHERS THEN
  -- Queue có thể đã tồn tại
  RAISE NOTICE 'Queue background_tasks already exists (or extension not fully loaded): %', SQLERRM;
END;
$$;

-- 3. Grant usage
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA pgmq TO service_role;

-- 4. Helper: enqueue function
CREATE OR REPLACE FUNCTION public.enqueue_background_task(
  task_type text,
  task_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_id bigint;
BEGIN
  msg_id := extensions.pgmq.send('background_tasks', jsonb_build_object(
    'type', task_type,
    'payload', task_payload,
    'created_at', now()
  ));
  RETURN msg_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_background_task TO service_role;

-- 5. Dequeue function (gọi từ background-worker API route)
-- FIXED: SET search_path = 'extensions' (không dùng '') để pgmq schema accessible
CREATE OR REPLACE FUNCTION public.dequeue_all_background_tasks()
RETURNS TABLE(msg_id bigint, message jsonb, read_ct integer, enqueued_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'extensions'
AS $$
DECLARE
  msg_record RECORD;
BEGIN
  LOOP
    msg_record := pgmq.read('background_tasks', 10, 30);
    EXIT WHEN msg_record IS NULL;

    msg_id := msg_record.msg_id;
    message := msg_record.message;
    read_ct := msg_record.read_ct;
    enqueued_at := msg_record.enqueued_at;

    -- Archive instead of delete for audit trail
    PERFORM pgmq.archive('background_tasks', msg_record.msg_id);

    RETURN NEXT;
  END LOOP;

  -- Cleanup: delete archived messages older than 7 days
  DELETE FROM extensions.pgmq.q_background_tasks
  WHERE archived_at IS NOT NULL
    AND archived_at < now() - interval '7 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.dequeue_all_background_tasks TO service_role;

-- 6. Log
DO $$
BEGIN
  RAISE NOTICE '✅ P3.18: pgmq queue + dequeue function ready';
  RAISE NOTICE '💰 Worker endpoint: /api/background-worker (GET)';
END;
$$;
