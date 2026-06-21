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
- **AI Tools:** Google Gemini (`gemini-3.1-flash-lite`) via `@google/genai`
- **Styling:** Tailwind CSS v4 + Framer Motion (`framer-motion`) for animations

## 2. Critical Rules
1. **NEVER edit `database.sql`** — it's the immutable schema source. Create new migration files in `scripts/` instead.
2. **Soft delete only** — use `is_active` or `deleted_at` columns, never DELETE FROM
3. **No SELECT \*** — always specify columns in queries
4. **Cycle Protocol (revised):** Audit first → Read UPGRADE_PLAN.md + AI_MAP.md → Read existing files for conventions → Code → Update docs (PLAN.md, UPGRADE_PLAN.md, SKILL.md) → `npm run build` verify → Commit
5. **Build check:** Must pass `npm run build` before any commit (TypeScript + 41 static pages). Run after EVERY batch of changes.
6. **File management:** Prefer editing existing files over creating new ones. Check git log / git diff before creating new files.
7. **Initial audit required:** At the start of any session, first audit the existing codebase to find orphan features (BE without FE UI), mojibake/encoding issues, and types that don't match reality.
8. **Batch parallel reads:** Read all relevant files in parallel at the start of a task to understand conventions and avoid type cascading errors.
9. **Types first:** Define interfaces/types before writing logic. Never use `any` as a function parameter type. If Supabase query returns unknown shape, define an interface.
10. **Form accessibility checklist:** Every form must have `htmlFor` on label + matching `id` on input. Every modal must have `useFocusTrap` with `ref={trapRef}` on the dialog container.
11. **No orphan migrations:** After applying a migration to Supabase, move the file to `scripts/archive/` or add `.applied` suffix — don't leave hanging files that create confusion about what has been applied.
12. **Single source of truth:** PLAN.md is the permanent project plan. UPGRADE_PLAN.md is the active execution plan. After completing a session, merge the results into PLAN.md and remove from UPGRADE_PLAN.md.

## 3. Auth System
- **Custom JWT** stored in `session` cookie (httpOnly, secure, sameSite=lax)
- **Middleware:** `middleware.ts` — protects `/admin/*` routes with JWT verification
- **Login:** `/app/login/actions.ts` — server actions that return JWT
- **Logout:** Clear `session` cookie
- **Admin bypass:** Route handler `/api/auth/me` as fallback
- **Password:** bcrypt hash via `lib/password.ts` stored in `users.password_hash` column

## 4. Database Quick Ref (18 tables)
Main tables: `users`, `services`, `appointments`, `appointment_services`, `audit_logs`, `blogs`, `customers`, `treatment_packages`, `customer_packages`, `package_usage_logs`, `notifications`, `push_subscriptions`, `time_slot_locks`, `commissions`, `service_staff`, `reviews`, `seo_settings`, `seo_articles`

Key conventions:
- `created_at`/`updated_at` timestamps
- `is_active` boolean for soft delete
- `staff_id` references `staff(id)`
- `appointment_id` references `appointments(id)`

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

## 9. Current Status
- **All 86 items completed** across Sessions 1–16 (4 Khối chiến lược)
- **Khối 1 (Cleanup)** — 10/10 items ✅
- **Khối 2 (Security & Data)** — 18/18 items ✅ (incl. RLS, rate-limit, env validation, testing, analytics, notifications, backup, CI/CD)
- **Khối 3 (AI & Performance)** — 18/18 items ✅ (incl. Gemini schema, caching, Realtime, pg_cron migration, pgmq queue)
- **Khối 4 (UX Polish)** — 32/32 items ✅ (incl. PWA, SEO, accessibility, dynamic theming, marketing automation, monitoring)
- **UPGRADE_PLAN.md** — Execution plan chính (đã hoàn thành toàn bộ)
- **PLAN.md** — Bản nháp tham khảo (giữ workflow + cycle protocol)
- **AI_MAP.md** — AI context map for file relationships
