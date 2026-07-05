---
name: minspa
description: >-
  Min Nail & Hair Salon project knowledge base. Next.js 16 + Supabase + custom JWT auth. Use for all tasks related to this codebase — booking engine, admin, staff scheduling, SEO, marketing, monitoring, infrastructure.
---

# MinSpa Project Skill

## 0. PowerShell Encoding — Critical for Debugging Vietnamese Text
- **PowerShell 5.1 console cannot render Vietnamese Unicode.** All Vietnamese characters (ộ, ứ, ấ, ữ, v.v.) display as `?` or `�` in terminal output. This is a DISPLAY limitation, NOT data corruption.
- **NEVER trust `?` characters seen in PowerShell output.** Always verify by checking raw UTF-8 bytes (hex) against expected encoding.
- **Verification method:**
  ```powershell
  $wc = New-Object System.Net.WebClient
  $bytes = $wc.DownloadData($url)
  $html = [System.Text.Encoding]::UTF8.GetString($bytes)
  # Then check hex:
  $hex = ($bytes | ForEach-Object { $_.ToString("X2") }) -join " "
  ```
- Similarly, Supabase REST API results via `Invoke-RestMethod` display `?` for Vietnamese in PowerShell, but the actual DB data is correct. Verify by comparing hex of the webpage's `<title>` tag against expected UTF-8 encoding of the Vietnamese text.
- **Key check:** NFC `ộ` = `E1 BB 99` (3 bytes). NFD would be `6F CC 82 CC A3` (4 bytes). If you see `E1 BB 99`, the data IS correctly encoded NFC.

## 0b. Auto-SEO & Blog Publishing Lessons (Jul 2026)

### Image URL VARCHAR(255) Truncation
- **Unsplash search result URLs contain `ixid` + `ixlib` params that can exceed 255 chars.** Even `urls.small` from search results may be too long.
- Using `urls.small` (400px) instead of `urls.regular` (1080px) helps but doesn't guarantee <255 chars for search results.
- **Fixed by:** using `urls.raw + '&w=400'` (strips all Unsplash query params) or just removing the `?w=800&auto=format&fit=crop` append that old code added.
- **Always truncate image URL before insert:** `(imageUrl || '').substring(0, 255)` — PostgreSQL silently truncates VARCHAR columns and existing records will have broken image URLs.
- **To detect truncated URLs:** query `blogs` table and check `LENGTH(image_url) > 240` or image URLs ending with truncated params.
- **Fix existing truncated records:** regenerate image URL using clean Unsplash base URL (e.g., `https://images.unsplash.com/photo-{id}?w=400`).

### Auto-SEO Publish Must Set `published: true`
- `runAutoSeo()` MUST set `published: true` + `published_at` in blog insert. Without this, cron-generated articles are invisible drafts.
- All three blog write paths must be consistent:
  1. `runAutoSeo()` → `lib/auto-seo.ts` (direct supabase insert)
  2. `publishSeoArticleToBlog()` → `app/admin/actions.ts` (publish saved article)
  3. `saveBlogPost()` → `app/blog/actions.ts` (admin blog editor)

### Cron Auth — Accept Multiple Methods
- Supabase cron (pg_cron), Vercel cron, and Admin UI trigger all hit `/api/cron/seo-publish`.
- Must accept three auth methods:
  1. `CRON_SECRET` Bearer token (Admin UI trigger via `triggerCronJob`)
  2. `x-supabase-cron: true` header (Supabase pg_cron, though this may not arrive via `pg_net`)
  3. Admin session cookie (when triggered from Admin UI)
- Pattern: check `CRON_SECRET` first, then fall back to session check.

### Vietnamese Encoding — NFC Normalization Coverage
- `normalizeNFC()` must be applied on **all three write paths**, not just on read. NFC normalization on read is a safety net only.
- Three write paths to verify:
  1. `runAutoSeo()` — line 200-208 in `lib/auto-seo.ts` ✅
  2. `publishSeoArticleToBlog()` — line 834-850 in `app/admin/actions.ts` ✅
  3. `saveBlogPost()` — line 83 in `app/blog/actions.ts` ✅
- The `callGemini()` function in `lib/ai/gemini.ts` returns `res.text` from `@google/genai` SDK — text is already properly decoded Unicode. NFC normalization is applied downstream.
- **Existing DB data can still have `?` replacement characters (U+FFFD) if invalid UTF-8 bytes were stored before the fix.** Once replacement chars are in the DB, they cannot be recovered — only regenerated from Gemini.

