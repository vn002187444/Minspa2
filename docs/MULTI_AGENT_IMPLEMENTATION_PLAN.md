# KẾ HOẠCH NÂNG CẤP & ĐỒNG BỘ TOÀN DIỆN HỆ THỐNG MIN NAIL & HAIR

> **Dự án:** Min Nail & Hair Salon (`Minspa2`)  
> **Kiến trúc:** Next.js 16 + React 19 + Supabase PostgreSQL + Custom JWT + Gemini 3.1 Flash Lite  
> **Đội hình thực thi:** Antigravity 2.0 (Lead), OpenCode CLI (Frontend), CommandCode CLI (QC/DevOps)  
> **Căn cứ:** Báo cáo đối chiếu lỗi, phiên phỏng vấn nghiệp vụ Grill-Me & kết quả rà soát Ground Truth.

---

## 1. Mục Tiêu Cốt Lõi & Quyết Định Nghiệp Vụ

1. **Bảo mật & Quản trị**:
   - **Khóa Gemini API**: Thu hồi (Revoke) khóa cũ đã bị lưu trong chat lịch sử trên Google AI Studio; cập nhật khóa mới vào biến môi trường Vercel.
   - **Triệt tiêu Backdoor**: Xóa sạch logic fallback password `admin/Admin/Min123@` và PIN mặc định; bắt buộc mã hóa bcrypt 100% trong `app/login/actions.ts` và `lib/password.ts`.
2. **Luồng Đặt Lịch AI-First (AI-First Personalized Booking)**:
   - **Bước 1 (Phone-First)**: Khách nhập Số điện thoại trước tiên.
   - **Khách quen (Đã có trong DB)**: Chào mừng đích danh (*"Chào mừng chị Lan quay lại!"*), hiển thị thẻ gợi ý dịch vụ/combo từ **Gemini 3.1 Flash Lite** dựa trên lịch sử đặt chỗ.
   - **Khách mới**: Hiển thị badge *"Khách hàng mới"*, mở thêm trường nhập Họ và tên.
   - **Bước 2-5**: Chọn Dịch vụ $\to$ Chọn Ngày $\to$ Chọn Giờ (bước nhảy 15 phút, tự động loại bỏ KTV vắng/chưa điểm danh) $\to$ Xác nhận.
3. **Module Bảng Lương Độc Lập (Payroll Module)**:
   - Xây dựng riêng cho Admin dashboard với công thức:
     $$\text{Lương Thực Nhận} = \text{Lương Cứng} + \text{Hoa Hồng (20\%)} + \text{Tip} + \text{Thưởng} - \text{Phạt/Tạm Ứng}$$
   - Tính ngày công thực tế từ dữ liệu điểm danh `attendance`, hỗ trợ lọc theo tháng/năm, xuất báo cáo Excel/PDF.
4. **Hợp Nhất Tài Liệu & Single Source of Truth**:
   - Lưu trữ `UPGRADE_PLAN.md` cũ vào `docs/archive/`.
   - Đồng bộ toàn bộ tiến độ 86 hạng mục vào `PLAN.md` và `.agents/skills/minspa/SKILL.md`.
   - Chuẩn hóa tên thương hiệu là **Min Nail & Hair**, định danh AI là **Gemini 3.1 Flash Lite**.

---

## 2. Ma Trận Phân Bổ Biệt Đội Multi-Agent & Skills Binding

| Agent | Vai Trò Chuyên Môn | Skills Bắt Buộc | Trọng Tâm Nhiệm Vụ |
| :--- | :--- | :--- | :--- |
| **Antigravity 2.0** *(Lead Architect)* | Tổng chỉ huy, Kiến trúc sư trưởng & Phê duyệt | `multi-agent-orchestration`<br>`planning-and-task-breakdown`<br>`api-and-interface-design`<br>`doubt-driven-development` | - Thiết kế Type Contracts, API schemas & Database migration.<br>- Quản lý tài liệu Single Source of Truth (`PLAN.md`, `SKILL.md`).<br>- Giám sát, code review và nghiệm thu toàn bộ PR/commit. |
| **OpenCode CLI** (`opencode-frontend`) | Frontend & UI/UX Đỉnh cao (Awwwards / Dribbble) | `ui-ux-pro-max`<br>`frontend-ui-engineering`<br>`generative_ui` | - Tái thiết kế UX/UI trang Booking: Phone-First, Personalization Banner, Gemini AI Suggestion Card, Time-slot 15m selector.<br>- Xây dựng giao diện Tab Bảng Lương (`TabPayroll.tsx`) chuẩn Executive Minimalist.<br>- Đảm bảo WCAG AA/AAA, mobile safe-area, touch targets $\ge 44$px, 60 FPS animation. |
| **CommandCode CLI** (`commandcode-ops`) | QC/QA, Backend, Database & DevOps Gatekeeper | `test-driven-development`<br>`security-and-hardening`<br>`debugging-and-error-recovery`<br>`local-jev-toolkit` | - Triệt tiêu backdoor auth & enforce bcrypt trong server actions.<br>- Xây dựng Server Actions cho Phone lookup, AI Recommend, Attendance filter, Payroll calculation & Excel export.<br>- Chạy migration database, test suite (`npm test`), audit zero-mock, verify build. |

