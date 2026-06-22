# 🚀 KẾ HOẠCH NÂNG CẤP V3 (EXECUTION PLAN)

> **Mục tiêu:** Nâng cấp hệ thống lên chuẩn doanh nghiệp, ưu tiên core operations trước, trải nghiệm & mở rộng sau.
> **Trạng thái:** V3.1–V3.8, V3.12 ✅ | Migrations consolidated → `database.sql` | Tiếp theo: V3.9 (Financials & Payment)

---

## 🧠 BẢN ĐỒ TƯ DUY V3

```
V3 EXECUTION
├── 🏆 TRACK A — CORE OPERATIONS (Làm ngay)
│   ├── V3.1 Staff Checkout & Payment Flow    → Đã xong
│   ├── V3.2 Staff Booking Hộ Khách           → Đã xong
│   ├── V3.3 Booking Intelligence              → Đã xong
│   ├── V3.4 Task Management                   → Đã xong
│   └── V3.5 Báo cáo & Thống kê Nâng cao      → Đã xong
├── 🎯 TRACK B — EXPERIENCE & MARKETING
│       ├── V3.6 Interactive Mascot                → Đã xong
│       ├── V3.7 UX Polish & PWA                  → Đã xong
│       ├── V3.8 Real-time Theme                   → Đã xong
│   └── V3.12 Auto SEO Posting                → Đã xong
├── 🔒 TRACK C — SECURITY & SCALING
│   ├── V3.9 Financials & Payment             → 7 tasks (chờ)
│   ├── V3.10 Hardening                        → 8 tasks
│   └── V3.11 Platform Scaling                 → 7 tasks
```

## 🧠 V2 Post-Mortem: Lessons Learned cho V3

| # | Vấn đề | Hậu quả | Cách tránh trong V3 |
|---|--------|---------|---------------------|
| 1 | **Orphan features** | Tab Attendance, Settings là orphan | Audit BE→FE mapping đầu session |
| 2 | **Mojibake** | Text hiển thị sai encoding | Kiểm tra UTF-8 encoding |
| 3 | **Thiếu Accessibility** | Forms thiếu htmlFor/id, modals thiếu trap | Dùng checklist (htmlFor, id, useFocusTrap) |
| 4 | **Any types** | Lỗi type cascade khi refactor | Define interface trước khi code |
| 5 | **Migration messy** | 15+ SQL files trong scripts/ | Move applied → `scripts/archive/` |

## 🧠 V3 Post-Mortem: Lessons Learned (cập nhật 06/2026)

| # | Bài học | Nguyên nhân | Fix áp dụng |
|---|---------|------------|-------------|
| 1 | `ALTER PUBLICATION ... ADD TABLE IF NOT EXISTS` KHÔNG chạy qua PgBouncer | PgBouncer transaction mode không pass syntax này | DO block với `pg_publication` + `pg_publication_rel` check |
| 2 | `database.sql` lỗi thời — thiếu 7 bảng so với thực tế | Rule "NEVER edit database.sql" quá cứng nhắc | Đổi rule → database.sql là schema tổng hợp, cập nhật khi thêm bảng |
| 3 | Không verify RLS + Realtime sau migrations | Thiếu quy trình hậu migration | Audit RLS + Realtime + database.sql ngay sau mỗi migration |
| 4 | SKILL.md sai số table (ghi 18 nhưng thực tế 31) | Không cập nhật SKILL.md cùng schema | Cập nhật SKILL.md section 4 + 9 mỗi khi thay đổi DB |
| 5 | Multi-statement SQL không ổn định qua pooler | PgBouncer xử lý `;`-separated statements không đáng tin | Dùng DO block; `run-migrations.mjs` chạy từng câu riêng |

---

## 📋 CHECKLIST TRƯỚC KHI BẮT ĐẦU V3

| # | Mục | Trạng thái | Ghi chú |
|---|-----|-----------|---------|
| C.1 | Backup database production | [ ] | Supabase backup |
| C.2 | Tạo nhánh git `v3-dev` | [ ] | Code trên nhánh riêng |
| C.3 | Kiểm tra build pass (npm run build) | [ ] | Fix lỗi trước khi code |
| C.4 | Kiểm tra ESLint (npm run lint) | [ ] | 0 lỗi |
| C.5 | Kiểm tra test (npm run test) | [ ] | Pass hết |
| C.6 | Đồng bộ code lên NAS | [ ] | Migrate script |
| C.7 | Thống báo team/staff về lịch update | [ ] | Tránh gián đoạn vận hành |

---

## 🚀 TRACK A — CORE OPERATIONS (Priority 1)

