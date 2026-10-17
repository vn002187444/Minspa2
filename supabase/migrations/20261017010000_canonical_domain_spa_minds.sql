-- Canonical domain migration: minhair.vercel.app -> spa.minds.io.vn
--
-- Why: spa.minds.io.vn is now the canonical domain. vercel.json + proxy.ts
-- 308-redirect minhair.vercel.app -> spa.minds.io.vn. pg_net's net.http_get /
-- net.http_post do NOT follow redirects, so every pg_cron trigger function
-- that calls minhair.vercel.app would receive a 308 and never reach the route.
--
-- This rewrites the app_url inside every public function whose definition still
-- contains the old domain, without needing to know each function body.
-- Idempotent: safe to re-run (no functions match after the first run).

DO $$
DECLARE
  r record;
  newdef text;
BEGIN
  FOR r IN
    SELECT p.oid AS oid, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND pg_get_functiondef(p.oid) LIKE '%https://minhair.vercel.app%'
  LOOP
    newdef := replace(r.def, 'https://minhair.vercel.app', 'https://spa.minds.io.vn');
    EXECUTE newdef;
    RAISE NOTICE 'Rewrote function oid % to spa.minds.io.vn', r.oid;
  END LOOP;
END $$;
