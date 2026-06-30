# 📋 LỘ TRÌNH PHÁT TRIỂN & QUẢN LÝ TÍNH NĂNG - MIN NAIL & HAIR

Chào mừng đến với bảng kế hoạch tổng thể của dự án **Min Nail & Hair**. Tài liệu này ghi nhận hành trình phát triển, trạng thái hoàn thành của từng module và luồng nghiệp vụ (Workflow) cốt lõi của hệ thống.

---

## 🗺️ LỘ TRÌNH 7 GIAI ĐOẠN NÂNG CẤP CỐT LÕI

### 🟢 Giai đoạn 1: Khởi Tạo Hệ Thống & Booking Client (Đặt Lịch Trực Tuyến)
Cung cấp giao diện đặt lịch mượt mà cho khách hàng ngoài trang chủ không cần đăng nhập phức tạp.
- [x] Giao diện Landing Page chuẩn Spa: Sang trọng, ấm cúng và đầy đủ thông tin dịch vụ.
- [x] Module Booking thông minh: Cho phép chọn dịch vụ, chọn nhân viên (hoặc ngẫu nhiên), chọn ngày giờ trực quan.
- [x] Tích hợp kiểm tra thẻ liệu trình chủ động: Khách hàng nhập số điện thoại, hệ thống tự nhận diện các gói liệu trình còn buổi của họ để đề xuất sử dụng ngay khi đặt lịch.
- [x] Tra cứu lịch hẹn (`AppointmentLookup`): Tìm kiếm trạng thái lịch hẹn qua SĐT.

### 🟢 Giai đoạn 2: Hệ Thống Quản Trị Nhân Viên (Staff Portal) & Admin
Phân quyền truy cập bảo mật cao qua phân hệ Admin và Portal cho thợ làm móng/tóc.
- [x] Đăng nhập phân quyền (`ADMIN`, `MANAGER` hoặc `STAFF`).
- [x] Giao diện Quầy Nhân Viên (`/staff`):
  - [x] Chấm công đầu ngày (Chụp ảnh/Check-in vị trí hoặc trạng thái).
  - [x] Quản lý danh sách lịch hẹn được giao trong ngày, cập nhật trạng thái lịch hẹn (`CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED`).
  - [x] Tính toán hoa hồng tức thời dựa trên dịch vụ đã phục vụ và tiền Tip từ khách hàng.
- [x] Giao diện Quản trị viên (`/admin`):
  - [x] Tổng quan tình trạng đặt lịch hôm nay.
  - [x] Quản lý doanh thu, biểu đồ phân bổ trạng thái lịch hẹn.
  - [x] Quản lý dịch vụ (kèm upload/tạo ảnh AI), gói liệu trình, nhân viên.
  - [x] Quản lý lịch tổng (`/admin/schedule`) hiển thị các cột giờ có khách.
  - [x] Quản lý Blog SEO AI, SEO settings, bank settings, banner settings.

### 🟢 Giai đoạn 3: Phân Hệ Blog SEO & Trí Tuệ Nhân Tạo (Creative AI)
Tăng trưởng lượng truy cập tự nhiên (Organic Traffic) nhờ hệ thống viết bài thông minh.
- [x] Trang danh sách Blog công khai (`/blog`) hiển thị đầy đủ tin tức chăm sóc sắc đẹp.
- [x] Trang chi tiết bài viết chuẩn SEO (`/blog/[slug]`) hỗ trợ hiển thị Markdown mềm mại.
- [x] Trình quản trị Blog SEO AI (`/admin?tab=blog` hoặc `/admin/blog`):
  - [x] Viết bài chuẩn SEO tự động bằng Gemini (`gemini-2.5-flash-lite`) tích hợp nghiên cứu thông tin làm đẹp online thời gian thực (Google Search Grounding).
  - [x] Chức năng sinh từ khóa SEO tự động gắn liền với địa danh địa phương (Ví dụ: "gội dưỡng sinh Lavita Charm", "làm móng Thủ Đức").
  - [x] Quản lý lịch sử bài viết đã lưu, cho phép chỉnh sửa bài viết trực tiếp qua giao diện trực quan trước khi phát hành.

### 🟢 Giai đoạn 4: Quản Lý Phân Loại Dịch Vụ & Biểu Phí Khuyến Mãi
- [x] Quản lý danh mục dịch vụ (Móng, Gội dưỡng sinh, Massage, Deal).
- [x] Thiết lập giảm giá (`discount_percentage`) trực tiếp cho từng dịch vụ để tự độ áp dụng vào giá trị hóa đơn.
- [x] Thiết lập ẩn/hiện (`is_active` - Soft Delete) của dịch vụ để không ảnh hưởng đến dữ liệu lịch hẹn cũ.
- [x] Upload ảnh dịch vụ thủ công hoặc AI tạo ảnh dịch vụ, lưu vào Supabase Storage (`seo-images` bucket), hiển thị trên homepage và menu dịch vụ.