### Auto-SEO Config Schema
- `auto_seo_config` table has: `schedule_days` (JSONB array of day abbreviations ['SUN','MON',...]), `schedule_hour` (int 0-23 Vietnam time), `topic_pool` (JSONB array of topic strings), `enabled` (boolean), `schedule_day` (legacy single day).
- Schedule check compares current UTC time converted to Vietnam time (UTC+7).
- Topic pool is maintained by `runKeywordResearch()` which appends new topics to existing pool.

### Image Search Cascade
- `searchImages(topic, count)` in `lib/image-search.ts`:
  1. Try Unsplash API (most relevant)
  2. Fall back to Pexels API
  3. Fall back to `getSuggestedImages()` (static categorized pool in `lib/image-suggestions.ts`)
- Returns `{ images: string[], imageAlts: string[] }`.
- Admin "Publish to Blog" flow uploads image to Supabase Storage via `uploadBase64ToStorage()` (supports both base64 and URL sources).
- **Unsplash API type must include ALL URL sizes** (`raw`, `full`, `regular`, `small`, `thumb`) — the code accesses `urls.small`. The inline type annotation in `searchUnsplash()` was missing `small` (only had `regular`), causing build error.

### Google Translate Implementation
- **DO NOT use `next/script` for Google Translate** — load the script dynamically from the `GoogleTranslate` component using `useEffect` + `document.createElement('script')`.
- The `#google_translate_element` div must be in the React component (part of returned JSX) so it's rendered by the time the script loads.
- Define `window.googleTranslateElementInit` BEFORE adding the script element to the DOM (so it's available when the async script executes).
- Cookie format: `googtrans=/vi/{lang}` (e.g., `/vi/en` for English).
- CSP must allow frames from: `translate.google.com`, `translate.googleapis.com`, `www.gstatic.com`, `*.google.com`.
- Type declarations needed: `Window.googleTranslateElementInit` (function) + `google.translate.TranslateElement` (class) in `types/index.ts`.

## 1. Project Overview
- **Name:** Min Nail & Hair Salon
- **Stack:** Next.js 16 (React 19) + Supabase (PostgreSQL) + TypeScript
- **Deploy:** Vercel (free tier)
- **Auth:** Custom JWT (NOT Supabase Auth) — `app/login/` + middleware
- **AI Tools:** Google Gemini — primary `gemini-3.1-flash-lite`, fallback `gemini-2.5-flash-lite` via `@google/genai` (SDK v2)
- **Models note:** `gemini-2.0-flash-exp-image-generation` and `gemini-2.0-flash` are deprecated (404). Use `-3.1-flash-lite` for all new tasks.
- **`googleSearch` tool unavailable with JSON mode:** `responseMimeType: "application/json"` + `googleSearch` cannot be combined. For structured JSON output, use the `jsonSchema` config parameter with `responseMimeType: "application/json"`, and omit `googleSearch`.
- **Styling:** Tailwind CSS v4 + Framer Motion (`framer-motion`) for animations

## 2. Critical Rules
1. **`database.sql` is the schema source of truth** — keep it in sync with all migration files. When adding tables/columns via migrations, also add them to `database.sql` (tables → RLS → Realtime). See section 10 for the sync checklist.
2. **Soft delete only** — use `is_active` or `status='cancelled'` columns, never DELETE FROM
3. **No SELECT \*** — always specify columns in queries
4. **Cycle Protocol (revised):** Audit first → Read UPGRADE_PLAN.md (root) + AI_MAP.md → Read existing files for conventions → **Audit schema mismatches (grep .select() vs database.sql)** → Code → Update docs (PLAN.md, UPGRADE_PLAN.md, SKILL.md) → `npm run build` verify → Commit
5. **Build check:** Must pass `npm run build` before any commit (TypeScript + 50 static pages). Run after EVERY batch of changes.
6. **File management:** Prefer editing existing files over creating new ones. Check git log / git diff before creating new files.
7. **Initial audit required:** At the start of any session, first audit the existing codebase to find orphan features (BE without FE UI), mojibake/encoding issues, and types that don't match reality.
8. **Batch parallel reads:** Read all relevant files in parallel at the start of a task to understand conventions and avoid type cascading errors.
9. **Types first:** Define interfaces/types before writing logic. Never use `any` as a function parameter type. If Supabase query returns unknown shape, define an interface.
10. **Form accessibility checklist:** Every form must have `htmlFor` on label + matching `id` on input. Every modal must have `useFocusTrap` with `ref={trapRef}` on the dialog container.
11. **No orphan migrations:** After applying a migration to Supabase, move the file to `scripts/archive/` or add `.applied` suffix — don't leave hanging files that create confusion about what has been applied.
11b. **Schema mismatch prevention:** Before writing any Supabase `.select()` query, verify every column name against `database.sql` table definition. If a column doesn't exist in `database.sql`:
    - Either add it to `database.sql` AND create an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migration
    - Or remove the column reference from the select query
    - Run `npm run build` to verify
    - Common sources of mismatch: new features that add columns in code but forget migration files (V3.6 Mascot, V3.8 Theme, V3.12 Auto-SEO, V3.9 Financials all had this issue)
12. **Single source of truth:** PLAN.md is the permanent project plan. UPGRADE_PLAN.md (root level) is the active execution plan storing only WHAT'S NOT DONE. After completing a session:
    - Add completed items to PLAN.md (with section header and ✅ status)
    - Strip done items from UPGRADE_PLAN.md (keep only pending items)
    - Keep UPGRADE_PLAN.md lean (target &lt;100 lines) — it's a TODO list, not an archive
13. **Supabase features first:** Before writing code for any new feature, check `SUPABASE_FEATURES.md` (root) + `.agents/skills/minspa/SUPABASE_FEATURES.md` to see if Supabase đã có sẵn giải pháp. Ưu tiên pg_cron (schedule), pgmq (queue), Realtime (live update), Storage (file), pg_net (webhook) thay vì tự viết mới.
14. **PgBouncer compatibility:** Supabase pooler (port 6543) uses PgBouncer transaction mode. Multi-statement SQL may fail silently. Always use `DO $$ ... END $$;` blocks instead of multiple `;`-separated statements for complex operations (publication membership, conditional DDL, etc.). The `ALTER PUBLICATION ... ADD TABLE IF NOT EXISTS` syntax does NOT pass through PgBouncer — use a DO block with `pg_publication_tables` check instead (NOT `pg_publication_rel` which also hangs through PgBouncer). For running migrations, use `POSTGRES_URL_NON_POOLING` (port 5432) instead of `POSTGRES_URL` (port 6543 pooler) to avoid catalog query issues.
15. **RLS + Realtime audit after migrations:** After applying any migration that adds new tables, immediately verify:
    - All new tables have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
    - Tables that need realtime subscriptions are added to `supabase_realtime` publication (via DO block with `pg_publication_tables` check)
    - `database.sql` is updated to reflect the new schema + RLS + Realtime status
    - Archive directory is cleaned (delete old migration files once merged into `database.sql`)
16. **Verify SQL before running:** Test DDL syntax in a safe way before applying to production. `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... IF NOT EXISTS` are safe but `ALTER PUBLICATION ... ADD TABLE IF NOT EXISTS` is NOT universally supported (fails through PgBouncer). When in doubt, use a DO block with existence checks.
17. **database.sql must include RLS policies for every table:** Don't just add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — also add CREATE POLICY statements. Without policies, RLS-enable tables deny ALL access by default. Scan `scripts/archive/` for migration CREATE POLICY lines and consolidate them into `database.sql`.
18. **No top-level env validation that throws in production:** During `next build`, Next.js evaluates all imported modules with `NODE_ENV=production`. Any `throw new Error(...)` or `process.exit()` at module level crashes the build. Fixes:
    - Move validation inside functions (lazy init pattern — see `utils/auth.ts` `getKey()`, `utils/reminders.ts` `getSupabase()`)
    - For `createClient()`, make it return a **mock client** when env vars are missing instead of throwing (see `utils/supabase/server.ts` `createMockClient()`) — this prevents ALL static pages from crashing during prerendering
    - Never use `process.env.XXX!` non-null assertions at module level (see `app/api/background-worker/route.ts` fix)
19. **Never set `SHARP_IGNORE_GLOBAL_LIBVIPS=1`** — trong build script hay Vercel env vars. Env var này bảo sharp bỏ qua prebuilt binary (`@img/sharp-linux-x64`) và tìm libvips hệ thống, mà Vercel không có → runtime crash `ERR_DLOPEN_FAILED`. Fix:
    - `@img/sharp-linux-x64` và `@img/sharp-libvips-linux-x64` trong `optionalDependencies` (npm install mặc định cài optional deps, không cài được trên Windows vì platform mismatch)
    - Build script: `npx next build` (không có env var)
    - Xoá `"SHARP_IGNORE_GLOBAL_LIBVIPS"` khỏi `vercel.json` env nếu có
20. **Vercel deploy — project name phải set trong `vercel.json`:** Nếu thiếu `"name"`, Vercel CLI auto-create project với name từ git URL chứa `---` → bị reject (400). Luôn thêm `"name": "minhair"` vào `vercel.json`.
21. **Block Supabase Management API calls trên Vercel:** `@supabase/supabase-js` v2.107+ tự động gọi `api.supabase.com/v1/projects/{ref}/network-restrictions` và `config/storage` khi khởi tạo `createClient()`. Trên Vercel network không reach được `api.supabase.com` → timeout. Fix: override `global.fetch` trong createClient options:
    ```ts
    createRealClient(url, key, {
      global: {
        fetch: (input, init) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
          if (url && url.startsWith('https://api.supabase.com/')) {
            return Promise.resolve(new Response(null, { status: 200 }));
          }
          return fetch(input, init);
        },
      },
    });
    ```
    Xem `utils/supabase/server.ts` implementation hiện tại.
22. **Full CI pipeline test:** Sau khi sửa CI, không chỉ verify build local — đợi GitHub Actions run hoàn tất (bao gồm cả Deploy step). Lỗi có thể xuất hiện ở bất kỳ step nào (lint, test, build, deploy). Dùng GitHub API kiểm tra kết quả từng job.
23. **iOS SecurityError Prevention:** `navigator.serviceWorker.register()` and `indexedDB.open()` can throw synchronous SecurityError on iOS Safari Private Browsing. Wrap these calls in `try-catch` and ensure `pushManager.subscribe()` is only called during user gestures.
24. **Commit & Deploy policy:**
    - **🚫 NEVER commit to GitHub unless explicitly requested by the user.** Do not auto-commit after fixes.
    - **🚫 NEVER deploy to Vercel unless explicitly requested.** Only report deployment result if asked.
    - Limit commit frequency — batch multiple fixes into a single commit, avoid continuous small commits.
    - Before committing, always verify: `git status`, `git diff`, `npm run build` ✅.
25. **Check available tools & skills:** Before starting any task, load the relevant skill and list all available tools.
26. **Token efficiency — delegate to Gemini subagents:** AI chính (`big-pickle`) nên giữ vai trò điều phối, delegate các tác vụ nặng cho subagents để tiết kiệm token:
    - `explore` agent: research, tìm file, grep, glob
    - `db-admin` agent: SQL, migration, schema analysis
    - `ci-fix` agent: CI/CD, deploy, env vars
    - `general` agent: UI components, logic phức tạp
    - Batch parallel reads: dùng nhiều `read` tool trong 1 message
27. **Context preservation (`docs/` files):**
    - `docs/Log.md` — **Ghi log sau mỗi session**: tóm tắt mục tiêu, đã làm, bugs, build status. Đọc đầu session để lấy lại context.
    - `docs/Audit.md` — **Ghi nhận audit findings**: mỗi lần audit codebase, thêm entry theo format (phạm vi, phát hiện, kết luận).
    - `docs/Discuss.md` — **Ghi quyết định quan trọng**: bất kỳ quyết định nào ảnh hưởng architecture/design đều ghi vào đây (context, quyết định, lý do, files).
    - Khi bắt đầu session mới: đọc `Log.md` để nắm context, đọc `Discuss.md` cho decisions history. Use `skill` tool to load skill context, then refer to `.opencode/tools/` for automation tools (ci_check, build_check, deploy_vercel, migrate_db, check_env, schema_sync, env_diff, db_health_check, vercel_status, seo_analyzer, skill_sync). Available skills: `minspa` (project knowledge), `supabase` (Supabase products), `supabase-postgres-best-practices`, `customize-opencode` (OpenCode config).

28. **Server action redirect for auth cookie flush:** When setting cookies in a server action for login/auth, use `redirect()` from `next/navigation` (not client `window.location.href`). Pattern:
    - `cookies().set()` + `redirect('/admin')` — NEXT_REDIRECT throw ensures cookie flushes in same HTTP response
    - Don't return `{ redirectTo }` JSON + let client redirect — cookie may not flush before navigation
    - See `app/login/actions.ts` for working implementation

29. **Verify docs freshness before coding:** Before implementing a feature that UPGRADE_PLAN.md or docs say is "missing UI", grep the actual codebase first. These docs are often stale. Example: UPGRADE_PLAN said `staff_skills` had "no UI" but `StaffSkillsModal.tsx` (292 lines) already existed with full CRUD. Steps:
    - Search for file patterns (modal, dialog, component names)
    - Grep server actions referencing the table
    - Grep imports in parent components
    - Only if nothing found, treat as truly orphan

30. **UPGRADE_PLAN.md consolidation:** After completing a major section (V3.x track, SEO Schema, Session Audit, Orphan Cleanup):

31. **Verify production domain alias after every Vercel deploy:** CI `npx vercel --prod` may report "completed success" but NOT update the production domain alias. Steps:
     - Check `npx vercel list --prod` — confirm latest deployment has status ● Ready
     - Check `npx vercel inspect <deployment-url>` — verify `minhair.vercel.app` is in Aliases list
     - If not aliased, run: `npx vercel alias set <deployment-url> minhair.vercel.app`
     - Use `npx vercel whoami` to verify local auth first
     - **Do NOT trust CI "completed success" alone** — always verify alias via GitHub Deployments API or Vercel CLI

32. **Storage bucket RLS policies must include INSERT/UPDATE/DELETE:** Supabase Storage buckets only get SELECT policy by default. Missing INSERT policy causes silent upload failure when using anon key. Always add:
     - `CREATE POLICY "Upload <bucket>" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '<bucket>')`
     - `CREATE POLICY "Update <bucket>" ON storage.objects FOR UPDATE USING (bucket_id = '<bucket>')`
     - `CREATE POLICY "Delete <bucket>" ON storage.objects FOR DELETE USING (bucket_id = '<bucket>')`

33. **`image_url` columns must be TEXT, not VARCHAR:** Gemini AI generates base64 images (`data:image/png;base64,...`) which can be 300KB-500KB. VARCHAR(255) is way too small. Use TEXT in all tables that store image URLs (`services`, `blogs`, `seo_articles`). When migration fails (upload error), base64 URL is stored as fallback — TEXT is essential.

34. **Vercel CLI is available locally:** `npx vercel` is installed and authenticated as `vn002187444-8486`. Useful commands:
     - `npx vercel list --prod` — list production deployments
     - `npx vercel inspect <url>` — inspect deployment details (aliases, status, target)
     - `npx vercel alias set <deployment-url> <domain>` — assign domain alias
     - `npx vercel whoami` — check auth status
     - Note: VERCEL_TOKEN is NOT in .env.local — CI uses GitHub secrets. Local CLI uses its own auth (saved in system credential manager).

35. **Check GitHub Deployments API for deploy verification:** After CI reports success, check `GET /repos/{owner}/{repo}/deployments` for production deployment records. The GitHub Deployments API shows the actual production deployment, while GitHub Actions runs may report success without updating the production alias.

36. **Chrome DevTools MCP is configured but NOT exposed as a tool:** `opencode.json` has `chrome-devtools-mcp` configured but its tools are not available in the current conversation context. If you need to inspect browser console/network, ask the user to open DevTools manually (F12 → Console tab → screenshot errors).
    - Add a summary section to PLAN.md with `✅` status
    - Remove ALL completed items from UPGRADE_PLAN.md (not just mark them done)
    - Keep UPGRADE_PLAN.md under 100 lines — it should read like a sprint backlog, not release notes
    - Arcived details live in PLAN.md + docs/Log.md + docs/Audit.md

## 3. Schema Mismatch Lesson (Learned Jun 2026)
- **Root cause:** Developers added columns in code `.select('col1, col2, ...')` without running migration to add those columns to the database. Error 42703 `column X does not exist` on Vercel.
- **6 mismatches found:** `attendance.note`, `cash_register.is_active`, `appointments.discount_amount`, `appointment_services.{id,price,discount_amount}`, `seo_settings.{theme,mascot}`, `seo_articles.{status,topic_source,blog_slug,published_at}`.
- **Fix:** Migration file uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotent, safe through pooler), then update `database.sql`.
- **Prevention:** Rule 11b — always verify `.select()` columns against `database.sql` before writing code. Use `schema_sync` tool periodically. Add schema audit step to Cycle Protocol (Rule 4).

