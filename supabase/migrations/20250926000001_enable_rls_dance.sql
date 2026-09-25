-- Enable RLS for auto_seo_dance_config (fix lint: RLS Disabled in Public)
ALTER TABLE public.auto_seo_dance_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON public.auto_seo_dance_config;
CREATE POLICY "service_role_all" ON public.auto_seo_dance_config FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.auto_seo_dance_config TO service_role;
GRANT SELECT ON public.auto_seo_dance_config TO anon, authenticated;