### ✅ V3.1 — Staff Checkout & Payment Flow
> **Mục tiêu:** Thiết kế lại luồng hoàn thành đơn hàng của nhân viên.
> **Flow:** Edit đơn → Đánh giá + Tip → Biên lai → CASH/BANK → QR (nếu BANK) → Cảm ơn
> **Trạng thái:** ✅ Đã xong

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1.1 | Thiết kế lại CompleteModal → giao diện edit đơn hàng | [x] | `CheckoutModal.tsx` — multi-step flow |
| 1.2 | Khuyến mãi linh hoạt: % từng DV hoặc % tổng đơn | [x] | Toggle KM theo dòng / KM toàn đơn |
| 1.3 | Bỏ ô nhập tip cũ khỏi CompleteModal | [x] | Tách sang step riêng |
| 1.4 | Giao diện đánh giá DV + chọn tip (10k/20k/30k/50k/custom) | [x] | Rating + quick tags + tip selector |
| 1.5 | Giao diện biên lai xác nhận dịch vụ | [x] | DV → KM → Tip → Tổng |
| 1.6 | Tip hiển thị riêng, **không bị giảm giá** | [x] | Tip không nhân discount% |
| 1.7 | Phương thức thanh toán: CASH / BANK | [x] | Toggle CASH/BANK |
| 1.8 | QR Code cho BANK (kế thừa PaymentQRModal) | [x] | Giữ VietQR |
| 1.9 | Màn hình "Cảm ơn đã thực hiện dịch vụ" kết thúc luồng | [x] | Thank-you screen |
| 1.10 | Xem lại đơn hàng đã hoàn thành sau khi checkout | [x] | `CompletedDetailModal` — xem DV, tổng, tip |
| 1.11 | Edit tip sau khi hoàn thành (sai sót) | [x] | `updateTip` + `EditTipModal` — staff chỉ trong ngày |
| 1.12 | Admin: xem & edit tip từ lịch sử đơn hàng | [x] | `adminUpdateTip` + audit log + cột Tip trong table |

---

### ✅ V3.2 — Staff Booking Hộ Khách
> **Mục tiêu:** Nhân viên tại quầy đặt lịch hộ khách.
> **Trạng thái:** ✅ Đã xong

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 2.1 | Thêm tab "Đặt lịch hộ" trong giao diện Staff | [x] | `/staff` → tab BOOKING, `StaffBookingTab.tsx` |
| 2.2 | Form tìm kiếm/số điện thoại khách hàng | [x] | Tìm SĐT → chọn/tạo mới `getCustomerByPhone` |
| 2.3 | Chọn dịch vụ (multi-select) + tổng thời gian | [x] | Checkbox list, total price + duration |
| 2.4 | Chọn nhân viên (mặc định là chính họ) | [x] | Dropdown staff active, default = self |
| 2.5 | Chọn ngày giờ + kiểm tra trùng lịch | [x] | Reuse BookingCalendar + slot availability |
| 2.6 | Áp dụng gói liệu trình của khách | [x] | `getCustomerActivePackages` + select |
| 2.7 | Ghi chú lịch hẹn | [x] | Textarea → `notes` |
| 2.8 | Xác nhận & tạo lịch — update realtime | [x] | `submitBooking` + Realtime |
| 2.9 | In hoá đơn tạm sau khi đặt | [x] | `window.print()` button |

---

### ✅ V3.3 — Booking Intelligence
> **Mục tiêu:** Gợi ý lịch trống thông minh, auto-assign tối ưu.
> **Trạng thái:** ✅ Đã xong

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 3.1 | `findNextAvailableDate()` — tìm ngày trống sớm nhất | [x] | `lib/booking-engine.ts:285` |
| 3.2 | Cải tiến auto-assign: xét kỹ năng + chứng chỉ | [x] | Bảng `staff_skills` + `lib/scheduling.ts:208-230` |
| 3.3 | UI "Gợi ý giờ đẹp" trên booking page | [x] | Đã có `isRecommended` logic + ⭐ badge |
| 3.4 | Caching slot availability | [x] | `lib/slot-cache.ts` (in-memory, 15-30s TTL) |
| 3.5 | Cho phép đặt lịch ngày mai dù chưa điểm danh | [x] | `booking-engine.ts:332-338` — skip attendance cho T&gt;today |
| 3.6 | Giới hạn 1 slot / khung giờ cho ngày mai | [x] | Bảng `slot_limits` + `booking-engine.ts:358-369` |
| 3.7 | Auto-assign batch: tối ưu workload | [x] | `lib/scheduling.ts:233` — sort by start_time + workload balance |
| 3.8 | Lịch sử auto-assign: log & undo | [x] | Bảng `auto_assign_logs` + `logAutoAssign()` |

