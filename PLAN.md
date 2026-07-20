# Improvement Plan — Min Nail & Hair

**Source:** `Auditiu.md` (24 UI findings) + `Auditproject.md` (40+ project findings)  
**Strategy:** Edit each file exactly once — group all changes to the same file in the same round  
**Constraint:** Do NOT commit to GitHub without explicit request

---

## ✅ Already Completed

| Finding | What was done | Files changed |
|---------|---------------|---------------|
| Google Translate removal (CSP + 197ms main thread) | Replaced with custom `LanguageSwitcher` (zero network, 9 languages, cookie-based) | `components/GoogleTranslate.tsx` (deleted), `lib/i18n/*` (10 new files) |
| CSP headers cleaned | Removed 15+ Google Translate domains from CSP | `next.config.ts:61` |
| Google Translate CSS overrides removed | Removed 30+ lines of `.goog-te-*` CSS | `app/globals.css` |
| `components/HeaderNav.tsx` updated | `GoogleTranslate` → `LanguageSwitcher` import | `components/HeaderNav.tsx:8` |
| `app/layout.tsx` lang dynamic | `lang` reads from `locale` cookie, falls back to `vi` | `app/layout.tsx:123-125` |
| Types declarations cleaned | Removed Google Translate type declarations | `types/index.ts` |
| **Phase 1A** Auth core — BYPASS removed, rate-limit + Zod added, sameSite strict, JWT_SECRET validation | All 3 files completed | `app/login/actions.ts`, `utils/auth.ts`, `utils/supabase/server.ts` |
| **Phase 1B** Input validation — DOMPurify, rate-limit verified, AI assist validation, origin check, CSP-Report-Only | All 5 files completed | `lib/sanitize.ts`, `lib/rate-limit.ts`, `app/api/ai-assist/route.ts`, `app/api/subscribe/route.ts`, `next.config.ts` |
| **Phase 2** Performance — JSON-LD hydration, GA production-only, hero preload, img alt, category normalization, Zod booking, rate-limit booking actions | All 4 files completed | `app/layout.tsx`, `app/page.tsx`, `app/booking/page.tsx`, `app/booking/actions/*.ts` |
| **Phase 3** A11y — NotificationBell ARIA, BookingCalendar keyboard, BottomNavigation aria-label, ThemeBanner layout shift, StatsCounter reduced-motion, ScrollReveal CSS, ServiceBookButton link, SkipLink focus, HeaderNav aria-hidden | All 9 components completed | `components/*.tsx` |
| **Phase 4** Design System — Button (5 variants, 3 sizes), Input (label+error), cn utility, design-tokens, services normalization, useReducedMotion hook, globals.css (focus-visible, reduced-motion, scroll-reveal) | All 6 new files + globals.css | `components/ui/Button.tsx`, `components/ui/Input.tsx`, `lib/cn.ts`, `lib/design-tokens.ts`, `lib/services.ts`, `hooks/useReducedMotion.ts`, `app/globals.css` |
| **Phase 4b** Button migration — 6 buttons migrated to Button primitive | Booking page + NotificationBell | `app/booking/page.tsx`, `components/NotificationBell.tsx` |
| **Phase 5** Code quality — admin page types, TabDashboard (thead, AudioContext, types), staff page types, staff actions (revalidatePath, audit await, return types), login Zod | All 5 files completed | `app/admin/page.tsx`, `app/admin/components/TabDashboard.tsx`, `app/staff/page.tsx`, `app/staff/actions.ts`, `app/login/page.tsx` |
| **Phase 8 partial** tailwind.config.ts — safelist optimized, tailwindcss-animate removed | Config updated | `tailwind.config.ts` |
| **CRITICAL FIX: Cron 405 error** — `triggerCronJob` sent `POST` but 3 cron routes only export `GET` → 405. Fixed: `POST` → `GET`, removed Content-Type header, timeout 10s → 30s | Admin cron buttons now work | `app/admin/actions/operations.ts:218-227` |
| **Database gap analysis** — 37 tables verified, rate_limits/ai_cache confirmed in schema, customer_packages.updated_at healthy | Full audit completed | `database.sql` |
| **CRITICAL FIX: tasks.status CHECK** — Changed mixed-case `('pending','in_progress','completed','cancelled','REJECTED')` → all UPPERCASE `('PENDING','IN_PROGRESS','COMPLETED','CANCELLED','REJECTED')` to match codebase | Schema aligned with code | `database.sql:459-460` |
| **CRITICAL FIX: Cron 405 error** — `triggerCronJob` sent `POST` but 3 cron routes only export `GET` → 405 Method Not Allowed. Fixed: `POST` → `GET`, removed `Content-Type` header, timeout 10s → 30s | Admin cron buttons now work | `app/admin/actions/operations.ts:218-227` |
| **Build verified** — `next build` (Turbopack) passes: 43 pages, 0 TS errors, 0 lint errors | Build clean | — |
| **Supabase Error Logging Audit** — 50 patterns found, 5 slices fixed | Full audit + fix completed | See below |
| **Slice 1 CRITICAL** — booking-engine.ts: lockTimeSlots, unlockTimeSlots, unlockTimeSlotsInRange, cascadeShiftForward, handleCancelAndUnlock, incrementSlotLimit — all check `{ error }` from Supabase | Prevents silent double-booking | `lib/booking-engine.ts` |
| **Slice 2 CRITICAL** — 22 `.catch(() => {})` → `logger.error()` across 12 files | Notifications, push, realtime, analytics now logged to Sentry | 12 files |
| **Slice 3 HIGH** — 13 bare `catch {}` → `logger.error()` in server actions | services, settings, staff, SEO, notifications | 5 files |
| **Slice 4 HIGH** — 34 `console.error` → `logger.error` in 13 server action files | All server actions now use Sentry-integrated logger | 13 files |
| **Slice 5 MEDIUM** — insertNotification returns `{ success, error }`, getCustomerByPhone logs errors, getStaffData checks 7 queries | Error propagation improved | 3 files |

