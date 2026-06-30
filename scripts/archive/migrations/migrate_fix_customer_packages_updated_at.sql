-- Add updated_at column to customer_packages (needed by RPC functions)
ALTER TABLE customer_packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- Fix notify_appointment_change trigger: status check must be UPPERCASE
-- The CHECK constraint on appointments.status uses uppercase values (COMPLETED, CANCELLED)
-- but the trigger was checking lowercase ('completed', 'cancelled') — never matched
CREATE OR REPLACE FUNCTION notify_appointment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  project_ref text;
  anon_key text;
  payload jsonb;
BEGIN
  project_ref := current_setting('app.settings.project_ref', true);
  anon_key := current_setting('app.settings.anon_key', true);

  IF project_ref IS NULL OR anon_key IS NULL THEN
    RAISE WARNING 'app.settings.project_ref hoặc anon_key chưa được set — bỏ qua webhook';
    RETURN NEW;
  END IF;

  -- Use UPPERCASE to match the CHECK constraint on appointments.status
  IF NEW.status IN ('COMPLETED', 'CANCELLED') THEN
    payload := jsonb_build_object(
      'appointmentId', NEW.id,
      'customerId', NEW.customer_id,
      'staffId', NEW.staff_id,
      'status', NEW.status,
      'appointmentDate', NEW.start_time::date,
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
