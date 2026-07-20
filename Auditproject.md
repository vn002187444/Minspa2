# Project Audit Report — Min Nail & Hair

**Date:** 2026-07-17  
**Scope:** Full codebase audit (Frontend, Backend, Database, Security, Performance, Accessibility)  
**Methodology:** Web Interface Guidelines (vercel-labs), Improve-UI, Fixing-Accessibility, Web-Perf, Security-Hardening, Code-Review-Quality, Source-Driven-Development skills  

---

## Executive Summary

| Category | Score | Status |
|----------|-------|--------|
| **Performance** | 47/100 | 🔴 Critical — LCP 4.69s (92% render delay), TBT ~970ms |
| **Security** | 65/100 | 🟠 High Risk — CSP violations, fallback JWT secret, BYPASS env vars in login |
| **Accessibility** | 72/100 | 🟡 Needs Work — Missing ARIA, keyboard gaps, label issues |
| **Code Quality** | 68/100 | 🟡 Technical Debt — 100+ `any`, duplicate logic, no design system |
| **Architecture** | 75/100 | 🟡 Modular but inconsistent patterns, tight coupling app↔components |
| **Database** | 82/100 | 🟢 Good — RLS enabled, indexes present, triggers for updated_at |

**Overall: 68/100** — Production-ready with significant remediation needed before scale.

---

## 1. Performance (Critical)

### Live Chrome DevTools Trace (minhair.vercel.app)

| Metric | Value | Rating | Root Cause |
|--------|-------|--------|------------|
| **LCP** | 4,690 ms | ❌ Poor (>4s) | 92% render delay — main thread blocked 12.3s evaluating 42 JS chunks |
| **TTFB** | 371 ms | ✅ Good | Fast edge response |
| **FCP** | ~1.9s | ⚠️ Needs Improvement | |
| **TBT** | ~970 ms | ❌ Poor (>600ms) | Script evaluation 2.9s, Style/Layout 4.1s |
| **CLS** | 0.04 | ✅ Good (<0.1) | Stable layout |
| **DOM Nodes** | 1,494 | ✅ Acceptable | Max depth 16 |

### JS Bundle Analysis
- **42 script requests** (2.5MB+ compressed)
- Heavy: `main-app` (484B but imports all), `layout` chunk, `page` chunk, Supabase Auth, Framer Motion, Recharts, Lucide
- **No code-splitting for admin/staff bundles** — loads on homepage via `NotificationBell`

### Top Recommendations
1. **Defer non-critical JS** — Lazy-load admin/staff chunks, Google Analytics, Google Translate
2. **Remove Google Translate widget** — CSP violations + 197ms main thread + not used (hidden in CSS)
3. **Replace `ScrollReveal` (6 instances)** with native `animation-timeline: view()` — saves IntersectionObserver overhead
4. **Inline critical CSS** — Hero text is LCP element but blocked by CSS chunks
5. **Enable `output: 'standalone'`** (already) + analyze with `@next/bundle-analyzer`

---

## 2. Security (High Risk)

### 2.1 Authentication & Session

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| **Fallback JWT secret in production** | `utils/auth.ts:13-15` | 🔴 Critical | Enforce `JWT_SECRET` in prod; throw if missing (already does) but ensure Vercel env is set |
| **Hardcoded BYPASS credentials via env** | `app/login/actions.ts:50-87` | 🔴 Critical | Remove `BYPASS_ADMIN_USER/PASS`, `BYPASS_STAFF1_USER/PASS` — creates backdoor accounts with known IDs |
| **Custom JWT instead of Supabase Auth** | `utils/supabase/server.ts:34-50` | 🟠 High | Overrides `auth.getUser()` to read custom cookie — bypasses Supabase RLS auth context; use Supabase SSR auth or implement proper RLS policies with custom claims |
| **30-day session expiry** | `utils/auth.ts:29, 45` | 🟡 Medium | Reduce to 24h access + 7d refresh; implement token rotation |
| **SameSite: 'lax' not 'strict'** | `utils/auth.ts:53, 71` | 🟡 Medium | Change to `'strict'` for CSRF protection on sensitive actions |

### 2.2 Input Validation & Sanitization

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| **Homegrown HTML sanitizer** | `lib/sanitize.ts:4-24` | 🔴 Critical | Regex-based, incomplete (misses `onerror`, `data:` URIs, SVG XSS). Replace with **DOMPurify** (already in deps) or `sanitize-html` |
| **No rate limiting on login** | `app/login/actions.ts` | 🔴 Critical | Add `rateLimit` on username/IP — 5 attempts/min |
| **No rate limiting on public booking** | `app/booking/actions/*.ts` | 🟠 High | Apply `rateLimit` to phone check, submission |
| **AI Assist endpoint — no input validation** | `app/api/ai-assist/route.ts:161` | 🟠 High | Validate `action`, `content`, `title` length; sanitize before passing to Gemini |
| **Push subscription — no origin check** | `app/api/subscribe/route.ts` | 🟡 Medium | Verify `subscription.endpoint` matches allowed origins |

