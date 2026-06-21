# 📋 LỘ TRÌNH PHÁT TRIỂN & QUẢN LÝ TÍNH NĂNG - MIN NAIL & HAIR

Tài liệu này là "Single Source of Truth" cho toàn bộ tiến độ, kiến trúc và quy trình vận hành của dự án.

---

## 🗺️ LỘ TRÌNH PHÁT TRIỂN (V3 ACTIVE FOCUS)

| Session | Tên | Mục tiêu |
|---------|-----|----------|
| **S17** | **Interactive Mascot** | Mascot di chuyển, nhắc nhở thông minh. |
| **S18** | **Booking Intelligence** | Gợi ý lịch trống, tự động xếp nhân viên. |
| **S19** | **Real-time Theme** | Giao diện tự động theo thời tiết & lễ hội. |
| **S20** | **Financials & Payment** | Thanh toán tự động, báo cáo doanh thu. |
| **S21** | **Hardening** | CDN, Rate Limit, CSP, Security Audit. |
| **S22** | **Customer Portal** | Cổng khách hàng, loyalty points. |
| **S23** | **Platform Scaling** | Đa ngôn ngữ, multi-branch, export. |
| **S24** | **UX Polish & PWA** | Offline fallback, page transitions, polish. |

---

## 🧠 BẢN ĐỒ TƯ DUY HỆ THỐNG

- **Client Portal (Hướng khách hàng)**
    - Landing: Hero, Services, Testimonials, Stats.
    - Booking: Atomic transaction (appt + services + lock).
    - Blog: AI-generated SEO articles.
    - PWA/UX: Offline sync, Installable.
- **Staff Operations (Hướng nhân viên)**
    - Staff Portal: Dashboard, Today's schedule.
    - Attendance: Check-in/out via GPS/IP.
    - Commission: Real-time calculation.
- **Admin Dashboard (Hướng quản trị)**
    - Control: Revenue reporting, Appointment overview.
    - Resources: Service/Package management.
    - Content: Blog AI editor, Banner manager.
    - System: Backup, Health checks, Cron triggers.
- **Infrastructure (Nền tảng)**
    - Supabase: Postgres, RLS, Realtime, pg_cron.
    - Auth: JWT-based custom auth.
    - AI: Gemini API, caching, structured output.
    - DevOps: Vercel, GitHub Actions, Sentry.

---

## ✅ KẾT QUẢ V2 HOÀN THÀNH (Sessions 1-26)

Toàn bộ 86/86 items đã hoàn thành. Chi tiết session history được archive tại `docs/archive/UPGRADE_PLAN_V2_COMPLETE.md`.

### 🏗️ Tóm tắt khối chiến lược
- **Khối 1 (Cleanup):** 10/10 items (Codebase sạch, build pass).
- **Khối 2 (Security):** 18/18 items (RLS, Auth hardening, Testing).
- **Khối 3 (AI/Perf):** 18/18 items (AI Cache, Caching, Realtime).
- **Khối 4 (UX):** 32/32 items (Accessibility, PWA, SEO).

---

## 🔄 WORKFLOWS CHI TIẾT

### 1. Luồng mua và trừ buổi Gói Liệu Trình
* **Mua:** Admin/Staff tạo `customer_packages` (id, customer_id, package_id, total_sessions, remaining_sessions).
* **Sử dụng:**
    1. Khi khách đặt lịch: Hệ thống kiểm tra gói khả dụng (`WHERE customer_id = ? AND remaining_sessions > 0`).
    2. Xác nhận lịch (`COMPLETED`):
       - Gọi Server Action `usePackageSession`.
       - Update `customer_packages SET remaining_sessions = remaining_sessions - 1`.
       - Insert `package_usage_logs` (lịch hẹn, thợ, thời gian).

### 2. Booking Flow (Atomic Transaction)
1. **Validation:** Check lock (`time_slot_locks`).
2. **Transaction (Supabase RPC/Action):**
   - Insert `appointments`.
   - Insert `appointment_services`.
   - Insert `time_slot_locks` (dựa trên service duration).
3. **Notify:** `lib/realtime.ts` trigger cập nhật UI cho Admin.

### 3. AI Content Flow
1. **Request:** Admin gửi keyword tới `/api/generate-seo-article`.
2. **Action:**
   - Server gọi Gemini (Search Grounding Enabled).
   - Gemini trả về JSON (`{title, content, keywords}`).
3. **Save:** Admin chỉnh sửa -> Lưu vào `seo_articles`.

---

## 📜 QUY TẮC VẬN HÀNH & KINH NGHIỆM

### 🔄 Cycle Protocol (SOPs)
1. **Audit:** Trước khi code, audit BE-FE mapping.
2. **Read:** Parallel read context (UPGRADE_PLAN + AI_MAP).
3. **Code:** Edit file cũ > Tạo file mới.
4. **Build:** `npm run build` sau mỗi batch.
5. **Update:** Merge kết quả vào PLAN.md.

### 📋 Lessons Learned (V2 → V3)
| Vấn đề | Giải pháp |
|--------|----------|
| Orphan Features | Audit BE-FE đầu session |
| Mojibake | Kiểm tra UTF-8 encoding |
| Forms thiếu label | Checklist: htmlFor + id |
| Any types | Define interface trước code |
| Migration files | Move applied → `scripts/archive/` |
