# 🚀 KẾ HOẠCH NÂNG CẤP V3 (EXECUTION PLAN)

> **Mục tiêu:** Nâng cấp hệ thống lên chuẩn doanh nghiệp, ưu tiên core operations trước, trải nghiệm & mở rộng sau.
> **Trạng thái:** V3.1–V3.13 ✅ | Tất cả 13 phiên bản V3 đã hoàn thành ✅ | Migrations consolidated → `database.sql`

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
│   ├── V3.6 Interactive Mascot               → Đã xong
│   ├── V3.7 UX Polish & PWA                  → Đã xong
│   ├── V3.8 Real-time Theme                  → Đã xong
│   └── V3.12 Auto SEO Posting                → Đã xong
├── 🧹 TRACK C — FINANCIALS & STABILITY
│   ├── V3.9 Financials & Invoice             → Đã xong
│   ├── V3.10 Hardening                       → Đã xong
│   ├── V3.11 Platform Scaling                → Đã xong
│   └── V3.13 Stability & Polish              → Đã xong
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
| 1 | `ALTER PUBLICATION ... ADD TABLE IF NOT EXISTS` KHÔNG chạy qua PgBouncer | PgBouncer transaction mode không pass syntax này | DO block với `pg_publication_tables` check (tránh `pg_publication_rel` — cũng hang qua PgBouncer) |
| 2 | `database.sql` lỗi thời — thiếu 7 bảng so với thực tế | Rule "NEVER edit database.sql" quá cứng nhắc | Đổi rule → database.sql là schema tổng hợp, cập nhật khi thêm bảng |
| 3 | Không verify RLS + Realtime sau migrations | Thiếu quy trình hậu migration | Audit RLS + Realtime + database.sql ngay sau mỗi migration |
| 4 | SKILL.md sai số table (ghi 18 nhưng thực tế 31) | Không cập nhật SKILL.md cùng schema | Cập nhật SKILL.md section 4 + 9 mỗi khi thay đổi DB |
| 5 | Multi-statement SQL không ổn định qua pooler | PgBouncer xử lý `;`-separated statements không đáng tin | Dùng DO block; `run-migrations.mjs` chạy từng câu riêng |

---

## 📋 CHECKLIST TRƯỚC KHI BẮT ĐẦU V3

| # | Mục | Trạng thái | Ghi chú |
|---|-----|-----------|---------|
| C.1 | Backup database production | [x] | Supabase backup — đã chạy manual |
| C.2 | Tạo nhánh git `v3-dev` | [-] | Bỏ qua — code trực tiếp trên main (single dev) |
| C.3 | Kiểm tra build pass (npm run build) | [x] | Pass — 50 static pages |
| C.4 | Kiểm tra ESLint (npm run lint) | [x] | 0 lỗi |
| C.5 | Kiểm tra test (npm run test) | [x] | 3 test files pass |
| C.6 | Đồng bộ code lên NAS | [x] | Script migrate hoạt động |
| C.7 | Thống báo team/staff về lịch update | [x] | Đã thông báo qua Zalo |

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

## 🧹 TRACK C — STABILITY & SCALING

### ✅ V3.9 — Financials & Invoice ✅
> **Mục tiêu:** Hoá đơn PDF, dashboard tài chính (P&L), báo cáo thuế, sổ quỹ tiền mặt.
> **Pivot:** Bỏ MoMo/ZaloPay (không API key). Bỏ Excel export (đã có ở V3.5). Bỏ POS offline (đã có offline queue V3.7).
> **Nguyên tắc PDF:** Tạo + share/download, không auto-save vào Supabase Storage.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 9.1 | **Hoá đơn PDF khi thanh toán (CASH/BANK)** | [x] | `lib/invoice-pdf.ts` + nút "Xem hoá đơn" / "Tải PDF" ở Step 6 (Thank you), không lưu Storage |
| 9.2 | **Dashboard tài chính nâng cao** | [x] | P&L + dòng tiền + cash flow chart trong TabDashboard |
| 9.3 | **Báo cáo thuế / cuối kỳ** | [x] | Subtab "Thuế" trong TabReports — VAT 8% + TNCN 2%, bảng tháng, tổng năm |
| 9.4 | **Sổ quỹ tiền mặt** | [x] | TabCashRegister: thu/chi, balance, add/delete transaction |

---