### 🟢 Giai đoạn 5: Phân Hệ CRM Khách Hàng & Quản Lý Gói Liệu Trình (Treatment Packages)
Hỗ trợ Spa giữ chân khách hàng (Retention Rate) thông qua các gói mua trước sử dụng sau.
- [x] Quản lý hồ sơ khách hàng đầy đủ tại mục Admin & Staff (Xem lịch sử đặt hẹn, tổng chi tiêu, đánh giá dịch vụ).
- [x] Quản lý gói liệu trình gốc (`treatment_packages`): Định nghĩa gói (Ví dụ: Mua 5 tặng 1, mua 10 tặng 2) kèm theo dịch vụ áp dụng và đơn giá.
- [x] Soft delete cho gói liệu trình (`is_active`): Ẩn gói thay vì xóa cứng, hiển thị "Đã ẩn" trong admin, filter `is_active=true` cho public.
- [x] Cấp phát gói cho khách hàng (`customer_packages`): Thêm gói trực tiếp cho khách hàng tại màn hình Quản trị/Nhân viên khi họ mua trực tiếp tại quầy.
- [x] Quản lý lịch sử trừ buổi (`package_usage_logs`): Ghi log chi tiết mỗi khi trừ buổi (Ai trừ, lúc nào, lịch hẹn nào).

### 🟢 Giai đoạn 6: Tính Năng PWA, Web Push & Nhắc Lịch Tự Động (Reminders Cron)
Tối ưu hóa khả năng liên quan đến chăm sóc khách hàng và chấm công nhân sự.
- [x] Hỗ trợ cài đặt ứng dụng dạng PWA (`InstallPWA.tsx`) trên cả thiết bị iOS (Safari) và Android.
- [x] Chạy nền theo lịch trình thông minh `/api/cron-check` và `/api/cron/reminders` để tự động thực hiện các hành động:
  - [x] **Cảnh báo chấm công (Attendance Reminders Log)**: Nhắc nhở nhân viên chưa chấm công check-in mỗi sáng.
  - [x] **Nhắc lịch hẹn ngẫu nhiên (Random Booking Reminders)**: Gửi thông báo đến Admin khi có lịch hẹn được đặt ngẫu nhiên nhân viên chưa được gán.
  - [x] **Nhắc duyệt lịch (Unaccepted Booking Reminders)**: Cảnh báo khi có lịch hẹn trạng thái PENDING quá lâu chưa được đổi sang CONFIRMED.
  - [x] **Nhắc hoàn thành lịch (Uncompleted Booking Reminders)**: Tự động cảnh báo các đơn đặt lịch đã qua thời gian hẹn nhưng nhân viên chưa chuyển thành COMPLETED.

### 🟢 Giai đoạn 7: Hệ Thống KPI, Chấm Công Nâng Cao & Tối Ưu Hiệu Năng
- [x] Tinh chỉnh hệ thống log reminders background để tối ưu hóa tần suất chạy hạn chế quá tải bộ nhớ.
- [x] Quản lý bảng chấm công (`attendance`) theo ngày cho toàn bộ nhân sự spa.
- [-] Tích hợp tính toán nợ lương/thưởng nâng cao tự động gửi báo cáo cuối tháng hóa đơn *(chuyển sang phase sau V3 — không critical, salon nhỏ tự tính bằng Excel)*

### 🟢 V3.11 — Đa ngôn ngữ (Google Translate Widget)
- [x] Cài Google Translate Widget (VI/EN/KO/ZH-CN/JA/TH/FR/DE/ES) — dropdown top-right
- [-] Huỷ i18n next-intl (overkill cho salon 1 cơ sở)
- [-] Huỷ multi-branch (salon chỉ 1 cơ sở)

### 🟢 V3.9 — Financials & Invoice
- [x] Bỏ MoMo/ZaloPay (không có API key)
- [x] Hoá đơn PDF khi thanh toán (tạo + nút Xem/Tải, không lưu Storage)
- [x] Dashboard tài chính nâng cao (P&L, dòng tiền)
- [x] Báo cáo thuế cuối kỳ
- [x] Sổ quỹ tiền mặt (thu/chi ngoài booking)

