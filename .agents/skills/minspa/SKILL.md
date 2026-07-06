# Min Nail & Hair — Agent Skill

## Project Overview

Min Nail & Hair là salon spa tại Thủ Đức. Stack: Next.js 16.2.9, Supabase PostgreSQL, Custom JWT auth (HS256), Tailwind CSS v4, TypeScript.

## Architecture Rules

### Auth & Session
- Custom JWT (HS256), stored in "session" cookie (httpOnly, sameSite=lax, 30d)
- Auth server actions: `@/utils/supabase/server` → `createClient()`, not `@supabase/supabase-js` directly
- Client components: `@/utils/supabase/client` singleton
- Login flow: server action → `redirect()` (throws NEXT_REDIRECT, flushes cookie)
- Proxy/middleware: `proxy.ts` (export `function proxy`), NOT `middleware.ts`
- Session sliding: re-encrypt + set cookie every request in proxy.ts

### Database
- `database.sql` is the single source of truth (not migrations folder)
- Migrations use idempotent DO blocks
- Status: UPPERCASE (CONFIRMED, COMPLETED, CANCELLED)
- All new tables need RLS policies, indexes on FK columns, proper constraints

### Storage Buckets
- `seo-images`: SEO/blog/service generated images
- `service-images`: Uploaded service images (S3ImageBrowser reads from this)
- Each bucket needs 4 RLS policies: SELECT, INSERT, UPDATE, DELETE

## Critical Lessons (From Production Bugs)

### 1. Storage Bucket Naming
- **Bug**: S3ImageBrowser listed from `seo-images` but upload wrote to `service-images` → images never appeared
- **Rule**: Always verify bucket name consistency between list and upload operations

### 2. Google Translate + React Strict Mode
- **Bug**: React Strict Mode double-mounts components in dev → 2 Google Translate scripts → infinite MutationObserver loop → `Maximum call stack size exceeded`
- **Fix**: Guard with `document.querySelector('script[src*="translate.googleapis.com"]')` + `window.__googleTranslateInitialized` flag
- **Rule**: Always guard third-party script injection against double-mount

### 3. Google Translate Banner Hiding
- **Bug**: `.goog-te-banner-frame.skiptranslate` selector doesn't match all versions of Google Translate
- **Fix**: Use `.goog-te-banner-frame` alone (without `.skiptranslate`) + `position: static` on body
- **Rule**: Use multiple CSS selectors for third-party iframe hiding

### 4. Dynamic Elements + Translation
- **Bug**: Rapidly changing text nodes (counters, timers) trigger Google Translate's MutationObserver loop
- **Fix**: Add `notranslate` class to any element whose text changes frequently
- **Rule**: Any element with `setInterval`-driven text updates must have `notranslate`

### 5. GoTrueClient Singleton
- **Bug**: 3 components called `createClient()` from `@supabase/supabase-js` in `useEffect` → multiple GoTrueClient instances
- **Fix**: Always import from `@/utils/supabase/client`, not `@supabase/supabase-js`
- **Rule**: Never instantiate Supabase client inside a component effect

### 6. Preload Only Used Resources
- **Bug**: `<link rel="preload">` for PWA icons caused "not used within 3 seconds" warning
- **Rule**: Only preload resources consumed as `<img>` or CSS `url()` within 3s of page load

### 7. Playwright MCP over Custom Tools
- `opencode.json` `tools` field only accepts booleans; custom tools require MCP server
- Playwright MCP (`@playwright/mcp`) is the recommended approach for browser automation

### 8. Image Upload Pipeline
- Sharp native module may fail on Windows (`ERR_DLOPEN_FAILED`) → fallback to raw upload
- Max file size: 5MB (both before and after optimization)
- Upload immediately on file pick (before form submit) to avoid 1MB Server Action body limit
- Use `serverActions.bodySizeLimit: '10mb'` in `next.config.ts`

## Tailwind Conventions
- Breakpoints: `xs` (480px), `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `xxl` (1600px), `4k` (2560px)
- Mobile-first: `grid-cols-1` base → `md:grid-cols-2` → `lg:grid-cols-3`
- Safe areas: `env(safe-area-inset-top/bottom)` on body, bottom nav, drawers
- Touch targets: minimum `min-h-[44px]` (WCAG 2.5.5)

## Mobile UI Patterns
- 3-tier navigation: scroll-aware pill row (public), slide-in drawer (admin/staff), bottom tab bar (all)
- Bottom nav hidden on desktop via `md:hidden`
- Drawers use `h-dvh` (dynamic viewport height), backdrop blur
- Viewport: `width=device-width, initial-scale=1` with `userScalable` enabled (WCAG 1.4.4)

## Performance Optimization
- Dynamic import for heavy components: `BookingCalendar`, `BookingMascotGuide`, motion components
- `optimizePackageImports` in next.config for `lucide-react`, `date-fns`, `motion`
- GA4 via `next/script` strategy `afterInteractive`
- Vercel Speed Insights for production RUM
- Safari/iOS: unregister old Service Workers if CSP changes (SW retains stale CSP context)

## SEO Checklist
- robots.txt: Disallow /admin/ /staff/ /api/ /login/
- sitemap: all public routes (home, services, blog, booking, blog posts, seo_articles)
- Admin + staff pages: `noindex` via layout
- JSON-LD schemas: LocalBusiness, WebSite, BreadcrumbList, Article/BlogPosting, FAQPage, AggregateRating, Service, Review
- OG/Twitter: title, description, image, image:alt, card type
- Canonical URLs on all public pages