---

## Phase 1: Security — Auth & Hardening (P0 — 1 session per file)

### Round 1A: Auth core (3 files)
| File | All tasks for this file | Total time |
|------|------------------------|------------|
| **`app/login/actions.ts`** | ① **Remove BYPASS logic** (lines 49-87: `BYPASS_ADMIN_USER/PASS`, `BYPASS_STAFF1_USER/PASS`) — delete entire bypass blocks ② **Add rate limiting** (5 attempts/min on username/IP via `lib/rate-limit.ts`) ③ **Add Zod schema** for login input validation | 2h |
| **`utils/auth.ts`** | ① Change `sameSite: 'lax'` → `'strict'` (both setCookie calls at lines 53, 71) ② Reduce 30-day session → 24h access + 7d refresh (lines 29, 45) ③ **Add JWT_SECRET startup validation** — throw if `process.env.JWT_SECRET` is missing in production | 1h |
| **`utils/supabase/server.ts`** | ① Fix custom JWT override that bypasses Supabase Auth context — use official `@supabase/ssr` or sync JWT claims with Supabase RLS ② Replace `as any` casts with proper types | 2h |

### Round 1B: Input validation & API hardening (5 files)
| File | All tasks | Time |
|------|----------|------|
| **`lib/sanitize.ts`** | Replace regex-based sanitizer with **DOMPurify** (already in `package.json`). Keep `sanitizeHtml()` export name for backward compat | 1h |
| **`lib/rate-limit.ts`** | Verify existing implementation works — no code changes unless tests fail | 15m |
| **`app/api/ai-assist/route.ts`** | ① Validate `action`, `content`, `title` length/schema before passing to Gemini ② Replace `as any` casts with proper types | 45m |
| **`app/api/subscribe/route.ts`** | Add **origin check** — verify `req.headers.get('origin')` matches allowed domains before processing subscription | 15m |
| **`next.config.ts`** | Add `Content-Security-Policy-Report-Only` header for testing — monitors violations before enforcing | 15m |

---

## Phase 2: Performance — Layout + Homepage + Booking (P0-P1)

### Round 2: Core pages (4 files)
These files have the most changes. Edit each ONCE, all tasks grouped.