### 🟢 V3.13 — Stability & Polish ✅
- [x] Fix 4 critical bugs: tasks schema, cron_job_logs table, 4 RPCs, env.ts env var names
- [x] Clean code: removed auth console.log (security leak), removed dead files (lib/utils.ts, lib/api-error.ts), fixed silent catch handlers in booking actions
- [x] Security: removed hardcoded bypass password fallbacks, added env vars for bank/hotline
- [x] Vercel optimization: next.config.ts (productionBrowserSourceMaps: false), vercel.json (function configs, memory/duration limits)
- [x] Supabase optimization: created background_tasks table, cron_job_logs table, 4 RPC functions for queue/package ops

---

## 🔄 WORKFLOWS (LUỒNG QUY TRÌNH VẬN HÀNH PHỨC TẠP)

### 1. Luồng mua và trừ buổi Gói Liệu Trình (Treatment Package Flow)
```
[ Khách hàng đến tiệm ] ──> Kỹ thuật viên tư vấn bán gói liệu trình (Ví dụ: "Combo 5 Gội An Yên")
          │
          ▼
[ Admin/Staff cấp gói ] ──> Thêm mới bản ghi vào `customer_packages` (remaining_sessions = 6)
          │
          ▼
[ Khách hàng đặt lịch hẹn tiếp theo ]
          │
      ┌───┴─── Khách đặt qua Landing Page hoặc gọi trực tiếp 
      ▼
[ Hệ thống kiểm tra SĐT ] ──> Nhận diện gói liệu trình còn buổi ──> Đề xuất "Sử dụng 1 buổi"
          │
          ▼
[ Trị liệu hoàn tất ] ──> Nhân viên bấm "Hoàn thành Lịch Hẹn" (COMPLETED)
          │
          ▼
[ Hệ thống trừ buổi tự động ] ──> Trừ remaining_sessions và khởi tạo 1 bản ghi vào `package_usage_logs` để đối soát sau này.
```

### 2. Luồng phân quyền Nhân Viên (Admin & Staff Portal Flow)
- **ADMIN**:
  - Có toàn quyền truy cập toàn bộ hệ thống (`/app/admin`).
  - Quản lý doanh thu, cấu hình dịch vụ, thiết lập gói liệu trình, thêm tài khoản nhân viên, xem lịch sử nhật ký.
- **STAFF**:
  - Chỉ được phép truy cập cổng nhân viên `/app/staff` (nếu cố tình vào `/app/admin` sẽ bị Next.js Middleware hoặc logic chuyển hướng chặn lại).
  - Chỉ xem các lịch hẹn được giao cho cá nhân hoặc các lịch hẹn chung chờ phân bổ.
  - Được quyền check-in chấm công hàng ngày cho chính mình.
  - Được quyền trừ buổi gói liệu trình của khách hàng khi khách hàng đến làm đẹp tại quầy phục vụ của họ.

---

## 📊 CÁC GIAI ĐOẠN NÂNG CẤP HOÀN THÀNH

### 🟢 Phase 1 — P0: Critical (Lỗi sai + Bảo mật) ✅
- [x] **P1.1** Vấn đề 4: Session persistence (middleware + auth + logout + /api/auth/me)
- [x] **P1.2** Vấn đề 6a: Chặn soft-delete staff login (login actions + API)
- [x] **P1.3** Vấn đề 2: MasterSchedule attendance (actions + MasterSchedule.tsx)

### 🟢 Phase 2 — P1: High (Nâng cấp UI/UX) ✅
- [x] **P2.1** Vấn đề 1: Staff status UI + toggle (admin page + actions)
- [x] **P2.2** Vấn đề 6b: Filter is_active trong query (commission, schedule, notif)
- [x] **P2.3** Vấn đề 5: Booking time slots (giờ 20:30, ẩn slot quá giờ, date picker 14 ngày, badge "⭐ Gợi ý", cache localStorage, fix hardcoded 30 → totalDuration động)
- [x] **P2.4** Vấn đề 6c: Index + NOT NULL DB (migration + database.sql)

### 🟢 Phase 3 — P2: Medium (Layout + Performance) ✅
- [x] **P3.1** Vấn đề 3: Bell layout admin
- [ ] ~~**P3.2** Vấn đề 7a: Edge middleware + Redis cache~~ *(Bỏ qua — Edge runtime không tương thích jose; Redis cần Upstash infrastructure)*
- [x] **P3.3** Vấn đề 7b: Composite index (idx_attendance_date_status, idx_appointments_start_time_status) + N+1 (đã fix từ trước trong getScheduleData)
- [x] **P3.4** Vấn đề 7c: Realtime notifications (subscribe channel + giảm polling 30s → 5 phút)

