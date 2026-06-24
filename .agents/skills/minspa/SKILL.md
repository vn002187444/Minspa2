---
name: minspa
description: >-
  Min Nail & Hair Salon project knowledge base. Next.js 16 + Supabase + custom JWT auth. Use for all tasks related to this codebase — booking engine, admin, staff scheduling, SEO, marketing, monitoring, infrastructure.
---

# MinSpa Project Skill

## 1. Project Overview
- **Name:** Min Nail & Hair Salon
- **Stack:** Next.js 16 (React 19) + Supabase (PostgreSQL) + TypeScript
- **Deploy:** Vercel (free tier)
- **Auth:** Custom JWT (NOT Supabase Auth) — `app/login/` + middleware
- **AI Tools:** Google Gemini (`gemini-2.5-flash-lite`) via `@google/genai`
- **Styling:** Tailwind CSS v4 + Framer Motion (`framer-motion`) for animations

## 2. Critical Rules
1. **`database.sql` is the schema source of truth** — keep it in sync with all migration files. When adding tables/columns via migrations, also add them to `database.sql` (tables → RLS → Realtime). See section 10 for the sync checklist.
2. **Soft delete only** — use `is_active` or `status='cancelled'` columns, never DELETE FROM
3. **No SELECT \*** — always specify columns in queries
4. **Cycle Protocol (revised):** Audit first → Read UPGRADE_PLAN.md + AI_MAP.md → Read existing files for conventions → **Audit schema mismatches (grep .select() vs database.sql)** → Code → Update docs (PLAN.md, UPGRADE_PLAN.md, SKILL.md) → `npm run build` verify → Commit
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
12. **Single source of truth:** PLAN.md is the permanent project plan. UPGRADE_PLAN.md is the active execution plan. After completing a session, merge the results into PLAN.md and remove from UPGRADE_PLAN.md.
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

## 3.5 V3.14 Payroll Notes (Jun 2026)
- **Payroll calculation** sums commission from `appointments.commission_amount` + `customer_packages.commission_amount` + `appointments.tip_amount` + `users.base_salary`.
- **Cash register integration:** `processPayrollPayment()` inserts a `CHI` record with category `'Chi lương'` referencing the `salary_payments` record.
- **Database:** `salary_payments` table stores per-staff period data; `users` table has `base_salary`, `bank_account`, `bank_name`.
- **Migration pattern:** Use `DO $$` blocks with `IF NOT EXISTS` guards for idempotent column additions + table creation.
- **RPC not needed** for payroll — all logic is in server actions with Supabase JS client queries.

## 4. Auth System
- **Custom JWT** stored in `session` cookie (httpOnly, secure, sameSite=lax)
- **Middleware:** `middleware.ts` — protects `/admin/*` routes with JWT verification
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