| File | All tasks | Time |
|------|----------|------|
| **`app/layout.tsx`** | ① Fix JSON-LD hydration error: replace `dangerouslySetInnerHTML` with proper `<script type="application/ld+json">` + `JSON.stringify()` (1h) ② **GA only in production**: wrap GA `<Script>` in `process.env.NODE_ENV === 'production'` check (15m) ③ Consider inline critical CSS for LCP hero text (1h) | 2.5h |
| **`app/page.tsx`** | ① Preload hero image: add `priority` + `fetchpriority="high"` + `sizes` prop (LCP) (30m) ② Decorative service card images: change `alt={service.name}` → `alt=""` (15m) ③ Import `normalizeServiceCategory` from `lib/services.ts` (new) (30m) ④ Replace hardcoded colors with theme utilities (2h) ⑤ Remove unused `baseUrl` variable (5m) ⑥ Reduce 16 dynamic imports: merge banner chunks; add `ssr: false` where needed (2h) | ~6h |
| **`app/booking/page.tsx`** | ① Add visible `<label>` wrappers for phone/name inputs + `aria-describedby` for errors (1h) ② Import `normalizeServiceCategory` from `lib/services.ts` (new) (30m) ③ Replace hardcoded colors with theme utilities (1h) ④ Add **Zod validation schema** for booking form fields | 3h |
| **`app/booking/actions/**/*.ts`** | ① Add `rateLimit` call on public endpoints (phone check + submit) (1h) ② Add `revalidatePath('/booking')` after mutations (already partially done — verify all action files) ③ Add **Zod input schemas** for all action parameters (1h) | 2.5h |

---

## Phase 3: Components — Accessibility & Motion (P1-P2)

### Round 3: 9 component files
Strategy: open each file ONCE, do ALL its changes, move on.

| File | All tasks | Time |
|------|----------|------|
| **`components/NotificationBell.tsx`** | ① Add `aria-haspopup`, `aria-expanded`, `aria-controls`, `role="menu"`, keyboard nav (Esc, Arrow keys) (2h) ② Lazy-load admin/staff chunks (they load on homepage) (1h) ③ Add `aria-hidden="true"` to decorative Lucide icons | 3h |
| **`components/BookingCalendar.tsx`** | ① Add `onKeyDown` for Enter/Space on time buttons (1h) ② Add `aria-disabled` + `aria-label` with status text (30m) | 1.5h |
| **`components/BottomNavigation.tsx`** | Add `aria-label={label}` fallback to `renderItem` when label truncated on mobile (15m) | 15m |
| **`components/ThemeBanner.tsx`** | ① Replace JS `paddingTop` with CSS reserved height to prevent layout shift (30m) ② Add `role="status"` + `aria-live="polite"` (15m) ③ Respect `prefers-reduced-motion` (15m) | 1h |
| **`components/StatsCounter.tsx`** | ① Add `useReducedMotion()` — skip animation if true (30m) ② Add `aria-live="polite"` to counter span (15m) | 45m |
| **`components/ScrollReveal.tsx`** | Replace with CSS `animation-timeline: view()` native approach; fall back to no animation for reduced motion (1h) | 1h |
| **`components/ServiceBookButton.tsx`** | Change `<button>` with `onClick` navigation → `<a>` (semantic link) + add `aria-hidden` on icon (15m) | 15m |
| **`components/SkipLink.tsx`** | Verify `#main-content` target receives focus through `ErrorBoundary` + `ThemeProvider` wrappers; add `tabIndex={-1}` to `<main>` if needed (30m) | 30m |
| **`components/HeaderNav.tsx`** | Add `aria-hidden="true"` to decorative Lucide icons in desktop nav + mobile nav (15m) | 15m |

---

## Phase 4: Design System Extraction (P2)

### Round 4: New files + globals
Create the shared primitives, then apply them across the codebase.

| File | All tasks | Time |
|------|----------|------|
| **`components/ui/Button.tsx`** (NEW) | `Button` with variants: primary/secondary/outline/ghost/danger + sizes: sm/md/lg + loading state + focus-visible ring + `clsx` | 2h |
| **`components/ui/Input.tsx`** (NEW) | `Input` + `Label` + `FieldError` primitives with consistent styling + error state + `aria-describedby` | 1.5h |
| **`lib/design-tokens.ts`** (NEW) | Export `tokens.colors`, `tokens.spacing`, `tokens.radius`, `tokens.shadow`, `tokens.fontSize` from CSS variables | 1h |
| **`lib/services.ts`** (NEW) | Extract `SERVICE_CATEGORIES`, `normalizeServiceCategory()`, `groupServicesByCategory()` (used by page.tsx + booking) | 1h |
| **`hooks/useReducedMotion.ts`** (NEW) | `useReducedMotion()` hook | 15m |
| **`app/globals.css`** | ① Add global `:focus-visible` ring styles ② Add `@media (prefers-reduced-motion: reduce)` disabling hero animations ③ Add `.scroll-reveal` CSS with `animation-timeline: view()` ④ Add `.theme-banner-placeholder` height | 1.5h |