### 🟢 Phase 4 — Code & Deployment Optimization ✅
- [x] **P4.1** Tailwind content paths — fix missing classes in production
- [x] **P4.2** TypeScript target ES5 → ES2017 — giảm bundle size
- [x] **P4.3** next.config.ts — images remotePatterns + logging
- [x] **P4.4** Admin page: 4.956 → 424 dòng (16 component files)
- [x] **P4.5** MasterSchedule: 1.277 → ~430 dòng (4 component files)
- [x] **P4.6** Xoá `lib/push.ts` duplicate
- [x] **P4.7** Xoá `utils/supabase/middleware.ts` stub
- [x] **P4.8** Booking actions: 699 dòng → 6 file domain
- [x] **P4.9** Tạo `hooks/` + `types/` directories
- [x] **P4.10** Error boundaries cho 4 routes
- [x] **P4.11** Login bypass hardcoded → env vars
- [x] **P4.12** ESLint no-unused-vars + exhaustive-deps
- [x] **P4.13** CSS keyframes → tailwind.config.ts
- [x] **P4.14** Fix seed_blogs.sql syntax

### 🟢 Phase 5 — Cron Job Edge Function ✅
- [x] **P5.1** Tạo Edge Function `cron-trigger` thay polling client 30s
- [x] **P5.2** Xoá polling useEffect trong `PwaSupport.tsx`
- [x] **P5.3** Thêm `x-cron-secret` check trong `/api/cron-check`

### 🟢 Phase 6 — Gói Liệu Trình Nâng Cao (Package Enhancement) ✅
- [x] **P6.1** Thêm cột `expires_at` cho `customer_packages` (mặc định 2 năm)
- [x] **P6.2** `sellPackageToCustomer`: Tạo mới (không gộp), set `expires_at` = 2 năm
- [x] **P6.3** `checkCustomerHistory`: Trả về grouped packages, filter hết hạn
- [x] **P6.4** Booking UI: Hiển thị tất cả gói, auto-select priority cho cùng loại, manual cho khác loại
- [x] **P6.5** Hủy lịch: Hoàn buổi ngay lập tức
- [x] **P6.6** Trừ buổi: RPC/optimistic lock tránh race condition

### 🟢 Phase 7 — Tối ưu Vercel & Supabase ✅
- [x] **P7.9** Giới hạn result mặc định (limit select) — tất cả queries trong admin, staff, booking
- [x] **P7.12** RLS policy cho notifications — `scripts/migrate_p7_12_rls_notifications.sql`
- [x] **P7.3** Batch API — submitBooking() đã gộp sẵn trong 1 server action
- [x] **P7.17** Incremental realtime migration — Staff page + Dashboard dùng Supabase Realtime, polling 5 phút fallback
- [x] **P7.5** Lazy-load recharts — `TabDashboard.tsx` chuyển sang `next/dynamic`
- [x] **P7.15** Server Action → API Route — Tách background tasks (push + reminders) sang `/api/booking/background-tasks`
- [x] **P7.13** EXPLAIN ANALYZE monitoring — `scripts/monitor_queries.sql`
- [x] **P7.6** Unused code cleanup — xóa package `motion` + `@dnd-kit/utilities`
- [x] **P7.10** PostgreSQL VIEW cho commission report — `scripts/migrate_p7_10_view.sql`
- [x] **P7.14** Connection pooling — Supabase JS client tự xử lý qua PostgREST

---

## 📜 QUY TẮC VẬN HÀNH & GIAO TIẾP (CYCLE PROTOCOL)

> **Mục đích:** Đảm bảo mọi developer (con người hoặc AI) đều đọc–hiểu–thực hiện nhất quán.

### 1. Trật tự đọc khi bắt đầu làm việc

```
1. Đọc PLAN.md        → Xem tổng quan + trạng thái hiện tại
2. Đọc UPGRADE_PLAN.md → Xem các mục CHƯA LÀM + ưu tiên
3. Đọc AI_MAP.md       → Kiến trúc, DB schema, quy tắc kỹ thuật
4. Bắt đầu code
```

### 2. Quy tắc đánh số Version (Upgrade Versioning)

| Cú pháp | Ý nghĩa |
|---------|----------|
| `Phase X` | Giai đoạn lớn (Phase 1–7) |
| `PX.Y` | Mục cụ thể trong phase (P5.1, P5.2...) |
| `vX.Y.Z` | Release version (semantic versioning) |