---

## 3. Bản Kế Hoạch Chi Tiết 5 Giai Đoạn (Work Breakdown Structure)

### 🔹 Giai đoạn 1: Bảo Mật Cấp Thiết & Đồng Bộ Tài Liệu (Foundation & Cleanup)
- **T1.1 (Action Người dùng / Lead)**: Thu hồi khóa Gemini API bị lộ trên Google AI Studio; cấp khóa mới vào biến môi trường Vercel.
- **T1.2 (CommandCode)**: Xóa hoàn toàn logic backdoor (`app/login/actions.ts` dòng 36-41) và fallback plaintext (`lib/password.ts`), chỉ chấp nhận hash bcrypt `$2b$10$...`.
- **T1.3 (Antigravity Lead)**: Lưu trữ `UPGRADE_PLAN.md` vào `docs/archive/UPGRADE_PLAN_LEGACY.md`; cập nhật `PLAN.md` và `.agents/skills/minspa/SKILL.md` (khớp 100% 31 bảng DB, chuẩn hóa Gemini 3.1 Flash Lite, tên thương hiệu Min Nail & Hair).

### 🔹 Giai đoạn 2: Thiết Kế Schema Cơ Sở Dữ Liệu & Type Contracts
- **T2.1 (Antigravity Lead)**: Thiết kế cấu trúc bảng `payroll_records` (lưu snapshot tính lương hàng tháng của nhân viên) và RLS policies tương thích PgBouncer:
  - Trường: `id`, `staff_id`, `month`, `year`, `base_salary`, `commission_amount`, `tip_amount`, `bonus_amount`, `deduction_amount`, `net_salary`, `work_days`, `status`, `paid_at`, `notes`.
- **T2.2 (Antigravity Lead)**: Định nghĩa Type Contracts chuẩn hóa:
  - `types/payroll.ts`: Cấu trúc dữ liệu bảng lương, bộ lọc, payload điều chỉnh thưởng/phạt.
  - `types/booking-ai.ts`: Cấu trúc dữ liệu nhận diện khách hàng, lịch sử cũ và schema gợi ý dịch vụ từ Gemini 3.1 Flash Lite.

### 🔹 Giai đoạn 3: Hiện Thực Hóa Backend & Frontend Song Song

#### Nhánh 3A: Backend Logic & AI Engine (CommandCode CLI - Model: Flash)
- **T3.1**: Server Action `lookupCustomerByPhone(phone: string)`: Kiểm tra khách hàng trong bảng `customers`, trả về thông tin định danh và lịch sử 5 đơn hẹn gần nhất.
- **T3.2**: API Route `app/api/ai-recommend/route.ts`: Tích hợp SDK `@google/genai` với model `gemini-3.1-flash-lite`, phân tích lịch sử làm đẹp của khách để sinh gợi ý 2-3 dịch vụ kèm lý do thuyết phục ngắn gọn.
- **T3.3**: Nâng cấp `lib/booking-engine.ts`:
  - Khung giờ hoạt động 9:00 - 20:30 với bước nhảy 15 phút.
  - Tích hợp kiểm tra bảng `attendance` trong ngày: chỉ hiển thị KTV đã điểm danh có mặt.
- **T3.4**: Server Action `calculateMonthlyPayroll(month, year)`:
  - Lấy hoa hồng 20% từ các đơn hàng hoàn thành (`appointments` có status = `COMPLETED`).
  - Lấy tổng tiền tip từ `appointment_services` hoặc đơn hoàn thành.
  - Tổng hợp ngày công thực tế từ `attendance`.