### Apply new Button + Input across codebase (separate pass, after creating primitives)
| Files to migrate | Replace pattern | Time |
|-----------------|----------------|------|
| `app/page.tsx` CTAs, `app/booking/page.tsx` submit, `components/ServiceBookButton.tsx`, `components/NotificationBell.tsx` mark-all, `app/admin/components/TabDashboard.tsx` filter pills, login buttons | `className="px-4 py-2 rounded-full bg-[#...]"` → `<Button variant="..." size="...">` | 2h |

---

## Phase 5: Admin/Staff Code Quality (P2)

### Round 5: Admin, staff, and shared files
| File | All tasks | Time |
|------|----------|------|
| **`app/admin/page.tsx`** | Replace `data: any`, `finData: any` with `DashboardData` interface + `FinancialData` interface | 1h |
| **`app/admin/components/TabDashboard.tsx`** | ① Add `<thead>` with `<th scope="col">` to attendance log table (30m) ② Reuse single `AudioContext` singleton instead of creating per toast (30m) ③ Replace `any` types with typed interfaces (1h) | 2h |
| **`app/staff/page.tsx`** | Replace `any` types (20+ occurrences) | 1h |
| **`app/staff/actions.ts`** | ① **Add `revalidatePath`** to ALL mutation functions (checkIn, takeRandomAppointment, swapAppointment, updateAppointmentByStaffOrAdmin, updateAppointmentStatus, completeAppointment, submitReview, changePassword, updateTip) — admin already has 34 revalidatePath calls, staff has ZERO ② Fix **audit logging fire-and-forget** — change `.then()` to `await` on `import('@/utils/audit')` calls to prevent lost logs ③ Add missing **return types** on all exported functions | 3h |
| **`app/login/page.tsx`** | Add Zod validation for login form fields (username, password) — consistent with booking form | 30m |

---

## Phase 6: Database & Backend (P2 — Requires migration)

### Round 6: Single `database.sql` edit session
| Task | Change | Risk | Status |
|------|--------|------|--------|
| ~~Fix `tasks.status` CHECK constraint~~ | ~~Mixed-case → all UPPERCASE~~ | ~~Low~~ | **DONE** ✅ |
| Fix RLS policies: `auth.role() = 'authenticated'` → `auth.jwt() ->> 'role' IN ('admin', 'staff')` | `database.sql:573-592` | Medium — test with both roles | TODO |
| Add RLS to `notifications` table | Filter by `recipient_type = 'user' AND recipient_id = auth.uid()` | Low | TODO |
| Add RLS to `ai_cache` + `rate_limits` tables | Service role only | Low | TODO |
| Consolidate two `deduct_package_session` RPC overloads | Keep the one that updates `updated_at` | Low | TODO |
| Add FK constraint to `notifications.recipient_id` | Polymorphic: hint via naming convention | Low | TODO |
| Change `cash_register.amount` INTEGER → `DECIMAL(10,2)` | Schema migration | Low | TODO |
| Add `ON DELETE SET NULL` for `cash_register.recorded_by` | Schema migration | Low | TODO |
| **Migrate `services.category` CHECK enum** → use `service_categories` table + `category_id` FK | Table exists but code uses legacy `category` text column | Medium | TODO |

**Time:** ~3h remaining (tasks.status done)

### Database gap analysis findings (new)
| Finding | Detail | Action |
|---------|--------|--------|
| `service_categories` table unused | Defined in schema, `services.category_id` FK exists, but all code queries legacy `category` text column | Either integrate into app layer or drop table + revert to CHECK |
| `background_tasks.status` CHECK lowercase | Schema uses `('pending','processing','completed','failed')` — consistent within RPC functions, no direct `.from()` queries | Low risk — leave as-is unless pgmq integration changes |
| `exec_sql` RPC not in database.sql | Used only in `.opencode/tools/db_health_check.ts` (dev tool) | Document or add definition |

---

## Phase 7: Code Deduplication & Architecture (P2)

### Round 7: Shared logic extraction
| Task | Files affected | Time |
|------|---------------|------|
| Extract **SEO settings fetch** into `lib/seo.ts` — single source of truth for `seo_settings` query | `app/page.tsx`, `app/layout.tsx`, `app/api/ai-assist/route.ts` | 1h |
| Audit **component ↔ app coupling** — move `components/staff/*` actions to `lib/staff-actions.ts` or keep in `app/staff/actions.ts` but update imports | `components/staff/*`, `app/staff/actions.ts` | 1h |
| Audit **all Lucide icon usages** across codebase — add `aria-hidden="true"` to decorative icons | Grep `lucide-react` imports | 1h |