**Quy tắc:**
- Mỗi lần upgrade xong → cập nhật `PLAN.md` đánh dấu `[x]`
- Nếu upgrade ảnh hưởng schema → tạo file `scripts/migrate_vX.Y.Z.sql`
- Nếu upgrade tạo file mới → cập nhật `AI_MAP.md` phần Routes/Components

### 3. Quy tắc đánh dấu trạng thái

| Ký hiệu | Ý nghĩa |
|---------|----------|
| `[x]` | Đã hoàn thành |
| `[ ]` | Chưa làm |
| `[-]` | Đã huỷ / bỏ qua |
| `[/]` | Đang thực hiện |

### 4. Quy tắc cập nhật file sau khi code

| File | Khi nào cập nhật |
|------|------------------|
| `PLAN.md` | Đánh dấu `[x]` mục PX.Y đã hoàn thành |
| `UPGRADE_PLAN.md` | Thêm mục mới hoặc đánh dấu hoàn thành |
| `AI_MAP.md` | Cập nhật nếu: thêm table, thêm route, đổi dependencies, đổi auth flow |
| `database.sql` | **Cập nhật** khi thêm bảng/cột qua migration — là schema tổng hợp duy nhất |
| `scripts/migrate_v*.sql` | Tạo file mới nếu cần ALTER TABLE |
| `.env.example` | Thêm biến môi trường mới nếu có |

### 5. Quy tắc đặt tên file

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Server Action | `actions.ts` trong folder route | `app/admin/actions.ts` |
| API Route | `route.ts` trong `app/api/...` | `app/api/cron/reminders/route.ts` |
| Component | PascalCase, đặt trong `components/` hoặc route folder | `TabDashboard.tsx` |
| Migration | `migrate_vX.Y.Z.sql` | `migrate_v1.2.0.sql` |
| Edge Function | `supabase/functions/<name>/index.ts` | `cron-reminders/index.ts` |

### 6. Quy tắc trước khi Push lên GitHub

```
□ Kiểm tra eslint: npm run lint
□ Kiểm tra types: npm run build (hoặc npx tsc --noEmit)
□ Không commit secrets (.env.local, .env)
□ Kiểm tra không có file thừa/temp
□ Cập nhật PLAN.md + AI_MAP.md nếu có thay đổi
□ Commit message rõ ràng: "feat: ...", "fix: ...", "refactor: ..."
```

### 7. Quy tắc Deploy

| Platform | Checklist |
|----------|-----------|
| **Vercel** | Env vars đã set đầy đủ? Build success? |
| **Supabase** | Migration đã chạy? Extensions enabled (pg_cron, pg_net)? RLS policies? |
| **GitHub** | Branch protection? Secrets không bị leak? |

### 8. Quy tắc cho AI Model tiếp nhận project

> Khi một AI model mới bắt đầu làm việc với project này:

```
1. Đọc PLAN.md → Hiểu 7 phases + workflows
2. Đọc UPGRADE_PLAN.md → Biết mục nào chưa làm
3. Đọc AI_MAP.md → Kiến trúc DB, routes, auth, booking engine
4. Đọc PHASE5_REVIEW.md (nếu có) → Biết vấn đề cần fix
5. Hỏi lại người dùng nếu có thắc mắc
6. Sau khi code xong → Cập nhật PLAN.md + AI_MAP.md
```

---

### 🟢 V3.15 — OpenCode Custom Tools & Agents ✅
- [x] 11 custom tools: ci_check, build_check, deploy_vercel, migrate_db, check_env, schema_sync, env_diff, db_health_check, vercel_status, seo_analyzer, skill_sync
- [x] 2 subagents: ci-fix, db-admin với cross-agent collaboration
- [x] Register trong `.opencode/opencode.json`

### 🟢 V3.16 — Responsive Optimization (320px → 4K) ✅
- [x] Fix 9 responsive issues (cards, tables, nav, hero, touch targets)
- [x] Fix 6 iOS Safari critical bugs (overflow, dvh, backdrop-blur, safelist)
- [x] 4K ultra-wide: breakpoint, grid columns, typography, spacing

### 🟢 V3.17 — Schema Audit & Bug Fixes ✅
- [x] Fix 6 critical bugs (trigger columns, notification insert, RPC params, column mismatches)
- [x] Fix 5 DB bugs (customer_packages updated_at, trigger case, overload sync)
- [x] Đồng bộ database.sql với DB thật (customers, rate_limits, ai_cache)
- [x] Next.js 16 migration: `middleware.ts` → `proxy.ts`
- [x] Admin menu: flat list → 5 groups + section headers