- **T3.5**: Server Action xuất báo cáo Excel (`xlsx`) và PDF bảng lương hàng tháng cho Admin.

#### Nhánh 3B: Frontend & UI/UX Thẩm Mỹ Đỉnh Cao (OpenCode CLI - Model: Pro)
- **T4.1**: Tái cấu trúc giao diện `app/booking/page.tsx`:
  - **Phone-First Step**: Ô nhập số điện thoại nổi bật ở bước đầu tiên với bàn phím số tối ưu trên mobile.
  - **Personalized Header**: Banner kính mờ (Glassmorphism) chào đón khách quen kèm avatar thân thiện hoặc badge "Khách hàng mới" mở thêm ô nhập họ tên.
  - **AI Recommendation Bento Card**: Thẻ gợi ý dịch vụ thông minh từ Gemini 3.1 Flash Lite với viền neon pulse nhẹ, nút 1-chạm thêm dịch vụ vào lịch hẹn.
- **T4.2**: Nâng cấp bộ chọn giờ & KTV (`BookingCalendar.tsx` & Staff Selector):
  - Lưới giờ 15 phút trực quan, báo rõ trạng thái slot trống/kín.
  - Tag trạng thái "Đang làm việc" / "Chưa điểm danh" cho KTV.
- **T4.3**: Xây dựng Tab Bảng Lương (`app/admin/components/TabPayroll.tsx`):
  - Phong cách Executive Admin: Thẻ tóm tắt tổng quỹ lương, hoa hồng toàn tiệm, tip đã nhận.
  - Bảng lương chi tiết từng nhân viên với phân cấp màu sắc rõ ràng (lương cứng, hoa hồng, tip, thưởng, phạt, thực nhận).
  - Modal điều chỉnh thưởng/phạt nhanh có ghi chú lý do.
  - Nút xuất file Excel/PDF tương tác nén vật lý mượt mà.

### 🔹 Giai đoạn 4: Kiểm Thử Đối Kháng & Đảm Bảo Chất Lượng (Zero-Self-Review)
- **T4.1 (CommandCode)**: Viết unit tests kiểm thử độc lập cho công thức tính lương và hàm filter attendance.
- **T4.2 (CommandCode)**: Kiểm tra tĩnh TypeScript `npx tsc --noEmit` đạt 0 lỗi, chạy test suite `npm test` đạt 100% pass.
- **T4.3 (CommandCode)**: Quét toàn bộ codebase kiểm tra Zero-Mock Protocol: loại bỏ toàn bộ dữ liệu mẫu hardcode.
- **T4.4 (Antigravity Lead)**: Kiểm thử E2E luồng đặt lịch mới trên cả Desktop và Mobile viewport.

### 🔹 Giai đoạn 5: Pre-Flight Checklist & Triển Khai
- **T5.1**: Đồng bộ và commit mã nguồn với định dạng Conventional Commits.
- **T5.2**: Áp dụng DDL mới vào Supabase production database và đồng bộ vào `database.sql`.
- **T5.3**: Đẩy code lên nhánh `main`, theo dõi Vercel build & deployment log.

---

## 4. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)

1. [ ] Backdoor mật khẩu và PIN mặc định bị xóa bỏ 100%, không còn bất kỳ bypass nào trong mã nguồn.
2. [ ] Khách hàng nhập SĐT tại `/booking` được phân loại chính xác (Khách quen / Khách mới) và nhận gợi ý từ Gemini 3.1 Flash Lite trong < 1.5 giây.
3. [ ] Khung giờ đặt hẹn hiển thị bước nhảy 15 phút và tự động ẩn/vô hiệu hóa các KTV chưa điểm danh hôm đó.
4. [ ] Tab Bảng Lương trong Admin hiển thị đúng công thức: Lương cứng + Hoa hồng 20% + Tip + Thưởng - Phạt, hỗ trợ xuất Excel không lỗi font tiếng Việt.
5. [ ] `PLAN.md` và `.agents/skills/minspa/SKILL.md` được cập nhật đồng bộ hoàn toàn, `UPGRADE_PLAN.md` đã được lưu trữ an toàn.
6. [ ] `npm test` pass 100%, `npx tsc --noEmit` exit code 0.