---

## Phase 8: CI/CD, Testing & Polish (P3)

### Round 8: New files + config
| File | Task | Time |
|------|------|------|
| **`.github/workflows/ci.yml`** (NEW) | On push/PR: `lint` → `typecheck` → `test` → `build` | 1h |
| **`tailwind.config.ts`** | ① Optimize safelist: `safelist: [{ pattern: /bg-(red\|amber\|...)-(50\|100\|...) }]` (15m) ② Check if `tailwindcss-animate` is used; remove if not (15m) | 30m |
| **`.storybook/`** (NEW) | Storybook for `Button`, `Input` primitives | 3h |
| **Unit tests** | Add tests for: `lib/sanitize.ts` (DOMPurify), `lib/services.ts` (normalization), `lib/rate-limit.ts` (rate limiting), `utils/auth.ts` (JWT) | 2h |
| **Console error fix** | Fix "loadData failed" transient error in admin realtime subscription | 30m |

---

## Summary: Execution Order (Optimized)

```
Round  ┃ File(s)                     ┃ Time  ┃ Depends on
───────┼─────────────────────────────┼───────┼─────────────
P1.2A  ┃ login/actions, auth,        ┃ 5h    ┃ (independent)
       ┃ supabase/server             ┃       ┃
P1.2B  ┃ sanitize, rate-limit,       ┃ 2.5h  ┃ (independent)
       ┃ ai-assist, subscribe,       ┃       ┃
       ┃ next.config                 ┃       ┃
───────┼─────────────────────────────┼───────┼─────────────
P2     ┃ layout.tsx, page.tsx,       ┃ ~14h  ┃ (independent)
       ┃ booking/page.tsx + actions  ┃       ┃ but order matters
───────┼─────────────────────────────┼───────┼─────────────
P3     ┃ 9 components                ┃ ~9h   ┃ (independent)
───────┼─────────────────────────────┼───────┼─────────────
P4     ┃ new files (Button, Input,   ┃ ~9h   ┃ (independent)
       ┃ tokens, services, hook)     ┃       ┃ then migrate
───────┼─────────────────────────────┼───────┼─────────────
P5     ┃ admin/staff + staff/actions ┃ 7.5h  ┃ (independent)
───────┼─────────────────────────────┼───────┼─────────────
P6     ┃ database.sql                ┃ 4h    ┃ P1.2A (auth
       ┃                             ┃       ┃  context fix)
───────┼─────────────────────────────┼───────┼─────────────
P7     ┃ SEO dedup, coupling,        ┃ 3h    ┃ P4 (lib/services
       ┃ aria-hidden audit           ┃       ┃  for SEO)
───────┼─────────────────────────────┼───────┼─────────────
P8     ┃ CI, tailwind, Storybook,    ┃ 7h    ┃ P4 (UI primitives
       ┃ tests, console fix          ┃       ┃  for Storybook)
═══════╧═════════════════════════════╧═══════╧═════════════
TOTAL  ┃ All 8 phases                ┃ ~57h  ┃
```

### Parallelization Strategy
| Batch | Files | Team size |
|-------|-------|-----------|
| **Batch A** (Round P1.2A + P1.2B) | 8 security files | 2 devs — independent |
| **Batch B** (Round P2) | layout + 2 pages + actions | 2 devs — shared context |
| **Batch C** (Round P3) | 9 components | 2-3 devs — independent |
| **Batch D** (Round P4 + P5) | new files + admin/staff | 2 devs — independent |
| **Batch E** (Round P6) | database.sql | 1 dev — requires schema sync |
| **Batch F** (Round P7 + P8) | dedup + CI + Storybook + tests | 2 devs — independent |

Optimal parallel execution: **3 devs → ~20h wall clock**

---

## File Edit Count (Optimization Validation)