### 🟢 SEO Schema (JSON-LD Structured Data) ✅
- [x] 11/13 schema types: LocalBusiness, PostalAddress, OpeningHours, FAQPage, Product, Service, WebSite, BreadcrumbList, Article, ItemList, GeoCoordinates, AggregateRating
- [x] ImageGallery: huỷ (chưa có gallery)
- [x] Tất cả server component, không `'use client'`

### 🟢 Session Audit Fix ✅
- [x] Phase 1: Verify middleware registration (proxy.ts) — compiled, build output shows `ƒ Proxy (Middleware)` ✅
- [x] Phase 2: Fix login cookie flush — dùng `redirect()` thay `window.location.href`
- [x] Phase 3: Remove session clear on decrypt fail
- [x] Phase 4: maxAge đã có sẵn trong cookie
- [x] Phase 5: Sliding session — re-encrypt JWT mỗi request
- [ ] ⚠️ Phase 6: Runtime test (dev server + browser) — build TypeScript ✅, cần smoke test manual

### 🟢 Orphan Cleanup ✅
- [x] Xoá 11 orphan API routes không frontend reference
- [x] staff_skills UI CRUD: `StaffSkillsModal.tsx` + TabStaff integration (đã có sẵn)
- [x] submitReview UI: `ReviewCustomerModal.tsx` + CheckoutModal step 6 (đã có sẵn)
- [x] 🔴 Bug H.1: MasterSchedule filter CANCELLED + thêm `.order('start_time')` ✅
- [x] 🔴 Bug H.2: Orphaned locks khi COMPLETED — unlock trước lock đã có sẵn ✅
- [x] 🟢 Dead code: Xoá `lib/auto-seo.ts` (toàn bộ file unreferenced) ✅

### 🟢 UPGRADE_PLAN — Code Quality Audit (42 tasks, all ✅)

> **Audit hoàn tất:** 2026-06-27 — 6 mảng, ~60 issues (10 critical, 7 high, 20+ medium)

| Phase | Mục tiêu | Tasks | Trạng thái |
|-------|----------|-------|------------|
| 1 | Fix build & dev (critical path) | 5 | ✅ |
| 2 | Schema & structured data (SEO) | 5 | ✅ |
| 3 | Auth & security | 4 | ✅ |
| 4 | Database hardening | 4 | ✅ |
| 5 | Missing pages & UX | 4 | ✅ |
| 6 | Chore | 7 | ✅ |
| 7 | Lint warnings cleanup | 12 | ✅ |
| +8 | `as any` audit & reduce (47→29) | 1 | ✅ |

#### Phase 1 — Fix Build & Dev ✅
- [x] Gộp Tailwind config (`tailwind.config.ts`, `tailwind.config.cjs`)
- [x] Fix `next dev` trên Windows — thêm `--webpack` (`package.json`)
- [x] Tạo root `not-found.tsx` (`app/not-found.tsx`)
- [x] Xoá `userScalable: false` (`app/layout.tsx`)
- [x] Verify build

#### Phase 2 — Schema & Structured Data ✅
- [x] Import ArticleSchema vào blog detail (`app/blog/[slug]/page.tsx`)
- [x] Import BreadcrumbSchema vào layout (`app/layout.tsx`)
- [x] Thêm `@id` cho tất cả schema entities (6 files `components/*Schema.tsx` + `layout.tsx`)
- [x] ArticleSchema: thêm `dateModified`, `publisher`, `mainEntityOfPage` (`components/ArticleSchema.tsx`)
- [x] Fix sitemap: bỏ hash fragment (`app/sitemap.ts`)

#### Phase 3 — Auth & Security ✅
- [x] Thêm auth guard cho 15+ server actions (`app/staff/actions.ts`, `app/admin/schedule/actions.ts`, `app/booking/actions/*`)
- [x] Thêm auth guard cho API routes (`app/api/*/route.ts`)
- [x] Xoá plaintext password fallback (`app/login/actions.ts`, `app/admin/actions.ts`)
- [x] `sameSite: 'lax'` → `'strict'` (`utils/auth.ts`, `proxy.ts`)

#### Phase 4 — Database Hardening ✅
- [x] Thêm 20+ FK indexes (`database.sql`)
- [x] Thêm `updated_at` auto trigger (`database.sql`)
- [x] `cash_register.amount` → `DECIMAL(10,2)` (`database.sql`)
- [x] Thêm CHECK constraints (`database.sql`)

#### Phase 5 — Missing Pages & UX ✅
- [x] Add `loading.tsx` — 4 routes (`app/blog/[slug]/loading.tsx`, etc.)
- [x] Add `error.tsx` — 2 routes (`app/blog/[slug]/error.tsx`, etc.)
- [x] Thêm `toast.error` cho catch blocks (`components/GlobalSearch.tsx`, etc.)
- [x] ARIA + focus trap cho staff modals (`components/staff/*`)