---

### ✅ V3.4 — Task Management (Công việc nội bộ)
> **Mục tiêu:** Phân công việc: Admin tạo → Staff nhận → Theo dõi → Thông báo.
> **Trạng thái:** ✅ Đã xong

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 4.1 | Tạo bảng `tasks` trong database | [x] | id, title, type (daily/one_time), assignee, deadline, status |
| 4.2 | Admin UI: tạo công việc mới | [x] | `TabTasks.tsx` — CreateTaskModal |
| 4.3 | Chọn **daily** → auto nhắc lại hàng ngày | [x] | Cron job `clone-daily-tasks` |
| 4.4 | Admin: chọn "Toàn bộ NV" hoặc chỉ định | [x] | Radio: All / Specific trong modal |
| 4.5 | Staff UI: danh sách công việc được giao | [x] | `StaffTasksTab` trong `/staff` |
| 4.6 | Staff nhận việc (Nhận / Từ chối) | [x] | Nhận → IN_PROGRESS, Từ chối → REJECTED |
| 4.7 | Staff cập nhật: Đang làm / Hoàn thành | [x] | Đang làm → IN_PROGRESS, Hoàn thành → COMPLETED |
| 4.8 | Thông báo admin khi NV hoàn thành | [x] | `updateTaskStatus` → insert notifications |
| 4.9 | Cron job kiểm tra việc chưa nhận quá 2h | [x] | `api/cron/check-tasks/route.ts` (4.9) + overdue check (4.10) |
| 4.10 | Thông báo khi quá hạn hoàn thành | [x] | Gộp trong cron check-tasks, insert notif cho admin |
| 4.11 | Dashboard stats trong admin TabTasks | [x] | `getTaskStats()` — tổng/chờ/đang làm/hoàn thành/trễ hạn |
| 4.12 | Tìm kiếm + lọc theo assignee + lọc theo loại | [x] | Searchbar + advanced filters (assignee, task_type) trong TabTasks |

---

### ✅ V3.5 — Báo cáo & Thống kê Nâng cao
> **Mục tiêu:** Dashboard KPI real-time, báo cáo đa chiều (DV/NV/KH), so sánh tăng trưởng, xuất PDF/Excel, gửi email định kỳ.
> **Trạng thái:** ✅ Đã xong

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 5.1 | Dashboard tổng quan KPI real-time | [x] | OverviewTab: 4 stat cards + doanh thu chart + top DV/NV |
| 5.2 | Báo cáo doanh thu theo ngày/tuần/tháng/năm | [x] | RevenueTab: BarChart + AreaChart, range filter |
| 5.3 | Báo cáo theo dịch vụ (top service, doanh thu từng DV) | [x] | ServiceTab: PieChart + bảng xếp hạng |
| 5.4 | Báo cáo theo nhân viên (năng suất, doanh thu, tip) | [x] | StaffTab: BarChart ngang + bảng doanh thu/tip/đơn |
| 5.5 | Báo cáo khách hàng (top chi tiêu, tần suất, retention) | [x] | CustomerTab: KH mới/quay lại, top 15 chi tiêu |
| 5.6 | So sánh tăng trưởng (YoY / MoM / WoW) | [x] | GrowthTab: bar chart kỳ này/kỳ trước, % tăng trưởng |
| 5.7 | Custom date range cho mọi báo cáo | [x] | 5 range (7 ngày/tháng/tháng trước/năm/tùy chọn) + compare checkbox |
| 5.8 | Xuất PDF (`jspdf`) + Excel (`xlsx`) cho mọi báo cáo | [x] | Nút PDF + Excel, jsPDF autoTable, 4 sheet Excel |
| 5.9 | Lịch gửi báo cáo định kỳ qua email | [x] | Cron job `email-report`, push notification cho admin |
| 5.10 | Drill-down: click biểu đồ → xem chi tiết | [x] | Modal drill-down, click hàng → xem detail |

---

## 🎯 TRACK B — EXPERIENCE & MARKETING (Priority 2)

### 🎯 V3.6 — Interactive Mascot
> **Mục tiêu:** Mascot vui nhộn, hướng dẫn, tương tác đa bước.