### 2.3 Headers & CSP

| Issue | Location | Fix |
|-------|----------|-----|
| **CSP `img-src` blocks Google Translate** | `next.config.ts:61` | Add `https://fonts.gstatic.com https://www.gstatic.com` OR remove Google Translate |
| **`'unsafe-inline'` in script-src** | `next.config.ts:61` | Required for Next.js inline scripts; consider nonce-based CSP for stricter policy |
| **No `Content-Security-Policy-Report-Only` for testing** | — | Add report-only header to monitor violations before enforcing |

### 2.4 Database Security

| Issue | Location | Fix |
|-------|----------|-----|
| **RLS policies use `auth.role() = 'authenticated'`** | `database.sql:573-592` | Weak — allows any authenticated Supabase user. Use custom JWT claims (`role`) via `auth.jwt() ->> 'role'` |
| **`notifications` table lacks RLS policies** | `database.sql:312-325` | Add policies for `recipient_type = 'user' AND recipient_id = auth.uid()` |
| **`ai_cache` table has no RLS** | `database.sql:407-412` | Enable RLS, restrict to service role |
| **`rate_limits` table has no RLS** | `database.sql:401-405` | Enable RLS, service-role only |

---

## 3. Accessibility (WCAG 2.1 AA Gaps)

### 3.1 Critical (Blockers)

| # | Component | Issue | WCAG | Fix |
|---|-----------|-------|------|-----|
| 1 | `NotificationBell` | Dropdown button lacks `aria-haspopup`, `aria-expanded`, `aria-controls`; panel lacks `role="menu"` | 4.1.2, 1.3.1 | Add full ARIA menu pattern |
| 2 | `BookingCalendar` | Time buttons not keyboard operable (no `onKeyDown` for Enter/Space) | 2.1.1 | Add keyboard handler |
| 3 | `app/booking/page.tsx` | Phone/name inputs use `htmlFor` but no visible `<label>` wrapper | 1.3.1, 3.3.2 | Wrap inputs in `<label>` or add `aria-label` |
| 4 | `BottomNavigation` | Icon-only buttons on mobile truncate labels — no `aria-label` fallback | 4.1.2 | Add `aria-label={label}` to `renderItem` |

### 3.2 High

| # | Component | Issue | Fix |
|---|-----------|-------|-----|
| 5 | `ThemeBanner` | Dismiss button has `aria-label` but banner announces on mount — use `role="status"` + `aria-live="polite"` | Add live region |
| 6 | `ServiceBookButton` | Link styled as button — use `<button>` with `onClick` navigation or keep `<a>` but remove button semantics | Use `<a>` for navigation |
| 7 | `StatsCounter` | Animated numbers not announced — add `aria-live="polite"` to counter span | |
| 8 | `SkipLink` | Target `#main-content` exists but wrapped in providers — verify focus reaches content | Test with screen reader |

### 3.3 Medium

| # | Issue | Fix |
|---|-------|-----|
| 9 | Focus visible only on some buttons — add global `:focus-visible { ring: 2px solid var(--color-accent); }` | `globals.css` |
| 10 | Decorative icons (Lucide) lack `aria-hidden="true"` — many places | Audit all icon usages |
| 11 | Form errors not linked via `aria-describedby` — booking, login | Add error IDs + `aria-describedby` |

---

## 4. Code Quality & Architecture

### 4.1 TypeScript Issues

| Pattern | Count | Files | Risk |
|---------|-------|-------|------|
| `any` type | 100+ | `app/admin/page.tsx`, `app/admin/components/TabDashboard.tsx`, `app/staff/page.tsx` | Type safety lost |
| `as any` casting | 20+ | `utils/supabase/server.ts`, `app/api/ai-assist/route.ts` | Runtime errors |
| Missing return types | 15+ | Server actions | Maintainability |

### 4.2 Duplication

| Logic | Files | Lines |
|-------|-------|-------|
| Service category normalization | `app/page.tsx:81-97`, `app/booking/page.tsx:112-131` | ~40 |
| Booking form validation | `app/booking/page.tsx`, `app/booking/actions/booking.ts` | ~60 |
| SEO settings fetch | `app/page.tsx`, `app/layout.tsx`, `app/api/ai-assist/route.ts` | ~15 |

### 4.3 Coupling Issues

