-- Fix Function Search Path Mutable — set search_path = '' for SECURITY DEFINER functions
-- Detected by Supabase linter: cleanup_audit_logs, cleanup_unused_images, deduct_package_session

-- Already fixed in previous ad-hoc, this migration ensures idempotency
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef = true
      AND (p.proconfig IS NULL OR NOT (p.proconfig::text LIKE '%search_path%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = ''''', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Explicit for known functions (ensure even if loop missed overloads)
ALTER FUNCTION public.cleanup_audit_logs() SET search_path = '';
ALTER FUNCTION public.cleanup_reminder_logs() SET search_path = '';
ALTER FUNCTION public.cleanup_unused_images() SET search_path = '';
ALTER FUNCTION public.deduct_package_session(UUID, UUID, TIMESTAMPTZ) SET search_path = '';
ALTER FUNCTION public.deduct_package_session(UUID, UUID, UUID) SET search_path = '';
ALTER FUNCTION public.refund_package_session(UUID, UUID, TIMESTAMPTZ) SET search_path = '';
ALTER FUNCTION public.refund_package_session(UUID, UUID) SET search_path = '';
ALTER FUNCTION public.trigger_seo_publish() SET search_path = '';
ALTER FUNCTION public.trigger_dance_publish() SET search_path = '';
ALTER FUNCTION public.trigger_reminders_check() SET search_path = '';
ALTER FUNCTION public.trigger_auto_seo_publish() SET search_path = '';
ALTER FUNCTION public.enqueue_background_task(text, jsonb) SET search_path = '';
ALTER FUNCTION public.dequeue_all_background_tasks() SET search_path = '';

-- Fix GraphQL exposure: ai_cache and auto_assign_logs should not be visible to anon/authenticated
REVOKE SELECT ON public.ai_cache FROM anon, authenticated;
REVOKE ALL ON public.ai_cache FROM anon, authenticated;
GRANT ALL ON public.ai_cache TO service_role;

REVOKE SELECT ON public.auto_assign_logs FROM anon, authenticated;
REVOKE ALL ON public.auto_assign_logs FROM anon, authenticated;
GRANT ALL ON public.auto_assign_logs TO service_role;
