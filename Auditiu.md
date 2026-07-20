# UI Audit Report - Min Nail & Hair

**Date:** 2026-07-17  
**Audited Surfaces:** Homepage (`app/page.tsx`), Booking Flow (`app/booking/page.tsx`), Admin Dashboard (`app/admin/page.tsx`), Staff Dashboard (`app/staff/page.tsx`), Global Layout (`app/layout.tsx`), Core Components

**Audit Methodology:** Web Interface Guidelines (vercel-labs/web-interface-guidelines), Improve-UI skill framework, Fixing-Accessibility skill, Baseline-UI standards, Lighthouse Performance Report (2026-07-01)

---

## Design Language Summary

| Aspect | Current State |
|--------|---------------|
| **Design System** | Custom Tailwind CSS with CSS variables for theming (`--color-bg`, `--color-accent`, etc.) |
| **Typography** | Noto Sans (UI), Playfair Display (Display) — Vietnamese + Latin subsets |
| **Color Palette** | Warm neutrals (#FAF6F0, #EADDCD) + Accent amber/brown (#8D6E53, #5C4033) + Semantic tokens |
| **Theming** | 11 data-theme variants (Tet, Valentine, Women's Day, etc.) + weather-responsive |
| **Animation** | Framer Motion + custom CSS animations (float, slideUp, shimmer, hover-magnetic) |
| **Breakpoints** | xs(480), sm, md, lg, xl, xxl(1600), 4k(2560) |
| **Component Lib** | Custom components (no shadcn/ui, no Radix) |
| **Icons** | Lucide React |

---

## Findings

### 🔴 Critical (Performance & Accessibility)

| # | Issue | File | Evidence | Confidence |
|---|-------|------|----------|------------|
| 1 | **LCP 4.69s (Poor)** — 92% is render delay (4,319ms) | `app/page.tsx`, `app/layout.tsx` | Chrome DevTools trace: LCP element = text node; main thread blocked 12.3s evaluating 42 JS chunks | 1.0 |
| 2 | **TBT ~970ms** — Main thread blocked 12.3s total | `app/layout.tsx`, `app/page.tsx` | Trace: Style & Layout 4.1s, Script Evaluation 2.9s, Other 3.6s; 393ms layout updates | 1.0 |
| 3 | **React Error #418** — Hydration mismatch (HTML in component) | `app/layout.tsx:156` (Schema.org JSON-LD) | Console error: "Minified React error #418" — `dangerouslySetInnerHTML` with structured data | 0.90 |
| 4 | **Google Translate CSP Violations** (4 blocked resources) | `app/globals.css:394-405`, `components/GoogleTranslate.tsx` | CSP `img-src` blocks `fonts.gstatic.com`, `gstatic.com` for translate widget | 0.95 |
| 5 | **Favicon 404** — Missing `/favicon.ico` | `public/` | Network request: 404 for favicon.ico | 1.0 |

### 🟡 High (UX, Accessibility, Maintainability)

| # | Issue | File | Evidence | Confidence |
|---|-------|------|----------|------------|
| 6 | **No Skip Link Target** — `SkipLink` points to `#main-content` but `<main id="main-content">` exists only in layout | `app/layout.tsx:219`, `components/SkipLink.tsx:6` | Target exists but layout wraps in `ErrorBoundary` + `ThemeProvider` — focus may not reach | 0.85 |
| 7 | **NotificationBell — Missing ARIA** | `components/NotificationBell.tsx:219-230` | Dropdown button lacks `aria-haspopup`, `aria-expanded`, `aria-controls`; panel lacks `role="menu"` | 0.90 |
| 8 | **Booking Page — Form Inputs Missing Labels** | `app/booking/page.tsx:664-694` | Phone/name inputs use `htmlFor` but no visible `<label>` wrapper; placeholder-only | 0.95 |
| 9 | **Admin Dashboard — Table Missing `<thead>` Semantic Structure** | `app/admin/components/TabDashboard.tsx:589-622` | Attendance log uses `<table>` but header row uses `<th>` without `scope="col"` | 0.85 |
| 10 | **Homepage — Service Cards: Decorative Images Missing `alt=""`** | `app/page.tsx:382-386` | `Image` with `alt={service.name}` but images are decorative (visual flourish) | 0.90 |
| 11 | **BottomNavigation — Icon-Only Buttons Missing Labels on Mobile** | `components/BottomNavigation.tsx:45-63` | `renderItem` uses icon + label but label truncated on narrow screens; no `aria-label` fallback | 0.85 |
| 12 | **ThemeBanner — Layout Shift on Dismiss** | `components/ThemeBanner.tsx:44-47` | `document.body.style.paddingTop = '52px'` triggers CLS; banner animates in/out | 0.90 |
| 13 | **BookingCalendar — Time Buttons Not Keyboard Operable** | `components/BookingCalendar.tsx:120-149` | `<button>` elements but no `onKeyDown` for Enter/Space; disabled state uses `cursor-not-allowed` only | 0.95 |

### 🟢 Medium (Visual Consistency, Code Quality)

| # | Issue | File | Evidence | Confidence |
|---|-------|------|----------|------------|
| 14 | **Inconsistent Button Variants** — 5+ distinct button styles across codebase | `components/ServiceBookButton.tsx`, `app/page.tsx:158-173`, `app/booking/page.tsx:780-786` | Primary: `bg-[#5C4033]`, Secondary: `border-[#EADDCD]`, Outline: `bg-[#FAF0E6]`, Ghost: `bg-white`, Danger: `bg-red-500` — no unified variant system | 0.95 |
| 15 | **Duplicate Category Normalization Logic** | `app/page.tsx:81-97`, `app/booking/page.tsx:112-131` | Same service category mapping duplicated in 2 files | 1.0 |
| 16 | **Hardcoded Color Values in Components** | Multiple files | `bg-[#8D6E53]`, `text-[#5C4033]`, `border-[#EADDCD]` used inline instead of theme utilities (`.theme-bg-accent`, `.theme-text-secondary`) | 0.90 |
| 17 | **ScrollReveal Overuse** — 6+ instances on homepage | `app/page.tsx:353, 461, 470, 480, 494, 548` | Every section wrapped; adds IntersectionObserver overhead, no `prefers-reduced-motion` respect | 0.85 |
| 18 | **Dynamic Imports Without SSR Fallback** | `app/page.tsx:16-41` | 16 `dynamic()` imports with custom loaders; some lack `ssr: false` causing hydration mismatches | 0.80 |
| 19 | **StatsCounter — Animation Not Respecting `prefers-reduced-motion`** | `components/StatsCounter.tsx:17-44` | `setInterval` animation runs regardless of user motion preference | 0.95 |
| 20 | **Admin Dashboard — Toast AudioContext Created Per Toast** | `app/admin/components/TabDashboard.tsx:84-119` | New `AudioContext` per toast; should reuse singleton | 0.85 |

### 🔵 Low (Polish, DX)

| # | Issue | File | Evidence |
|---|-------|------|----------|
| 21 | **Unused `baseUrl` Variable** | `app/page.tsx:23` | Declared but never used in JSX |
| 22 | **Console Error: "loadData failed"** (Transient) | Playwright check | Non-blocking but appears in logs |
| 23 | **Tailwind Safelist Bloated** | `tailwind.config.ts:62-69` | 14 color variants safelisted; could use `safelist: [{ pattern: /bg-(red|amber|emerald|blue|gray|green|rose|pink|purple)-(50|100|200|300|400|500|600|700|800|900)/ }]` | 
| 24 | **TypeScript `any` Overuse in Admin Components** | `app/admin/page.tsx:32-33`, `TabDashboard.tsx:32` | `data: any`, `finData: any` — loses type safety |

---

## Lighthouse Summary (2026-07-01)

| Category | Score | Key Metrics |
|----------|-------|-------------|
| **Performance** | 47 | FCP 1.9s, LCP 6.9s, TBT 970ms, TTI 9.1s |
| **Accessibility** | 96 | Good — minor contrast/touch target issues |
| **Best Practices** | 92 | CSP errors, console errors |
| **SEO** | 100 | Excellent structured data |

---

## Live Chrome DevTools Trace (2026-07-17) — minhair.vercel.app

| Metric | Value | Rating | Notes |
|--------|-------|--------|-------|
| **LCP** | **4,690 ms** | ❌ Poor (>4s) | LCP element is **text node** (not image) — blocked by main thread |
| **LCP Breakdown** | TTFB: 371ms (7.9%) / Render Delay: **4,319ms (92.1%)** | — | Main thread blocked evaluating JS |
| **TBT** | ~970ms | ❌ Poor | Main thread blocked 12.3s total |
| **CLS** | 0.04 | ✅ Good (<0.1) | Stable layout |
| **FCP** | ~1.9s | ⚠️ Needs Improvement | |
| **DOM Size** | 1,494 elements | ✅ Acceptable | Max depth 16, max children 84 |
| **Layout Updates** | 393ms (1,873 nodes) | ⚠️ High | Large style recalcs |
| **JS Chunks Loaded** | 42 requests | — | ~2.5MB+ JS (compressed) |

**Key Insight:** 92% of LCP time is **render delay** — the browser received HTML quickly (TTFB 371ms) but couldn't paint text because main thread was busy evaluating 42 JS chunks (React 19, Supabase Auth, Framer Motion, Recharts, Lucide, etc.).

---

## Design System Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No component variant system (Button, Card, Input) | Inconsistent UI, high maintenance | Extract `Button` variants: `primary`, `secondary`, `outline`, `ghost`, `danger` |
| No spacing/scale tokens in JS | Hardcoded values | Add `lib/design-tokens.ts` exporting spacing, radius, shadow scales |
| No focus-visible strategy | Keyboard users lose focus | Add global `:focus-visible` ring using theme tokens |
| No reduced-motion hook | Animation accessibility | Create `useReducedMotion()` hook + apply to all motion |
| Icon system inconsistent | Mixed `lucide-react` + emoji + raw SVG | Standardize on Lucide + `aria-hidden="true"` for decorative |

---

## Priority Fix Order

1. **P0** — **LCP Render Delay (4.3s)** — Code-split heavy bundles, defer non-critical JS, prioritize LCP text rendering (Finding 1)
2. **P0** — **TBT / Main Thread Blocking** — Reduce JS evaluation: lazy-load admin/staff bundles, remove unused deps (Finding 2)
3. **P0** — **React Hydration Error #418** — Move JSON-LD to `<script type="application/ld+json">` without `dangerouslySetInnerHTML` (Finding 3)
4. **P0** — **CSP Violations + Favicon 404** — Add CSP headers for Google fonts/gstatic, add favicon.ico (Findings 4, 5)
5. **P1** — **Accessibility: ARIA on NotificationBell, Form Labels, Keyboard Calendar** (Findings 7, 8, 13)
6. **P1** — **Layout Shift: ThemeBanner** — Reserve space in CSS, not JS (Finding 12)
7. **P2** — **Design System: Button Variants, Color Tokens** (Findings 14, 16)
8. **P2** — **Code Quality: Dedup Category Logic, Remove `any`** (Findings 15, 24)
9. **P3** — **Animation: Respect `prefers-reduced-motion`** (Findings 17, 19)
10. **P3** — **Polish: Safelist, Console Noise** (Findings 22, 23)