### ✅ V3.10 — Hardening (Audited 06/2026)
> **Mục tiêu:** Bảo mật, chống DDOS, kiểm thử.
> **Kết quả audit:** 2/8 tasks đã có sẵn. 4 tasks bỏ qua (overkill cho salon nhỏ). 2 tasks cần làm.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 10.1 | CSP Headers | [x] | Đã có trong `next.config.ts` — 6 headers (CSP, HSTS, XFO, XCTO, Referrer, Perms) |
| 10.2 | Rate limit mở rộng (booking + cron) | [x] | `lib/rate-limit.ts` có sẵn, mở rộng sang booking + cron endpoints |
| 10.3 | `npm audit` trong CI pipeline | [x] | Thêm step vào `.github/workflows/ci.yml` |
| 10.4 | CDN static assets | [-] | **Bỏ qua** — Vercel edge đã đủ cho salon nhỏ |
| 10.5 | Environment validation runtime | [x] | `lib/env.ts` — Zod schema, throw khi thiếu biến |
| 10.6 | WAF rule (rate + DDoS) | [-] | **Bỏ qua** — Vercel infra tự xử lý DDoS |
| 10.7 | Database encryption review | [-] | **Bỏ qua** — không có PII nhạy cảm ngoài tên/SĐT |
| 10.8 | Pen-test: SQLi, XSS, CSRF | [-] | **Bỏ qua** — CSP + Supabase param queries đã bảo vệ cơ bản |

---

### ✅ V3.11 — Platform Scaling + Đa ngôn ngữ (Reviewed 06/2026)
> **Mục tiêu:** Search, Export, Đa ngôn ngữ (Google Translate Widget), Cleanup critical bugs.
> **Pivot:** Thay i18n (next-intl) bằng Google Translate Widget — nhẹ, free, 5 phút cài. Huỷ multi-branch.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 11.1 | **FTS: Full-text search blog & services** | [x] | PostgreSQL tsvector + GIN index + /api/search |
| 11.2 | **Export dữ liệu (CSV, JSON)** | [x] | `lib/export.ts` + `/api/export` + UI trong TabReports |
| 11.3 | **Google Translate Widget** | [x] | `components/GoogleTranslate.tsx` — dropdown VI/EN/KO/ZH-CN/JA/TH/FR/DE/ES, fixed top-right, free, 0 code change cho UI |
| 11.4 | **Multi-branch** | [-] | **Đã huỷ** — salon chỉ 1 cơ sở |
| 11.5 | **Branch selector UI cho admin** | [-] | **Đã huỷ** |
| 11.6 | **Report tổng hợp multi-branch** | [-] | **Đã huỷ** |

> **Ghi chú:** i18n next-intl (~1000 strings, 73 files) là overkill. Google Translate Widget là giải pháp thực tế.

---

### ✅ V3.13 — Stability & Polish ✅
> **Mục tiêu:** Sửa critical bugs (schema, RPC, env), làm sạch code, tăng độ ổn định, tối ưu Vercel + Supabase.
> **Priority:** Cao
> **Trạng thái:** ✅ Đã xong