#### Phase 6 — Chore ✅
- [x] Xoá `.eslintrc.json` (root)
- [x] SkipLink tiếng Việt + `#main-content` (`components/SkipLink.tsx`)
- [x] IosErrorHandler gating (`components/IosErrorHandler.tsx`)
- [x] BottomNavigation `aria-current` (`components/BottomNavigation.tsx`)
- [x] Double-check: `as any` giảm dần (toàn bộ codebase, 47→29)
- [x] Xoá `uuid` khỏi dependencies (`package.json`)
- [x] Thêm CI step `npm audit --audit-level=moderate` (CI config)

#### Phase 7 — Lint Warnings Cleanup ✅
- [x] Fix `react-hooks/rules-of-hooks` — 3 errors (`IosErrorHandler.tsx`)
- [x] Fix `react-hooks/set-state-in-effect` — ~30 warnings (7 files)
- [x] Fix `react-hooks/exhaustive-deps` — ~10 warnings (4 files)
- [x] Fix `@next/next/no-img-element` (best practice)
- [x] Fix `import/no-anonymous-default-export` (rule không active)
- [x] Xoá `no-unused-vars` dư thừa — 272→0 warnings (50+ files)
- [x] Fix `react-hooks/immutability` (2 files)
- [x] Verify — `npm run lint` + `npx tsc --noEmit` (0 err, 0 TS err)
- [x] Tạo PWA icons — icon-192.png / icon-512.png (`public/icons/`)
- [x] Fix Multiple GoTrueClient instances (`lib/realtime.ts`)
- [x] Set JWT_SECRET (`.env.local`)
- [x] Thêm `loading.tsx` cho các route còn lại (4 routes)

#### Phase 8 — `as any` Audit & Reduce ✅
- [x] Giảm `as any` từ 47 xuống 29 occurrences (toàn bộ codebase)

---

### 9. Bài học rút ra (Lessons Learned — cập nhật sau mỗi session)

| # | Bài học | Nguyên nhân | Fix |
|---|---------|------------|-----|
| 1 | `ALTER PUBLICATION ... ADD TABLE IF NOT EXISTS` KHÔNG chạy qua PgBouncer | `IF NOT EXISTS` không được PgBouncer hỗ trợ cho publication | Dùng DO block với `pg_publication_tables` check (tránh `pg_publication_rel` — cũng hang qua PgBouncer) |
| 2 | `database.sql` bị thiếu 7 bảng từ migrations | Rule "NEVER edit database.sql" cũ quá cứng nhắc | Đổi rule thành "database.sql là schema tổng hợp — cập nhật khi thêm bảng" |
| 3 | Quên kiểm tra RLS + Realtime sau migrations | Không có quy trình verify hậu migration | Thêm rule #15 vào SKILL.md — audit RLS + Realtime + database.sql sau mỗi migration |
| 4 | Số table trong SKILL.md sai (ghi 18, thực tế 34) | Không cập nhật SKILL.md khi thêm bảng | Cập nhật section 4 + 9 mỗi khi thay đổi schema |
| 5 | Multi-statement SQL không đáng tin qua PgBouncer | Pooler transaction mode xử lý multi-statement không ổn định | Dùng DO block thay vì `;`-separated statements; script `run-migrations.mjs` chạy từng câu riêng |
| 6 | **SecurityError on iOS Safari (Private Browsing / SW)** | Gọi `.register()` hoặc `.subscribe()` tự động ngoài tương tác người dùng | Bao bọc `.register()` và `indexedDB.open` trong `try-catch`, chỉ gọi `.subscribe()` qua sự kiện click. |
| 7 | **`cookies().set()` + client redirect không flush cookie** | Server action set cookie rồi return JSON; client `window.location.href` không đợi cookie flush → login loop | Dùng `redirect()` từ `next/navigation` sau `cookies().set()` — NEXT_REDIRECT throw flush cookie trong cùng response (xem `app/login/actions.ts`) |
| 8 | **Column existence not verified before upsert** | `saveStaffSkill()` gửi `updated_at` trong upsert nhưng column không tồn tại trong `staff_skills` — Supabase silently bỏ qua | Kiểm tra `database.sql` table definition trước khi gọi `.upsert()`. Nếu column không có → hoặc thêm migration hoặc xoá khỏi query. |
| 9 | **Docs/plan nói "no UI" nhưng UI đã có sẵn** | UPGRADE_PLAN.md liệt kê `staff_skills` là orphan feature nhưng `StaffSkillsModal.tsx` (292 dòng) đã tồn tại với full CRUD | Trước khi code, grep tên table/feature trong FE. Tìm file pattern modal/dialog. Kiểm tra imports trong parent components. Chỉ treat là orphan khi thực sự không có reference. |
| 10 | **Orphan route detection method** | 11 orphan API routes tồn tại không frontend reference — phát hiện thủ công qua grep từng route trong FE imports | Cross-reference: `ls app/api/` → từng route grep trong FE (`grep -r "api/X" app/ components/`). Route chỉ có trong `app/api/` mà không FE import → orphan. |
| 11 | **UPGRADE_PLAN.md cleanup methodology** | Sau cleanup 750→94 lines, cần đảm bảo không mất pending item | Khi strip done items, git diff để verify. UPGRADE_PLAN.md chỉ chứa UNDONE items (<100 lines). Done items chuyển vào PLAN.md section tương ứng + docs/Log.md + docs/Audit.md. |