## 3. CI/CD & Vercel Deployment Lessons (Learned Jun 2026)
- **sharp runtime error:** `SHARP_IGNORE_GLOBAL_LIBVIPS=1` causes Vercel crash (libvips not found). Remove from build script + vercel.json env. Keep `@img/sharp-linux-x64` in `optionalDependencies`.
- **Note:** `sharp` version `0.35.1` expects libvips `1.2.x`. Do NOT include `@img/sharp-libvips-linux-x64` separately in `optionalDependencies` — npm may resolve a mismatched version (e.g., `^1.3.0` → libvips 8.18.3, which sharp 0.35.1 cannot load, causing `ERR_DLOPEN_FAILED`).
- **⚠️ CRITICAL: Top-level `import sharp` in `"use server"` files crashes ALL server actions in that module.** When `sharp` is imported at module top level and fails to load (e.g., libvips mismatch), the ENTIRE module fails — every server action in that file becomes unusable. This causes "Server Components render" errors on ANY page that calls ANY action from that file. **Fix:** use dynamic import (`const sharp = (await import('sharp')).default`) inside the specific function that needs it, never at module top level.
- **Vercel project name:** `vercel.json` needs `"name": "minhair"` or CLI fails with `---` in auto-generated name.
- **Supabase Management API timeout:** v2.107+ calls `api.supabase.com/v1/projects/{ref}/...` on init. Block via custom `global.fetch` in `createClient` options.
- **Always verify full CI pipeline:** lint → test → build → deploy. Don't stop at build success.
- **Verify production domain alias separately:** `npx vercel --prod` may succeed but NOT alias the new deployment to the production domain. Always check `npx vercel list --prod` + `npx vercel inspect <url>` for alias confirmation. Fix with `npx vercel alias set <deployment-url> <domain>` if needed.
- **GitHub Deployments API vs Actions runs:** CI Actions can report "completed success" while the actual Vercel production deployment is still on an older commit. Always cross-check with GitHub Deployments API (`/repos/{owner}/{repo}/deployments`).