| # | Task | Trạng thái | Mức độ | Ghi chú |
|---|------|-----------|--------|---------|
| 13.1 | Fix schema `tasks` (thêm: `task_type`, `assignee_type`, `time_slot`, `original_task_id`, `created_by`; đổi: `assigned_to`→`assignee_id`, `due_date`→`deadline`, xoá `assigned_by`) | [x] | 🔴 Critical | Migration + database.sql sync. Xoá hard DELETE (dùng status='cancelled') |
| 13.2 | Tạo bảng `cron_job_logs` | [x] | 🔴 Critical | + RLS policies + Realtime publication + database.sql sync |
| 13.3 | Tạo 4 RPC functions + bảng `background_tasks` | [x] | 🔴 Critical | `enqueue_background_task`, `dequeue_all_background_tasks`, `deduct_package_session`, `refund_package_session` |
| 13.4 | Fix `lib/env.ts` — `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [x] | 🔴 Critical | Thêm env vars: `NEXT_PUBLIC_HOTLINE`, `BANK_ACCOUNT_NUMBER`, `BANK_NAME`, `BANK_ID`, `BANK_ACCOUNT_OWNER` |
| 13.5 | Chuyển hardcoded bank account + phone từ seed data vào env | [x] | 🟠 High | Tạo `lib/defaults.ts` — shared defaults. Fix bypass password fallback (xóa hardcoded). |
| 13.6 | Clean `any` types → proper interfaces | [-] | 🟡 Medium | **Bỏ qua** — 55+ chỗ, low ROI, type-safe from new code |
| 13.7 | Clean console.log trong production code | [x] | 🟡 Medium | Xoá auth leak (3 files), xoá push leak (1 file), xoá reminders verbose (1 file) |
| 13.8 | Fix silent `.catch(() => {})` | [x] | 🟡 Medium | Fix booking actions (push, email, admin notif) — dùng fire-and-forget with logging |
| 13.9 | Fix accessibility: thêm `htmlFor`/`id` cho forms | [-] | 🟢 Low | **Bỏ qua** — 30+ chỗ, cosmetic, defer to later |
| 13.10 | Xoá file chết: `lib/utils.ts`, `lib/api-error.ts` | [x] | 🟢 Low | `cn()` không được import bởi file nào |
| V3.13+ | **Tối ưu Vercel**: next.config.ts `productionBrowserSourceMaps: false`, vercel.json `functions` config (memory, maxDuration) | [x] | ✅ | Giảm bundle size, kiểm soát cron timeout |
| V3.13+ | **Tối ưu Supabase**: Tạo bảng `background_tasks`, `cron_job_logs`, 4 RPC functions cho queue/package ops | [x] | ✅ | Giảm N+1, atomic operations |

---

## 🚀 V3.14 — Payroll + Code Cleanup (Kế hoạch)
> **Mục tiêu:** Tính lương nhân viên hàng tháng (base salary + commission + tips), dọn technical debt (any types, accessibility).
> **Trạng thái:** 📋 Đang lên kế hoạch

### A. 💰 Payroll — Tính lương nhân viên

| # | Task | Trạng thái | Mức độ | Chi tiết |
|---|------|-----------|--------|----------|
| A.1 | Migration: thêm `base_salary`, `bank_account` vào `users` | [ ] | 🔴 | `migrations/migrate_payroll.sql` + `database.sql` |
| A.2 | Tạo bảng `salary_payments` (period, base, commission, tips, bonus, deduction, advance, net, status) + RLS | [ ] | 🔴 | Cột: `staff_id`, `period_start`, `period_end`, `base_salary`, `total_commission`, `total_tips`, `bonus`, `deduction`, `advance`, `net_pay`, `status` (PENDING/PAID), `paid_at`, `paid_by`, `notes` |
| A.3 | Server action: `calculatePayroll(periodStart, periodEnd)` — query commission + tips + attendance per staff, tính net | [ ] | 🔴 | Gộp commission từ appointments, tips, package sale commission; trừ absent days |
| A.4 | Server action: `processPayrollPayment(id)` — đánh dấu PAID + ghi vào cash_register | [ ] | 🟠 | Insert `cash_register` record type='CHI' category='LƯƠNG' |
| A.5 | Admin UI `TabPayroll.tsx`: bảng tính lương tháng, nút Tính/Thanh toán/Xem chi tiết | [ ] | 🔴 | Reuse pattern từ TabCommission — date range, per-staff row, tổng |
| A.6 | Đăng ký tab Payroll trong admin navigation (drawer + sidebar) | [ ] | 🟠 | `app/admin/page.tsx` — thêm PAYROLL vào tab list |
| A.7 | Thêm check-out vào Staff portal (tính giờ làm thực tế) | [ ] | 🟡 | `app/staff/actions.ts` — `checkOut()` function, cập nhật `check_out_time` |
| A.8 | Build + migrate + verify | [ ] | 🔴 | — |

### B. 🧼 V3.13.6 — Clean `any` types (giới hạn)

| # | Task | Trạng thái | Mức độ | File |
|---|------|-----------|--------|------|
| B.1 | `catch (err: any)` → `catch (err: unknown)` API routes (~25 chỗ) | [ ] | 🟡 | `app/api/**/route.ts` |
| B.2 | `catch (e: any)` → admin actions (~15 chỗ) | [ ] | 🟡 | `app/admin/actions.ts` |
| B.3 | `catch (e: any)` → staff actions (~5 chỗ) | [ ] | 🟡 | `app/staff/actions.ts` |
| B.4 | Component props `{...}: any` → interface (~15 chỗ) | [ ] | 🟡 | `app/admin/components/*.tsx`, `components/*.tsx` |
| B.5 | Bỏ qua: `useState<any>` + callback `(item: any)` (~100 chỗ) | [-] | 🟢 | Low ROI, type-safe from new code |

### C. ♿ V3.13.9 — Fix accessibility (htmlFor/id)

| # | Task | Trạng thái | Mức độ | Labels |
|---|------|-----------|--------|--------|
| C.1 | `app/staff/page.tsx` — thêm htmlFor/id (20 labels) | [ ] | 🟢 | ID prefix `staff-` |
| C.2 | `app/admin/components/TabSEO.tsx` (10 labels) | [ ] | 🟢 | ID prefix `seo-` |
| C.3 | `app/admin/components/ServiceModal.tsx` (8 labels) | [ ] | 🟢 | ID prefix `svc-` |
| C.4 | `components/AppointmentDetailModal.tsx` (6 labels) | [ ] | 🟢 | ID prefix `detail-` |
| C.5 | `app/admin/components/TabTasks.tsx` (5 labels) | [ ] | 🟢 | ID prefix `task-` |
| C.6 | `app/admin/orders/page.tsx` (5 labels) | [ ] | 🟢 | ID prefix `order-` |
| C.7 | Các file còn lại (~6 file, ~10 labels) | [ ] | 🟢 | — |

---

## 🛠️ V3.15 — OpenCode Custom Tools & Agents (Developer Experience)
> **Mục tiêu:** Tạo custom tools + subagents cho OpenCode để tự động hoá CI/CD, migration, build check, env check.
> **Trạng thái:** 📋 Đang lên kế hoạch

### A. 🔧 Custom Tools (`<root>/.opencode/tools/`)

| # | Tool | Mô tả | Args |
|---|------|-------|------|
| A.1 | `ci_check` | Chạy full CI pipeline: lint → typecheck → build. Trả về kết quả từng step + exit code + thời gian. | `step?`: "all" \| "lint" \| "typecheck" \| "build" (default: all) |
| A.2 | `build_check` | Chạy `npm run build`, report output + thời gian. | Không args |
| A.3 | `deploy_vercel` | Deploy lên Vercel production. Kiểm tra `vercel.json` tồn tại, dùng token từ args hoặc env `VERCEL_TOKEN`. | `token?`: string |
| A.4 | `migrate_db` | Chạy migration script an toàn dùng `POSTGRES_URL_NON_POOLING`. | `verify?`: boolean (dry-run) |
| A.5 | `check_env` | Đọc `.env.example`, so sánh vs `process.env`, báo cáo biến thiếu. | `strict?`: boolean (default: false) |

**Implement:** Mỗi tool là 1 file `.ts` export `{ description, args, execute }`, dùng `child_process.execSync` — không cần thêm dependency.

### B. 🤖 Custom Subagents (`<root>/opencode.json` hoặc `.opencode/agents/`)

| # | Agent | Mode | Prompt | Tools gọi |
|---|-------|------|--------|-----------|
| B.1 | `ci-fix` | subagent | Chuyên CI/CD — phân tích lỗi CI, chạy kiểm tra, deploy | `ci_check`, `build_check`, `deploy_vercel`, `check_env` |
| B.2 | `db-admin` | subagent | Chuyên database — migration, SQL, Supabase | `migrate_db`, `check_env` |

### C. 📋 Implementation Steps

| # | Task | Trạng thái | Chi tiết |
|---|------|-----------|----------|
| C.1 | Tạo thư mục `.opencode/tools/` | [ ] | — |
| C.2 | Viết `ci_check.ts` | [ ] | Dùng `execSync`, chạy lint → tsc → build, parse output |
| C.3 | Viết `build_check.ts` | [ ] | Đơn giản: `execSync("npm run build", {cwd: worktree})` |
| C.4 | Viết `deploy_vercel.ts` | [ ] | Kiểm tra token, chạy `npx vercel --prod --yes` |
| C.5 | Viết `migrate_db.ts` | [ ] | Chạy `npx tsx scripts/migrate.ts` hoặc `scripts/run-migrations.mjs` |
| C.6 | Viết `check_env.ts` | [ ] | Parse `.env.example`, so sánh process.env, báo cáo |
| C.7 | Tạo `.opencode/agents/ci-fix.md` | [ ] | Subagent prompt + permission chỉ cho tools cần |
| C.8 | Tạo `.opencode/agents/db-admin.md` | [ ] | Subagent prompt + permission |
| C.9 | Verify: test từng tool bằng `@tool_name` | [ ] | — |

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
