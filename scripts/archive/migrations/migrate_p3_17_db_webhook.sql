-- ========================================
-- P3.17: DB Webhook thay thế 30s polling
-- Trigger gọi background-tasks khi appointments thay đổi
-- Yêu cầu: pg_net extension
-- Chạy trong Supabase SQL Editor
-- ========================================

-- 1. Enable pg_net
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Hàm trigger gửi HTTP request tới background-tasks khi appointment được tạo/cập nhật
CREATE OR REPLACE FUNCTION public.notify_appointment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  project_ref text;
  anon_key text;
  payload jsonb;
BEGIN
  -- Lấy từ env variables (Supabase project config)
  project_ref := current_setting('app.settings.project_ref', true);
  anon_key := current_setting('app.settings.anon_key', true);

  IF project_ref IS NULL OR anon_key IS NULL THEN
    RAISE WARNING 'app.settings.project_ref hoặc anon_key chưa được set — bỏ qua webhook';
    RETURN NEW;
  END IF;

  -- Chỉ trigger khi status là completed hoặc cancelled
  IF NEW.status IN ('completed', 'cancelled') THEN
    payload := jsonb_build_object(
      'appointmentId', NEW.id,
      'customerId', NEW.customer_id,
      'staffId', NEW.staff_id,
      'status', NEW.status,
      'appointmentDate', NEW.appointment_date,
      'appointmentTime', NEW.start_time
    );

    PERFORM extensions.net.http_post(
      url := 'https://' || project_ref || '.supabase.co/functions/v1/background-tasks',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := payload::text
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Gán trigger cho appointments
DROP TRIGGER IF EXISTS trg_appointment_webhook ON public.appointments;
CREATE TRIGGER trg_appointment_webhook
  AFTER INSERT OR UPDATE OF status
  ON public.appointments
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'cancelled'))
  EXECUTE FUNCTION public.notify_appointment_change();

-- 4. Cần set settings trong Supabase:
--    SELECT set_config('app.settings.project_ref', '<your-ref>', false);
--    SELECT set_config('app.settings.anon_key', '<your-anon-key>', false);
-- Hoặc dùng Dashboard: Project Settings → API → Project URL + Anon Key

-- 5. Log
DO $$
BEGIN
  RAISE NOTICE '✅ P3.17: DB Webhook trigger created on appointments (completed/cancelled)';
  RAISE NOTICE '⚠️  Nhớ set config: SELECT set_config(''app.settings.project_ref'', ''<ref>'', false)';
  RAISE NOTICE '⚠️  Nhớ set config: SELECT set_config(''app.settings.anon_key'', ''<key>'', false)';
END;
$$;