## 3.5 V3.14 Payroll Notes (Jun 2026)
- **Payroll calculation** sums commission from `appointments.commission_amount` + `customer_packages.commission_amount` + `appointments.tip_amount` + `users.base_salary`.
- **Cash register integration:** `processPayrollPayment()` inserts a `CHI` record with category `'Chi lương'` referencing the `salary_payments` record.
- **Database:** `salary_payments` table stores per-staff period data; `users` table has `base_salary`, `bank_account`, `bank_name`.
- **Migration pattern:** Use `DO $$` blocks with `IF NOT EXISTS` guards for idempotent column additions + table creation.
- **RPC not needed** for payroll — all logic is in server actions with Supabase JS client queries.

## 4. Auth System
- **Custom JWT** stored in `session` cookie (httpOnly, secure, sameSite=lax)
- **Proxy (Middleware):** `proxy.ts` — protects `/admin/*` routes with JWT verification (Next.js 16 convention)
- **Login:** `/app/login/actions.ts` — server actions that return JWT
- **Logout:** Clear `session` cookie
- **Admin bypass:** Route handler `/api/auth/me` as fallback
- **Password:** bcrypt hash via `lib/password.ts` stored in `users.password_hash` column

## 4. Database Quick Ref (34 tables)
Main tables: `users`, `services`, `appointments`, `appointment_services`, `audit_logs`, `blogs`, `blog_views`, `blog_stats`, `customers`, `treatment_packages`, `customer_packages`, `package_usage_logs`, `notifications`, `time_slot_locks`, `reviews`, `seo_settings`, `seo_articles`, `banner_settings`, `bank_settings`, `attendance`, `attendance_reminders_log`, `random_booking_reminders_log`, `unaccepted_booking_reminders_log`, `uncompleted_booking_reminders_log`, `staff_skills`, `auto_assign_logs`, `slot_limits`, `tasks`, `auto_seo_config`, `rate_limits`, `ai_cache`, `cash_register`, `cron_job_logs`, `background_tasks`

