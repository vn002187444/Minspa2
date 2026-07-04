# 🚀 KẾ HOẠCH NÂNG CẤP (UPGRADE_PLAN)

> **Tất cả các task chính đã hoàn thành.** Xem chi tiết tại `PLAN.md` → section **CÁC GIAI ĐOẠN NÂNG CẤP HOÀN THÀNH**

---

## 📋 Trạng thái hiện tại

*Phase 11 - SEO & UX Polish hoàn tất. Hệ thống đạt chuẩn Rich Results của Google, hiển thị tiếng Việt chuẩn xác và dịch đa ngôn ngữ ổn định.*

---

## 🛠️ Ghi chú Phase 10 (Final Polish)
- **Performance**: Tối ưu Dynamic Import, Defer scripts, `optimizePackageImports`.
- **Fixes**: Unicode NFC normalization, Google Translate custom UI, Admin route naming.
- **Auto SEO**: Migrate to Supabase Cron (`pg_cron`).
- **Quality**: 0 Lint warnings, 0 Type errors, Build success.

---

## 🔧 Phase 11 — SEO & UX Polish

### 1. Trải nghiệm người dùng (UX)
- **Trang mới**: Hoàn thiện `/about` (Giới thiệu) và `/faq` (Hỏi đáp).
- **Điều hướng**: Tích hợp link About/FAQ vào HeaderNav, BottomNavigation và Sitemap.
- **Font Subset**: Bổ sung `latin-ext` và `vietnamese` vào font Inter/Playfair $\rightarrow$ Fix triệt để lỗi dấu thanh bị tách rời (NFD display issue).
- **Google Translate**: Tối ưu cơ chế trigger `.goog-te-combo` và fix cookie domain $\rightarrow$ Dịch ngôn ngữ hoạt động ổn định, không cần reload.

### 2. Tối ưu hóa Google Search Console (Rich Results)
- **Sửa lỗi `image`**: Bổ sung ảnh đại diện cho toàn bộ Service/Product Schema.
- **Bổ sung Rating**: Kết nối `AggregateRatingSchema` với dữ liệu thực từ DB để hiển thị số sao.
- **Chi tiết Offers**: Thêm `hasMerchantReturnPolicy` và `shippingDetails` cho các gói dịch vụ.
- **Brand Identity**: Thêm thương hiệu `"Min Nail & Hair"` vào toàn bộ Schema.

### 3. Kỹ thuật & Độ tin cậy
- **Unicode NFC**: Triển khai `normalizeNFC` cho toàn bộ luồng ghi dữ liệu trong `migrate.ts`, `seed_blogs.mjs`, và `seed_seo.mjs`.
- **Type Safety**: Khôi phục global type declarations cho Google Translate trong `types/index.ts`.
- **Build Stability**: Fix triệt để các lỗi syntax trong `actions.ts` và `route.ts` $\rightarrow$ Build Vercel thành công 100%.

