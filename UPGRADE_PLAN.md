# 🚀 KẾ HOẠCH NÂNG CẤP (UPGRADE_PLAN)

## 📋 Phase 12 — SEO Polish & Code Hygiene

### 1. SEO nâng cao
- [x] **P12.1** Thêm `metadataBase` vào `generateMetadata()` trong root `layout.tsx` để OG URLs luôn absolute.
- [x] **P12.2** Tạo `public/og-default.svg` (1200×630) cho social sharing — fallback khi DB chưa có og_image_url.
- [x] **P12.3** Gỡ subset `latin-ext` khỏi `Playfair_Display` (salon Việt Nam, font chỉ dùng heading).

### 2. Code Hygiene
- [x] **P12.4** Tạo `getBaseUrl()` helper trong `lib/env.ts` — migrate all 14 files (layout, pages, API routes, server actions).
- [x] **P12.5** Thêm `NEXT_PUBLIC_APP_URL` vào env schema validation (`lib/env.ts`).

### 3. Low Priority (nice-to-have)
- [x] **P12.6** Chuyển inline `style={}` trong `IosErrorHandler.tsx` thành Tailwind classes (component dev-only).
- [x] **P12.7** Thêm Web Vitals reporting component (`components/WebVitals.tsx` + gửi qua GA).
- [ ] **P12.8** Preload font file thật (Noto Sans Vietnamese .woff2) — hiện mới chỉ có `preconnect` fonts.gstatic.com.