Tables added in V3.9/V3.13: `cash_register` (V3.9 — sổ quỹ tiền mặt), `cron_job_logs` (V3.13 — cron execution log), `background_tasks` (V3.13 — job queue for async operations)

Key conventions:
- `created_at`/`updated_at` timestamps (prefer `timezone('utc', now())`)
- `is_active` boolean for soft delete
- `staff_id` references `users(id)`
- `appointment_id` references `appointments(id)`
- Single-row config tables (`seo_settings`, `banner_settings`, `bank_settings`, `auto_seo_config`) use `CHECK (id = 1)`
- `blogs` has: `image_alt`, `keywords`, `published` (boolean), `published_at` (timestamp), `image_url` (VARCHAR(255) — **watch for truncation** with long Unsplash search URLs)
- `auto_seo_config` has: `schedule_days` (JSONB), `schedule_hour` (int), `topic_pool` (JSONB), `enabled` (boolean)

## 5. Booking Engine
Flow: Select date → Select staff → Select services → Select time slot → Customer info → Confirm

Key logic (`lib/booking-engine.ts`):
- **Cascade Shift:** If service A (30min) + service B (60min) = total 90min → adjacent slots are locked
- **Time slots:** 9:00-20:30, 15min intervals
- **Staff timezone:** Vietnam (UTC+7)
- **Slot resolution:** `parseTime` helper with fallback logic