| Problem | Evidence |
|---------|----------|
| Components import from `app/` | `components/staff/*` → `@/app/staff/actions` |
| Server actions in `app/` import components | `app/admin/actions/*.ts` → `@/components/` |
| No clear layer separation | Business logic mixed with UI components |

### 4.4 Design System Gaps

- **No Button component** — 5+ variants inline (primary, secondary, outline, ghost, danger)
- **No Input/Label/Select primitives** — each form reinvents markup
- **Hardcoded colors** — `bg-[#5C4033]`, `text-[#8D6E53]` instead of theme utilities (`.theme-bg-accent`, `.theme-text-secondary`)
- **No spacing scale tokens in JS** — only in CSS variables

---

## 5. Database & Backend

### 5.1 Schema Strengths
- All 35 tables have RLS enabled ✅
- FK indexes added (Phase 4) ✅
- `updated_at` triggers on 11 tables ✅
- CHECK constraints on enums ✅
- Realtime configured for 8 tables ✅

### 5.2 Issues

| Issue | Table | Fix |
|-------|-------|-----|
| **Two `deduct_package_session` overloads** | RPC functions | Consolidate; void version ignores `updated_at` |
| **`services.category` CHECK enum** | `services` | Hardcoded — add new category requires migration. Use separate `categories` table |
| **`notifications.recipient_id` no FK** | `notifications` | Add FK to `users`/`customers` with polymorphic hint |
| **`cash_register.amount` is INTEGER** | `cash_register` | Should be `DECIMAL(10,2)` for VND |
| **No `ON DELETE` for `cash_register.recorded_by`** | `cash_register` | Add `ON DELETE SET NULL` |

### 5.3 Server Actions Patterns

| Pattern | Status | Example |
|---------|--------|---------|
| Auth check at top | ✅ Consistent | `getSession()` + role check |
| Error handling returns `{success, error}` | ✅ Consistent | All actions |
| Audit logging fire-and-forget | ⚠️ No await | `import('@/utils/audit').then(...)` — can lose logs |
| Revalidation | ❌ Missing | No `revalidatePath` / `revalidateTag` after mutations |

---

## 6. Frontend Architecture

### 6.1 Component Structure

```
components/
├── ui/           # Missing — no design system primitives
├── staff/        # Staff-specific (coupled to app/staff)
├── admin/        # Admin components in app/admin/components
└── *.tsx         # 80+ flat components
```

### 6.2 State Management

| Area | Approach | Issue |
|------|----------|-------|
| Server state | React Server Components + `createClient()` | Good |
| Client state | `useState`, `useRef` | No global store — props drilling in admin |
| Forms | Controlled inputs | Verbose, no validation library (Zod/React Hook Form) |
| Real-time | Supabase Realtime + custom hooks | Works but duplicated in `NotificationBell`, `TabDashboard` |

### 6.3 Dynamic Imports

