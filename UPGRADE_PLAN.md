# 🚀 KẾ HOẠCH NÂNG CẤP V3 (EXECUTION PLAN)

> **Mục tiêu:** Sửa sai toàn bộ các mục thất bại của V2 và nâng cấp hệ thống lên chuẩn doanh nghiệp.
> **Trạng thái:** Sẵn sàng khởi động V3.

---

## 🧠 BẢN ĐỒ TƯ DUY HỆ THỐNG (V3 FOCUS)


- **Staff Operations (Hướng nhân viên)**
    - Commission: Real-time calculation.
- **Admin Dashboard (Hướng quản trị)**
    - Business Control: Revenue reports.
    - System Settings: System health, Banner manager.
- **Infrastructure (Hạ tầng)**
    - Security: Hardening, CSP, Pen-test.
    - Performance: Scaling, i18n, search.

---

## 🧠 V2 Post-Mortem: Lessons Learned cho V3

| # | Vấn đề | Hậu quả | Cách tránh trong V3 |
|---|--------|---------|---------------------|
| 1 | **Orphan features** | Tab Attendance, Settings là orphan | Audit BE→FE mapping đầu session |
| 2 | **Mojibake** | Text hiển thị sai encoding | Kiểm tra UTF-8 encoding |
| 3 | **Thiếu Accessibility** | Forms thiếu htmlFor/id, modals thiếu trap | Dùng checklist (htmlFor, id, useFocusTrap) |
| 4 | **Any types** | Lỗi type cascade khi refactor | Define interface trước khi code |
| 5 | **Migration messy** | 15+ SQL files trong scripts/ | Move applied → `scripts/archive/` |

---

## 🚀 LỘ TRÌNH V3 (ACTIVE ROADMAP)

### 🎯 S17 — Interactive Mascot (Đang có: `BookingMascotGuide.tsx` cơ bản)
> **Mục tiêu:** Mascot di chuyển, nhắc nhở thông minh, tương tác đa bước.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 17.1 | Nâng cấp `BookingMascotGuide` thành component động | [ ] | Dùng Framer Motion cho animation di chuyển |
| 17.2 | Mascot gợi ý dịch vụ theo hành vi người dùng | [ ] | Phân tích step hiện tại để gợi ý |
| 17.3 | Sound effect & Micro-interaction khi click | [ ] | Sử dụng Web Audio API |
| 17.4 | Mascot dashboard cho admin (bật/tắt, chọn kiểu) | [ ] | TabSettings → Mascot config |
| 17.5 | Mascot xuất hiện trên toàn bộ trang (không chỉ booking) | [ ] | Global provider, context-based triggers |
| 17.6 | A/B test tracking tỷ lệ click/booking với mascot | [ ] | `lib/analytics.ts` → event tracking |

---

### 🎯 S18 — Booking Intelligence (Đang có: `lib/scheduling.ts`, `/api/cron/auto-assign`)
> **Mục tiêu:** Gợi ý lịch trống thông minh, auto-assign nhân viên tối ưu.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 18.1 | `findNextAvailableDate()` — tìm ngày trống sớm nhất | [ ] | Service-aware, staff-aware |
| 18.2 | Cải tiến auto-assign: xét kỹ năng + chứng chỉ | [ ] | Thêm bảng `staff_skills` (service_id ↔ staff_id) |
| 18.3 | UI "Gợi ý giờ đẹp" trên booking page | [ ] | Badge ⭐ cho slot đề xuất |
| 18.4 | Caching slot availability (Redis hoặc Supabase) | [ ] | Giảm query lặp |
| 18.5 | Auto-assign batch: tối ưu thuật toán workload | [ ] | Cân bằng tải giữa các nhân viên |
| 18.6 | Lịch sử auto-assign: log & undo | [ ] | Bảng `auto_assign_logs` |

---

### 🎯 S19 — Real-time Theme (Đang có: `ThemeProvider.tsx`, `lib/themes.ts`)
> **Mục tiêu:** Giao diện biến đổi theo thời tiết, lễ hội, sự kiện.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 19.1 | Tích hợp Open-Meteo API thời tiết thực tế | [ ] | Gọi API client-side, cache 30 phút |
| 19.2 | CSS Variable Injector động theo thời tiết | [ ] | Mưa → tông màu ấm, nắng → sáng |
| 19.3 | Theme animation: tuyết rơi, lá rụng, hoa xuân | [ ] | Canvas hoặc CSS particles |
| 19.4 | Admin UI: xem trước theme, lên lịch theme | [ ] | `TabSettings` → Theme scheduler |
| 19.5 | Theme persistence: lưu preference người dùng | [ ] | localStorage + DB cho logged-in |
| 19.6 | Theme cho PWA: theme-color động theo mùa | [ ] | Update `<meta name="theme-color">` |