## 6. Notification & Monitoring
- **Realtime:** Supabase Realtime via `lib/realtime.ts` — listens for appointment changes
- **Push:** Web Push API via `utils/push.ts` + `app/api/subscribe/`
- **Email:** Resend via `lib/notify.ts` — reminder + marketing campaigns
- **Zalo OA:** Zalo Official Account via `lib/zalo.ts` — minibar notifications
- **Cron Marketing:** `app/api/cron/marketing/` — dormant >30 day push + birthday offers (bảo vệ CRON_SECRET)
- **Monitoring:** `/api/health` endpoint (Supabase connectivity), Sentry (`sentry.client.config.ts` + `sentry.server.config.ts` + `instrumentation.ts`)
- **Logger:** `lib/logger.ts` — `Sentry.captureException` for server errors, `logAuditAction` for audit trail
- **Error tracking:** `global-error.tsx`, `error.tsx` per route segment

## 7. File Management Rules
1. **Do not create new files** if existing files can be modified
2. **Check git log** before creating files — the file might have been deleted/renamed
3. **Use `scripts/debug/`** for one-time/utility scripts
4. **Use `scripts/tools/`** for reusable tooling scripts
5. **Archive old docs** in `docs/archive/`
6. **Source data** goes in `data/`, executable scripts in `scripts/`
7. **Types** go in `types/` or co-located with components (prefer co-located)
8. **Remove unused files** — check git log for deletion history