| # | Task | Trạng thái | Ghi chú |
|:--|------|-----------|---------|
| 6.1 | Nâng cấp `BookingMascotGuide` động | [x] | Multiple expressions (happy/thinking/excited/idle), idle animation cycle, tip auto-reveal, spring transitions |
| 6.2 | Gợi ý dịch vụ theo hành vi người dùng | [x] | `currentCategory` → `serviceSuggestions` mapping → clickable suggestion buttons |
| 6.3 | Sound effect & Micro-interaction | [x] | `lib/sounds.ts` — Web Audio API (pop, success, click) |
| 6.4 | Admin config mascot (bật/tắt, chọn kiểu) | [x] | TabSettings: enable/disable, 3 characters (Min/Sparkle/Flower), sound toggle |
| 6.5 | Mascot xuất hiện toàn bộ trang | [x] | `MascotProvider.tsx` — floating mascot bottom-right + context API |
| 6.6 | Mascot homepage: hướng dẫn DV vui nhộn | [x] | `HomeMascotBanner.tsx` — 4 service tips với dot navigation |
| 6.7 | A/B test tracking tỷ lệ click/booking | [x] | `trackMascotEvent()` + `getMascotStats()` trong `lib/analytics.ts` |

---

### 🎯 V3.7 — UX Polish & PWA
> **Mục tiêu:** PWA offline, page transitions, UI polish.

| # | Task | Trạng thái | Ghi chú |
|:--|------|-----------|---------|
| 7.1 | Service Worker cache-first cho static assets | [x] | `public/sw.js` — cache-first cho JS/CSS/images/fonts, network-first cho pages |
| 7.2 | Offline fallback cho toàn bộ routes | [x] | `app/offline/page.tsx` + SW serve `/offline` khi offline navigation |
| 7.3 | IndexedDB queue cho offline booking | [x] | `lib/offline-queue.ts` + `hooks/useOnlineSync.ts` auto-sync |
| 7.4 | Page transitions (nâng cấp) | [x] | `components/animated-wrapper.tsx` — motion fade + slide, exit animation |
| 7.5 | Loading skeleton (5/5 pages) | [x] | `Skeleton.tsx` (Card/List/Table) + loading.tsx (root, booking, admin, staff, blog) |
| 7.6 | Micro-interactions (ripple) | [x] | `components/RippleButton.tsx` + `animate-ripple` keyframe + `hover-magnetic` |
| 7.7 | Code-split admin tab components | [x] | 14 tabs dùng `next/dynamic` với skeleton fallback |
| 7.8 | Performance tối ưu | [x] | `poweredByHeader: false`, `minimumCacheTTL: 86400`, preconnect/dns-prefetch/preload |

---

### 🎯 V3.8 — Real-time Theme
> **Mục tiêu:** Giao diện biến đổi theo thời tiết & lễ hội.
> **Migration:** `scripts/archive/migrations/migrate_theme_settings.sql` — thêm `theme_override`, `theme_particles_enabled` và `seo_settings`

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 8.1 | Open-Meteo API thời tiết | [x] | `lib/weather.ts` — cache 30 phút, decode WMO code → 5 condition |
| 8.2 | CSS Variable Injector theo thời tiết | [x] | `ThemeProvider.tsx` kết hợp `data-theme` + `getThemeModifier()` |
| 8.3 | Theme animation: tuyết, lá, hoa | [x] | `components/ThemeParticles.tsx` — Canvas particle system (snow/leaves/petals) |
| 8.4 | Admin UI: xem trước & lên lịch theme | [x] | TabSettings: dropdown override + preview swatch + particles toggle |
| 8.5 | Theme persistence (localStorage + DB) | [x] | `localStorage('min_theme_config')` + `seo_settings.theme_override` |
| 8.6 | Theme-color động cho PWA | [x] | `ThemeProvider` cập nhật `<meta name="theme-color">` khi theme thay đổi |

---

### ✅ V3.12 — Tự động đăng bài SEO (Gemini + Cron) [SIMPLIFIED]
> **Mục tiêu:** Hàng tuần, hệ thống tự động pick topic → research → viết bài → publish → notify.
> **Migration:** `migrations/migrate_v312_auto_seo.sql` — thêm `status`, `scheduled_at`, `topic_source`, `backlinks`, `blog_slug`, `published_at` vào `seo_articles` + tạo bảng `auto_seo_config`
> **Trạng thái:** ✅ Đã xong

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 12.1 | Migration: `seo_articles` + `auto_seo_config` | [x] | `migrate_v312_auto_seo.sql` — gộp 3 bảng gốc thành 1 migration |
| 12.2 | Pipeline core `lib/auto-seo.ts` | [x] | `pickTopic()` → `researchTopic()` → `generateArticle()` → `publishToBlog()` → `saveArticleRecord()` → `notifyAdmin()` |
| 12.3 | Cron endpoint `app/api/cron/seo-publish/route.ts` | [x] | Auth pattern như `cron/marketing`, gọi `runAutoSeo()` |
| 12.4 | Admin UI `TabAutoSEO.tsx` — config + lịch sử | [x] | Sub-tab "Auto SEO 🤖" trong TabSEO: toggle, schedule, topic pool, history |
| 12.5 | Admin actions `getAutoSeoConfig/saveAutoSeoConfig/getAutoSeoHistory` | [x] | `app/admin/actions.ts` |
| 12.6 | Thông báo admin khi có bài mới | [x] | Email notification trong `notifyAdmin()` |

