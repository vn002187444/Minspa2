# Min Nail & Hair — Upgrade Plan (2026)

## Phase 1: Schema Bổ Sung & Fix

| # | Task | Priority | File(s) |
|---|------|----------|---------|
| 1.1 | Tạo `ReviewSchema.tsx` — mỗi testimonial thành `Review` item, `itemReviewed` trỏ `#local-business` | Cao | `components/ReviewSchema.tsx`, `app/page.tsx` |
| 1.2 | Fix duplicate BreadcrumbList — xoá breadcrumb khỏi root layout, giữ ở layout/blog con | Cao | `app/layout.tsx` |
| 1.3 | Clean Product/Schema confusion — gộp ProductSchema vào ServiceSchema hoặc sửa type | Trung | `components/ProductSchema.tsx`, `components/ServiceSchema.tsx` |
| 1.4 | Thêm standalone `Organization` schema entity dùng `@id` cross-references | Thấp | `app/layout.tsx` |
| 1.5 | Thêm `ImageGallery` schema cho gallery | Thấp | (tuỳ chọn) |

## Phase 2: Core Web Vitals Tối Ưu

| # | Task | Impact | File(s) |
|---|------|--------|---------|
| 2.1 | Thêm `priority` prop cho hero images + service card đầu | LCP | `app/page.tsx` |
| 2.2 | Chuyển GA4 script sang `next/script` strategy `afterInteractive` / lazy component | LCP, FID | `app/layout.tsx` |
| 2.3 | Bỏ JetBrains Mono font (không cần thiết) | CSS payload | `app/layout.tsx` |
| 2.4 | Xoá `4k` breakpoint trong Tailwind | CSS bundle | `tailwind.config.ts` |
| 2.5 | Đổi `dns-prefetch` Supabase → `preconnect` | Connection time | `app/layout.tsx` |
| 2.6 | Thêm Cache-Control header cho static assets | Cache hit rate | `next.config.ts` |
| 2.7 | Thêm `aspect-ratio` CSS cho service image containers | CLS | `app/page.tsx` |

## Phase 3: SEO Audit

| # | Task | Tool |
|---|------|------|
| 3.1 | Google Rich Results Test — `/`, `/blog/[slug]`, `/booking` | search.google.com/test/rich-results |
| 3.2 | Schema Validator — tất cả JSON-LD | validator.schema.org |
| 3.3 | Check meta tags (title, description, OG, canonical) | manual / browser |
| 3.4 | Check robots.txt + sitemap.xml | manual |
| 3.5 | Mobile-friendly test | search.google.com/test/mobile-friendly |

## Phase 4: Bug Fixes — AI Image & Unsplash

### Root causes
- **Gemini image generation bị vô hiệu hoá hoàn toàn**: `tryGeminiImage()` luôn return `null` (code comment: "unstable / deprecated"). Nút "Tạo ảnh AI" không bao giờ dùng AI thật.
- **Unsplash URL bị lỗi**: `generate-seo-image/route.ts:63` append `?w=800&auto=format&fit=crop` vào URL đã có query params (`result.urls.regular`) → URL hỏng, ảnh vỡ.
- **Fallback pool quá nhỏ**: Chỉ 8 ảnh hardcode trong `FALLBACK_IMAGES` → user luôn thấy ảnh cũ.
- **Auto-suggest guard**: `suggestedImagesRef.current.length > 0` → không bao giờ gợi ý lại khi đổi title.
- **Thiếu `onError`**: Không có fallback hiển thị khi ảnh load lỗi.

### Fixes

| # | Task | File |
|---|------|------|
| 4.1 | Mở rộng `FALLBACK_IMAGES` (cả 2 route) — 20+ ảnh diverse, verified | `api/ai-assist/route.ts`, `api/generate-seo-image/route.ts` |
| 4.2 | Fix URL Unsplash — xoá append `?w=800...` khi URL đã có params | `api/generate-seo-image/route.ts` |
| 4.3 | Bỏ guard `suggestedImagesRef.current.length > 0` — cho phép re-fetch khi title đổi | `admin/blog/page.tsx` |
| 4.4 | Clear suggestedImages khi title đổi + thêm nút refresh | `admin/blog/page.tsx` |
| 4.5 | Thêm `onError` handler + placeholder cho 4 ô gợi ý ảnh | `admin/blog/page.tsx` |
| 4.6 | Reactivate Gemini image generation hoặc thay bằng alternative (DALL·E, Stability AI) | `api/generate-seo-image/route.ts` |

## Phase 5: Image Upload & Storage Bucket Fix (07/07/2026)

| # | Task | Priority | File(s) |
|---|------|----------|---------|
| 5.1 | **Fix bucket mismatch S3ImageBrowser**: `listStorageImages()` đọc từ `seo-images` nhưng upload ghi vào `service-images` | 🔴 Cao | `app/admin/actions.ts:111,119` |
| 5.2 | Thêm migration `service-images` bucket vào `database.sql` (RLS policies) | 🟡 Trung | `database.sql` |
| 5.3 | Xác nhận bucket `service-images` tồn tại trên Supabase | 🟢 Thấp | Supabase Dashboard |