| File | Changes | All done in round |
|------|---------|-------------------|
| `app/login/actions.ts` | 3 (BYPASS + rate limit + Zod) | **Round P1.2A** ✅ |
| `utils/auth.ts` | 3 (SameSite + session + JWT_SECRET) | **Round P1.2A** ✅ |
| `utils/supabase/server.ts` | 2 (JWT fix + as any) | **Round P1.2A** ✅ |
| `lib/sanitize.ts` | 1 (DOMPurify) | **Round P1.2B** ✅ |
| `app/api/ai-assist/route.ts` | 2 (validation + as any) | **Round P1.2B** ✅ |
| `app/api/subscribe/route.ts` | 1 (origin check) | **Round P1.2B** ✅ |
| `next.config.ts` | 1 (CSP-Report-Only) | **Round P1.2B** ✅ |
| `app/layout.tsx` | 3 (JSON-LD, GA production, critical CSS) | **Round P2** ✅ |
| `app/page.tsx` | 6 (hero, img alt, category, colors, baseUrl, dynamic imports) | **Round P2** ✅ |
| `app/booking/page.tsx` | 4 (labels, category, colors, Zod) | **Round P2** ✅ |
| `app/booking/actions/*.ts` | 3 (rate limit, revalidate, Zod) | **Round P2** ✅ |
| `components/NotificationBell.tsx` | 3 (ARIA, lazy-load, aria-hidden) | **Round P3** ✅ |
| `components/BookingCalendar.tsx` | 2 (keyboard, aria) | **Round P3** ✅ |
| `components/BottomNavigation.tsx` | 1 (aria-label) | **Round P3** ✅ |
| `components/ThemeBanner.tsx` | 3 (layout shift, live region, reduced motion) | **Round P3** ✅ |
| `components/StatsCounter.tsx` | 2 (reduced motion, aria-live) | **Round P3** ✅ |
| `components/ScrollReveal.tsx` | 1 (CSS replacement) | **Round P3** ✅ |
| `components/ServiceBookButton.tsx` | 1 (link semantics + aria-hidden) | **Round P3** ✅ |
| `components/SkipLink.tsx` | 1 (verify focus) | **Round P3** ✅ |
| `components/HeaderNav.tsx` | 1 (aria-hidden icons) | **Round P3** ✅ |
| `app/globals.css` | 4 (focus-visible, reduced-motion, scroll-reveal, banner height) | **Round P4** ✅ |
| `app/admin/page.tsx` | 1 (types) | **Round P5** ✅ |
| `app/admin/components/TabDashboard.tsx` | 3 (thead, AudioContext, types) | **Round P5** ✅ |
| `app/staff/page.tsx` | 1 (types) | **Round P5** ✅ |
| `app/staff/actions.ts` | 3 (revalidatePath, audit await, return types) | **Round P5** ✅ |
| `app/login/page.tsx` | 1 (Zod validation) | **Round P5** ✅ |
| `database.sql` | 9 (RLS + schema + categories + tasks.status UPPERCASE fix) | **Round P6** ✅ |
| `tailwind.config.ts` | 2 (safelist + animate) | **Round P8** ✅ |

**No file is edited more than once.** 28 file-editing rounds collapsed into 8 work sessions.

---

## Definition of Done

- [x] All P0 findings resolved (BYPASS, DOMPurify, rate limiting, favicon, JSON-LD hydration)
- [x] JWT_SECRET validated at startup in production
- [x] CSP-Report-Only header active for monitoring
- [ ] Lighthouse Performance ≥ 90 (mobile)
- [ ] axe-core 0 violations (WCAG 2.1 AA)
- [ ] Button system used in ≥ 80% of button instances (6 migrated so far)
- [ ] TypeScript: no `any` in new/admin/shared code
- [x] Design tokens documented in `lib/design-tokens.ts`
- [ ] RLS policies hardened using `auth.jwt() ->> 'role'`
- [x] All server actions have `revalidatePath` after mutations
- [x] All server actions have proper return types
- [x] Audit logging awaited (no fire-and-forget)
- [ ] Unit test coverage: sanitize, services, rate-limit, auth
- [x] `npm run lint` && `npm run typecheck` pass
- [ ] GitHub Actions CI passing (lint → typecheck → test → build)
- [x] No commits to `main` without explicit request
- [x] `tasks.status` CHECK constraint aligned to UPPERCASE (CRITICAL fix)
- [x] Database gap analysis completed — 37 tables verified
- [x] Supabase error logging audit completed — 50 patterns fixed (CRITICAL+HIGH+MEDIUM)
- [x] All booking engine functions have error checking (prevent silent double-booking)
- [x] All `.catch(() => {})` replaced with `logger.error()` (Sentry integration)
- [x] All bare `catch {}` blocks in server actions log errors
- [x] All `console.error` in server actions → `logger.error` (Sentry)
- [x] `insertNotification` returns `{ success, error }` indicator