---

### ⏳ S20 — Financials & Payment (Chờ — cần cấu hình sau)
> **Mục tiêu:** Thanh toán online, hoá đơn tự động, báo cáo tài chính.
> **Trạng thái:** Chưa có cổng thanh toán — tasks 20.1-20.2 ở trạng thái chờ. Các task còn lại làm độc lập. Cần UI bật/tắt từng phương thức + nhập API key sau.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 20.1 | MoMo/ZaloPay QR thanh toán tự động | [/] | Chờ — cần tạo UI config (bật/tắt, nhập API key, webhook URL) |
| 20.2 | Tạo hoá đơn PDF (`jspdf`) sau thanh toán | [/] | Chờ — phụ thuộc 20.1 |
| 20.3 | Xuất báo cáo doanh thu Excel (`exceljs`) | [ ] | Làm được ngay — lọc theo ngày, dịch vụ, nhân viên |
| 20.4 | Dashboard tài chính nâng cao | [ ] | Làm được ngay — biểu đồ P&L, dự báo doanh thu |
| 20.5 | Tính năng refund/hoàn tiền | [ ] | Flow hoàn tiền khi hủy lịch |
| 20.6 | Tích hợp POS offline (Cash Register) | [ ] | Khi mất mạng vẫn bán được |
| 20.7 | UI Settings: bật/tắt cổng thanh toán + nhập API key | [ ] | TabSettings → Payment config form |

---

### 🎯 S21 — Hardening (Đang có: `lib/rate-limit.ts`, test)
> **Mục tiêu:** Bảo mật, hiệu năng, kiểm thử an ninh.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 21.1 | CSP Headers (Content Security Policy) | [ ] | `next.config.ts` → strict CSP |
| 21.2 | Rate limit API-wide (không chỉ login) | [ ] | Middleware pattern + Supabase store |
| 21.3 | Security audit: ZAP/Burp Suite scan | [ ] | CI pipeline + báo cáo |
| 21.4 | CDN cho static assets (Cloudflare/Imgix) | [ ] | next/image remotePatterns |
| 21.5 | Environment validation (runtime check) | [ ] | `lib/env.ts` → `env()` wrapper |
| 21.6 | WAF rule cho API (rate + DDoS protection) | [ ] | Vercel Firewall hoặc Cloudflare |
| 21.7 | Database encryption at rest review | [ ] | Supabase Postgres encryption check |
| 21.8 | Pen-test: SQL injection, XSS, CSRF | [ ] | Tự động + manual |

---


---

### 🎯 S23 — Platform Scaling (Chưa có)
> **Mục tiêu:** Đa ngôn ngữ, multi-branch, tìm kiếm nâng cao.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 23.1 | Cài đặt `next-intl` cho i18n (VI/EN/KR/CN) | [ ] | Route-based hoặc cookie-based |
| 23.2 | Translation management (PO file hoặc DB) | [ ] | Bảng `translations` cho dynamic content |
| 23.3 | Full-text search cho blog & services | [ ] | PostgreSQL FTS hoặc Supabase full-text |
| 23.4 | Multi-branch: thêm cột `branch_id` vào tables | [ ] | Migration + filter queries |
| 23.5 | Branch selector UI cho admin | [ ] | Chuyển đổi giữa các chi nhánh |
| 23.6 | Report tổng hợp multi-branch | [ ] | Gộp doanh thu tất cả chi nhánh |
| 23.7 | Export dữ liệu (CSV, JSON, PDF) | [ ] | `lib/export.ts` — generator pattern |

---

### 🎯 S24 — UX Polish & PWA (Đang có: offline page, PWA manifest)
> **Mục tiêu:** PWA offline hoàn chỉnh, page transitions, polish UI.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 24.1 | Service Worker cache-first strategy | [ ] | Workbox cho static + dynamic |
| 24.2 | Offline fallback cho toàn bộ routes | [ ] | `app/offline/page.tsx` → full experience |
| 24.3 | IndexedDB queue cho offline booking | [ ] | `lib/offline-queue.ts` → sync khi online |
| 24.4 | Page transitions (mượt khi chuyển route) | [ ] | `<AnimatedWrapper>` + CSS transitions |
| 24.5 | Loading skeleton cho mọi page (đang có 5/10) | [ ] | `components/Skeleton.tsx` pattern |
| 24.6 | Micro-interactions: hover, click, scroll | [ ] | `ScrollReveal`, button ripple |
| 24.7 | Reduce bundle size: code-split mọi page | [ ] | `next/dynamic` + `React.lazy` |
| 24.8 | LightHouse score ≥ 90 cho mobile | [ ] | Performance audit + fix |