## 8. Key Files Reference
| File | Purpose |
|------|---------|
| `app/booking/` | Booking flow (6 steps) |
| `app/admin/` | Admin dashboard |
| `app/api/` | API routes (auth, booking, cron, marketing, health, etc.) |
| `components/` | React components |
| `lib/` | Shared utilities (auth, booking-engine, database, themes, etc.) |
| `scripts/` | Seed, migrate, backup |
| `types/` | TypeScript interfaces |
| `docs/` | Documentation |
| `.agents/skills/` | AI skill files |
| `app/api/cron/` | Cron job endpoints (reminders, marketing, auto-assign) |

## 9. RLS & Realtime Reference

All 34 tables have RLS enabled ✅. Realtime publication `supabase_realtime` includes 9 tables:

| Table | Realtime | Why |
|-------|----------|-----|
| `appointments` | ✅ | Booking status updates (subscribe in Staff/Admin UI) |
| `appointment_services` | ✅ | Booking service details |
| `attendance` | ✅ | Staff check-in/out live updates |
| `auto_assign_logs` | ✅ | Auto-assignment events for staff UI |
| `cron_job_logs` | ✅ | Admin monitoring of cron execution |
| `notifications` | ✅ | In-app notification bell |
| `staff_skills` | ✅ | Staff skill/certificate assignments |
| `tasks` | ✅ | Staff task assignments |
| `time_slot_locks` | ✅ | Slot availability for booking |

Remaining 25 tables (no realtime): `ai_cache`, `attendance_reminders_log`, `audit_logs`, `auto_seo_config`, `background_tasks`, `bank_settings`, `banner_settings`, `blog_stats`, `blog_views`, `blogs`, `cash_register`, `customer_packages`, `customers`, `package_usage_logs`, `random_booking_reminders_log`, `rate_limits`, `reviews`, `seo_articles`, `seo_settings`, `services`, `slot_limits`, `treatment_packages`, `unaccepted_booking_reminders_log`, `uncompleted_booking_reminders_log`, `users`

## 10. Current Status
- **All migrations consolidated** into `database.sql` (34 tables, all RLS enabled, 9 realtime)
- **No orphan migration files** — archive cleared, `migrations/` directory empty
- `scripts/run-migrations.mjs` — robust runner with per-statement execution + idempotent error tolerance (uses `POSTGRES_URL_NON_POOLING` for system catalog queries)
- `scripts/tools/monitor_queries.sql` — EXPLAIN ANALYZE perf tool (not a table to create)
- **All 86 items completed** across Sessions 1–16 (4 Khối chiến lược)
- **V3.1–V3.13 completed** (Financials + Stability & Polish)
- **Khối 1 (Cleanup)** — 10/10 items ✅
- **Khối 2 (Security & Data)** — 18/18 items ✅ (incl. RLS, rate-limit, env validation, testing, analytics, notifications, backup, CI/CD)
- **Khối 3 (AI & Performance)** — 18/18 items ✅ (incl. Gemini schema, caching, Realtime, pg_cron migration, pgmq queue)
- **Khối 4 (UX Polish)** — 32/32 items ✅ (incl. PWA, SEO, accessibility, dynamic theming, marketing automation, monitoring)
- **UPGRADE_PLAN.md** — Execution plan chính (đã hoàn thành toàn bộ)
- **PLAN.md** — Bản nháp tham khảo (giữ workflow + cycle protocol)
- **AI_MAP.md** — AI context map for file relationships

## 11. Recent Updates (Jul 2026)
### SEO Image Alt Text
- `image_alt` column added to `blogs`, `services`, `seo_articles` tables
- AI assist returns `imageAlts` array alongside suggested images
- Admin blog form, BlogRichEditor, rendering OG metadata use `image_alt`
- Fallback to `post.title` if empty