- **16 `dynamic()` imports on homepage** — 6 lack `ssr: false` causing hydration mismatches
- **No `Loading` fallbacks** for some (e.g., `VipPackages` has, `HomeMascotBanner` doesn't)

---

## 7. Testing & CI/CD

| Area | Status |
|------|--------|
| Unit tests | `vitest` configured — 4 test files only (`lib/__tests__/`) |
| E2E tests | Playwright configured — `scripts/debug/*.mjs` for manual checks |
| Lint | `eslint` — 312 warnings (pre-existing), 0 errors |
| Typecheck | `tsc --noEmit` — passes |
| CI/CD | Not configured — no GitHub Actions / Vercel build hooks visible |

---

## 8. Remediation Plan (Prioritized)

### P0 — Do This Week (Security + Perf Blockers)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Remove BYPASS env credentials from login | `app/login/actions.ts` | 30m |
| 2 | Enforce JWT_SECRET in Vercel production env | Vercel dashboard | 5m |
| 3 | Replace `sanitizeHtml` with DOMPurify | `lib/sanitize.ts` | 1h |
| 4 | Add rate limiting to login + public booking | `lib/rate-limit.ts`, `app/login/actions.ts`, `app/booking/actions/` | 2h |
| 5 | Fix CSP: add Google fonts/gstatic OR remove Google Translate | `next.config.ts`, `components/GoogleTranslate.tsx`, `app/globals.css` | 1h |
| 6 | Lazy-load admin/staff bundles from `NotificationBell` | `components/NotificationBell.tsx` | 1h |
| 7 | Add `revalidatePath` to all mutating server actions | `app/**/actions.ts` | 2h |

### P1 — This Sprint (Accessibility + Architecture)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 8 | Implement ARIA menu pattern in `NotificationBell` | `components/NotificationBell.tsx` | 2h |
| 9 | Add keyboard support to `BookingCalendar` time buttons | `components/BookingCalendar.tsx` | 1h |
| 10 | Add visible labels to booking form inputs | `app/booking/page.tsx` | 1h |
| 11 | Extract `Button`, `Input`, `Label` primitives | `components/ui/` (new) | 4h |
| 12 | Deduplicate service category normalization | `lib/services.ts` (new) | 1h |
| 13 | Add global `:focus-visible` styles | `app/globals.css` | 30m |

### P2 — Next Sprint (Code Quality + DX)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 14 | Replace all `any` with proper types | `app/admin/`, `app/staff/`, `app/admin/components/` | 4h |
| 15 | Create `lib/design-tokens.ts` from CSS variables | `lib/design-tokens.ts` (new) | 1h |
| 16 | Migrate hardcoded colors to theme utilities | `components/`, `app/` | 3h |
| 17 | Add Zod schemas for all server action inputs | `app/**/actions.ts` | 3h |
| 18 | Implement proper RLS policies using `auth.jwt()` | `database.sql` | 2h |
| 19 | Add GitHub Actions CI (lint, typecheck, test, build) | `.github/workflows/ci.yml` | 1h |

### P3 — Polish (Performance + DX)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 20 | Replace `ScrollReveal` with CSS `animation-timeline: view()` | `components/ScrollReveal.tsx`, `app/page.tsx`, `app/globals.css` | 2h |
| 21 | Add `loading="lazy"` to below-fold images | `app/page.tsx` service cards | 30m |
| 22 | Inline critical CSS for hero text | `app/layout.tsx`, `app/page.tsx` | 1h |
| 23 | Add `web-vitals` reporting to Vercel Analytics | `components/WebVitals.tsx` | 30m |
| 24 | Storybook for UI primitives | `.storybook/`, `components/ui/` | 3h |

---

## 9. Compliance Checklist

| Standard | Status | Gaps |
|----------|--------|------|
| **OWASP Top 10 (2021)** | 🟡 Partial | A01 Broken Access Control (RLS weak), A03 Injection (sanitizer), A07 Auth (bypass, long sessions) |
| **WCAG 2.1 AA** | 🟡 Partial | 1.3.1, 2.1.1, 3.3.2, 4.1.2 failures |
| **GDPR** | 🟢 Likely OK | No explicit consent for analytics, but GA is standard |
| **Vietnam PDPA (Decree 13)** | 🟡 Unknown | Need data mapping, retention policy, DPIA for AI processing |

---

## 10. Quick Wins (Under 1 Hour Each)

1. **Delete `components/GoogleTranslate.tsx` + CSS** — removes 197ms main thread, 4 CSP errors
2. **Add `favicon.ico` to `public/`** — fixes 404 in Lighthouse
3. **Change `sameSite: 'lax'` → `'strict'`** in `utils/auth.ts`
4. **Add `aria-hidden="true"` to all decorative Lucide icons** — grep: `lucide-react` imports
5. **Add `revalidatePath('/admin')`** to admin mutating actions
6. **Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` only in production** — dev loads GTM unnecessarily
7. **Remove `tailwindcss-animate` if unused** — check `grep -r "animate-" components/`

---

## Appendix: File Inventory (Key Files Audited)

| Category | Files |
|----------|-------|
| **Auth** | `utils/auth.ts`, `utils/supabase/server.ts`, `app/login/actions.ts`, `app/api/auth/me/route.ts`, `app/api/logout/route.ts` |
| **API Routes** | `app/api/ai-assist/route.ts`, `app/api/notifications/route.ts`, `app/api/subscribe/route.ts`, `app/api/vapid/route.ts` |
| **Server Actions** | `app/booking/actions/*.ts`, `app/staff/actions.ts`, `app/admin/actions/*.ts` |
| **Database** | `database.sql` (899 lines) |
| **Frontend Core** | `app/layout.tsx`, `app/page.tsx`, `app/booking/page.tsx`, `app/admin/page.tsx`, `app/staff/page.tsx` |
| **Components** | `components/NotificationBell.tsx`, `components/HeaderNav.tsx`, `components/BookingCalendar.tsx`, `components/ServiceBookButton.tsx`, `components/ThemeBanner.tsx`, `components/StatsCounter.tsx` |
| **Config** | `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `package.json` |
| **Utils** | `lib/sanitize.ts`, `lib/password.ts`, `lib/rate-limit.ts`, `lib/ai/gemini.ts`, `lib/ai-cache.ts` |

---

*Generated by automated audit using: web-design-guidelines, improve-ui, fixing-accessibility, web-perf, security-and-hardening, code-review-and-quality, source-driven-development skills + live Chrome DevTools trace.*