### 10. Quy tắc bổ sung cho migrations

```
□ Kiểm tra table có cần RLS không? → ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
□ Table có cần realtime không? → Thêm vào DO block trong supabase_realtime
□ Cập nhật database.sql (thêm CREATE TABLE + RLS + realtime)
□ Xoá file migrate cũ sau khi đã gộp vào database.sql
□ Dùng DO block thay IF NOT EXISTS cho publication
□ Kiểm tra syntax qua pooler (chạy thử 1 lần) trước khi apply
```

---

### 11. Phase 9 — Mobile UI/UX Audit & Fix

**Tổng quan:** Audit 24 files (homepage → admin → staff → components) — 17 HIGH items đã implement, ~40 MEDIUM items còn lại.

**HIGH items đã fix:**
| # | File | Fix |
|---|------|-----|
| 1 | `layout.tsx` | `env(safe-area-inset-*)` trên body |
| 2 | `page.tsx` | `min-h-[44px]` trên badge, pills, footer links |
| 3 | `HeaderNav.tsx` | Mobile menu items `min-h-[44px]` + `flex items-center` |
| 4 | `HeaderNav.tsx` | `aria-expanded={mobileMenuOpen}` trên hamburger |
| 5 | `BottomNavigation.tsx` | Label `text-[10px]` → `text-[11px]` |
| 6 | `login/page.tsx` | Auto-Fill btn `opacity-0` → `md:opacity-0` |
| 7 | `booking/page.tsx` | Sticky invoice `bottom: calc(4rem + env(safe-area-inset-bottom))` |
| 8 | `staff/page.tsx` | Bottom nav `env(safe-area-inset-bottom)` |
| 9 | `staff/page.tsx` | Label `text-[10px]` → `text-[11px]` |
| 10 | `BookingCalendar.tsx` | Đã có `min-h-[44px]` từ trước |
| 11 | `AppointmentLookup.tsx` | Progress timeline `text-[10px]` → `text-[11px]` |
| 12 | `MasterSchedule.tsx` | Thêm `TouchSensor` + `PointerSensor` với activationConstraint |
| 13 | `TabStaff.tsx` | Action buttons `min-h-[44px]` + `px-3 py-2` |
| 14 | `TabServices.tsx` | Toggle/badge `min-h-[44px]` + `px-3 py-1.5` |
| 15 | `TabTasks.tsx` | Stats grid `grid-cols-2 sm:grid-cols-5` |
| 16 | `TabReports.tsx` | Export dropdown thêm `group-focus-within:block` |
| 17 | `admin/page.tsx` | Header mobile `env(safe-area-inset-top)` |

**Menu cập nhật thêm:**
- BottomNavigation admin: 4 items + hamburger mở drawer (thêm prop `onMenuClick`)
- Admin drawer: Cấu Hình collapsible accordion (mặc định đóng)
- Homepage "Dịch Vụ" link → `/#services`

**MEDIUM items (đã implement):**
- `text-[10px]` → `text-[11px]` trên buttons/badges interactive ✅
- `py-1.5`/`py-2` buttons → `py-2.5` + `min-h-[44px]` ✅
- Mobile card fallback: TabStaff, TabServices, TabAttendance, CustomerCRM ✅
- Skeleton loading trong booking flow ✅
- Search inputs `py-2` → `min-h-[44px]` ✅
- `prefers-reduced-motion` support trong globals.css ✅
- `xs:` breakpoint (480px) trong tailwind.config.ts ✅

---

*Tài liệu này sẽ liên tục được cập nhật song hành cùng sự tiến bộ của dự án!**
