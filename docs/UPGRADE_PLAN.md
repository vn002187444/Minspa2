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

## Status (Updated 01/07/2026)

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