### OG Image Fix
- Default OG image changed from SVG → PNG (`/icons/icon-512.png`)
- `og_image_url` in `seo_settings` points to `/og-image.png`
- `robots.txt` disallows `/admin/`, `/staff/`, `/api/`, `/login/`
- Logo added to `WebSiteSchema`

### Language Switcher
- `GoogleTranslate.tsx`: globe button + dropdown UI (9 languages)
- Google Translate script now loaded dynamically via `useEffect` (not `next/script` in layout) — ensures `#google_translate_element` div is in DOM before script runs
- Cookie-based language switch: set `googtrans=/vi/{lang}` then `window.location.reload()`
- CSP expanded: `frame-src` includes `translate.googleapis.com`, `www.gstatic.com`, `*.google.com`
- Type declarations for `Window.googleTranslateElementInit` and `google.translate.TranslateElement` in `types/index.ts`
- CSS hides banner: `.goog-te-banner-frame { display: none !important; }`

### Admin SEO Articles Page
- New page `app/admin/seo-articles/page.tsx` — list, create, edit, delete, publish to blog
- Added to admin sidebar under "CẤU HÌNH → Bài viết SEO"

### Sitemap
- `app/sitemap.ts` now includes `seo_articles` entries (with `blog_slug`)

### Breadcrumb Schema
- Added `BreadcrumbSchema` to `app/blog/page.tsx` and `app/booking/page.tsx`

### 0 lint warnings, 0 typecheck errors, 41 static pages build ✅ (Jul 3, 2026)

### Auto-SEO & Image Search Fixes
- `lib/auto-seo.ts`: blog insert now includes `published: true`, `published_at`
- `lib/image-search.ts`: uses Unsplash `urls.small` + Pexels `src.medium` (no more append `?w=800&auto=format&fit=crop`)
- `app/admin/actions.ts`: `triggerCronJob` sends `CRON_SECRET` Bearer token; `publishSeoArticleToBlog` accepts `image_alt` + `keywords` options
- `app/api/cron/seo-publish/route.ts`: accepts admin session as auth fallback
- `app/admin/components/TabSEO.tsx`: saved articles editor has full SEO fields (keywords, image URL, image alt text)
- `getSeoArticles()` in `app/admin/actions.ts` returns `imageAlt` from `image_alt` column

### VARCHAR(255) Truncation Fix
- 3 existing blog records had image URLs truncated to 251 chars (old code appended `?w=800&auto=format&fit=crop` to already-long Unsplash search URLs)
- Fixed via SQL UPDATE: replaced truncated URLs with clean `https://images.unsplash.com/photo-{id}?w=400` (66 chars)
- 5 auto-SEO draft records published (set `published=true`, `published_at=now`)

### Type Fix: image-search.ts
- Unsplash API response type expanded: `urls` now includes `raw`, `full`, `small`, `thumb` (was only `regular`)
- This was causing build error: `Property 'small' does not exist on type`

### Image Search Cascade (Updated)
- `searchImages()` cascade: Unsplash API (`urls.small`) → Pexels API (`src.medium`) → `getSuggestedImages()` (static categorized pool)
- Static pool URLs use `?w=800&auto=format&fit=crop` — these are short hardcoded URLs, safe from VARCHAR truncation

## 12. Key Files Reference (Updated)
### Routes
| Route | File | Description |
|-------|------|-------------|
| `/admin/seo-articles` | `app/admin/seo-articles/page.tsx` | SEO articles CRUD (list, create, edit, delete, publish to blog) |

### Components
| Component | File | Description |
|-----------|------|-------------|
| `GoogleTranslate` | `components/GoogleTranslate.tsx` | Language switcher (globe button + dropdown, 9 languages) |
| `BreadcrumbSchema` | `components/BreadcrumbSchema.tsx` | BreadcrumbList JSON-LD |
| `BreadcrumbNav` | `components/BreadcrumbNav.tsx` | UI breadcrumb navigation |
| `ArticleSchema` | `components/ArticleSchema.tsx` | BlogPosting JSON-LD |

### Schema
| Table | New Columns |
|-------|-------------|
| `blogs` | +`image_alt`, +`keywords`, +`published`, +`published_at` |
| `services` | +`image_alt`, +`image_url` |
| `seo_articles` | +`image_alt`, +`status`, +`topic_source`, +`blog_slug`, +`published_at` |
| `seo_settings` | +`og_image_url`, +`logo_url`, +`facebook_url`, +`zalo_url`, +`hotline` |