---

## 🔒 TRACK C — SECURITY & SCALING (Priority 3)

### ⏳ V3.9 — Financials & Payment (Chờ)
> **Mục tiêu:** Thanh toán online, hoá đơn, báo cáo tài chính.
> **Trạng thái:** Task chờ cổng thanh toán (MoMo/ZaloPay). Các task độc lập làm trước.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 9.1 | MoMo/ZaloPay QR thanh toán | [/] | Chờ API key |
| 9.2 | Hoá đơn PDF (`jspdf`) | [/] | Chờ 9.1 |
| 9.3 | Xuất báo cáo doanh thu Excel (`exceljs`) | [ ] | Làm ngay được |
| 9.4 | Dashboard tài chính nâng cao | [ ] | Làm ngay được |
| 9.5 | Refund/hoàn tiền | [ ] | Flow hủy → hoàn |
| 9.6 | POS offline (Cash Register) | [ ] | Offline vẫn bán |
| 9.7 | UI Settings: bật/tắt cổng + nhập API key | [ ] | TabSettings |

---

### 🎯 V3.10 — Hardening
> **Mục tiêu:** Bảo mật, chống DDOS, kiểm thử.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 10.1 | CSP Headers cứng hơn | [ ] | next.config.ts |
| 10.2 | Rate limit API-wide | [ ] | Middleware pattern |
| 10.3 | Security audit (ZAP/Burp Suite) | [ ] | CI pipeline |
| 10.4 | CDN static assets | [ ] | Cloudflare/Imgix |
| 10.5 | Environment validation runtime | [ ] | lib/env.ts |
| 10.6 | WAF rule (rate + DDoS) | [ ] | Vercel/Cloudflare |
| 10.7 | Database encryption review | [ ] | Supabase check |
| 10.8 | Pen-test: SQLi, XSS, CSRF | [ ] | Auto + manual |

---

### 🎯 V3.11 — Platform Scaling
> **Mục tiêu:** Đa ngôn ngữ, multi-branch, search.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 11.1 | Cài đặt `next-intl` i18n (VI/EN/KR/CN) | [ ] | Route/cookie based |
| 11.2 | Translation management | [ ] | PO file hoặc DB |
| 11.3 | Full-text search blog & services | [ ] | PostgreSQL FTS |
| 11.4 | Multi-branch: thêm `branch_id` | [ ] | Migration + queries |
| 11.5 | Branch selector UI cho admin | [ ] | Chuyển chi nhánh |
| 11.6 | Report tổng hợp multi-branch | [ ] | Gộp doanh thu |
| 11.7 | Export dữ liệu (CSV, JSON, PDF) | [ ] | lib/export.ts |

---

## 📋 NGUYÊN TẮC MIGRATION DATABASE (áp dụng cho mọi V3.x)

### Checklist khi thêm bảng mới
```
□ Viết CREATE TABLE trong migration file + database.sql
□ Thêm ALTER TABLE ... ENABLE ROW LEVEL SECURITY
□ Nếu cần realtime → thêm vào supabase_realtime publication (dùng DO block)
□ Thêm GRANT quyền cho service_role + authenticated (nếu cần)
□ Kiểm tra syntax qua pooler trước khi apply
□ Sau khi apply → archive migration → xoá file migrate cũ
□ Cập nhật SKILL.md (section 4 + section 9)
□ Cập nhật PLAN.md + UPGRADE_PLAN.md
```

### PgBouncer-safe SQL patterns

| Pattern | Không dùng | Thay bằng |
|---------|-----------|-----------|
| Publication | `ALTER PUBLICATION ... ADD TABLE IF NOT EXISTS` | DO block với `pg_publication` check |
| Conditional DDL | `CREATE TABLE IF NOT EXISTS` (safe) | Giữ nguyên (safe) |
| Multi-statement | `stmt1; stmt2; stmt3` trong 1 query | Tách từng câu hoặc DO block |
| Index | `CREATE INDEX IF NOT EXISTS` (safe) | Giữ nguyên (safe) |