## Phase 6: Google Translate Stability (07/07/2026)

| # | Task | Priority | File(s) |
|---|------|----------|---------|
| 6.1 | **Fix `Maximum call stack size exceeded`**: Guard duplicate script load + `__googleTranslateInitialized` | 🔴 Cao | `components/GoogleTranslate.tsx`, `types/index.ts` |
| 6.2 | **Fix banner hiển thị**: CSS robust hơn cho Google Translate iframe | 🟡 Trung | `app/globals.css:340-349` |
| 6.3 | **Prevent translate on dynamic elements**: Thêm `notranslate` class cho `StatsCounter` | 🟢 Thấp | `components/StatsCounter.tsx` |
| 6.4 | **Touch target WCAG**: HeaderNav mobile pills `min-h-[34px]` → `44px` | 🟢 Thấp | `components/HeaderNav.tsx:216` |
| 6.5 | **Fix 4k breakpoint**: Thêm `4k` screen breakpoint vào `tailwind.config.ts` | 🟢 Thấp | `tailwind.config.ts` |

## Status (Updated 07/07/2026)

- Phase 1: **Done** — ReviewSchema tạo, breadcrumb trùng xoá, ProductSchema cleanup
- Phase 2: **Done** — GA4 → next/script afterInteractive, bỏ JetBrains Mono, xoá 4k breakpoint, Supabase preconnect, Cache-Control static assets
- Phase 3: **Done** — SEO Audit & fixes:
  - robots.txt: ✅ Hợp lệ, chỉ trỏ sitemap
  - sitemap.xml: ✅ Đầy đủ routes (trang tĩnh, services, blog posts), ISR 1h
  - Meta tags: ✅ Root layout có `generateMetadata` với OG + Twitter card
  - Blog list/page: ✅ Canonical, OG, Twitter card
  - Blog detail: ✅ Canonical, OG + article type, Twitter card, image dimensions
  - Booking: ✅ Canonical `/booking`, OG
  - Admin pages: **Đã thêm `noindex`** (`app/admin/layout.tsx`)
  - Staff page: **Đã thêm `noindex`** (`app/staff/layout.tsx`)
  - 404 pages: ✅ All have `robots: { index: false }`
  - Schema: ✅ All JSON-LD types implemented (LocalBusiness, WebSite, BreadcrumbList, BlogPosting, FAQPage, AggregateRating, Service, Review)
- Phase 4: **Done** — AI Image & Unsplash fixes
- Phase 5: **Done** — Đã fix bucket mismatch (service-images)
- Phase 6: **In Progress** — Google Translate stability (6.1 done ✅, 6.2 done ✅, 6.3 done ✅, 6.4 done ✅, 6.5 done ✅)

## Lighthouse Scores (Last Run: 2026-07-01, Production Mobile)

| Category | Score | Notes |
|----------|-------|-------|
| Performance | **47** | 🟡 Thấp — cần tối ưu LCP, FCP, bundle size |
| Accessibility | **96** | 🟢 Tốt — các lỗi nhỏ có thể cải thiện |
| Best Practices | **92** | 🟢 Tốt |
| SEO | **100** | 🟢 Xuất sắc |

**Performance blockers chính cần xử lý:**
1. **Render-blocking resources** — critical CSS chaining
2. **Largest Contentful Paint (LCP)** ~ 4-6s — hero image không priority, Google Translate script chặn render
3. **JavaScript execution time** — bundle quá lớn (motion, recharts, lucide icons full tree)
4. **Font display** — Noto Sans + font-display: optional chưa tối ưu
5. **No lazy-load cho below-the-fold images** — thiếu `loading="lazy"`

## Tasks Ghi Nhận Từ Audit UI Mobile (07/07/2026)

| # | Task | Priority | Status |
|---|------|----------|--------|
| M.1 | Tăng touch target `HeaderNav` pills từ 34px → 44px (WCAG 2.5.5) | 🟡 Trung | ✅ Done |
| M.2 | Thêm `4k` breakpoint vào `tailwind.config.ts` (đang dùng trong page.tsx nhưng không định nghĩa) | 🟢 Thấp | ✅ Done |
| M.3 | Kiểm tra console errors sau các fix Google Translate | 🟡 Trung | Pending |
| M.4 | Bottom nav quá nhiều item (6) trên màn hình 320px có thể bị tràn | 🟢 Thấp | Cần theo dõi |
| M.5 | Admin drawer trên mobile dùng `w-4/5 max-w-[300px]` — OK | 🟢 | ✅ OK |
| M.6 | Safe area insets (`env(safe-area-inset-*)`) đã dùng trên body, bottom nav, drawer | 🟢 | ✅ OK |
