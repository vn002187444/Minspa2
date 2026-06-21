# 🚀 KẾ HOẠCH NÂNG CẤP V3 (EXECUTION PLAN)

> **Mục tiêu:** Sửa sai toàn bộ các mục thất bại của V2 và nâng cấp hệ thống lên chuẩn doanh nghiệp.
> **Trạng thái:** Sẵn sàng khởi động V3.

---

## 🧠 BẢN ĐỒ TƯ DUY HỆ THỐNG (V3 FOCUS)

- **Client Portal (Hướng khách hàng)**
    - Loyalty (V3): Customer portal, Package tracking, Loyalty points.
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

| Session | Tên | Mục tiêu chi tiết | Giải pháp kỹ thuật |
|---------|-----|-------------------|--------------------|
| **S17** | **Interactive Mascot** | Mascot di chuyển, nhắc nhở thông minh. | Framer Motion → Coordinate System. |
| **S18** | **Booking Intelligence** | Gợi ý lịch trống, auto-assign nhân viên. | `findNextAvailableDate` logic. |
| **S19** | **Real-time Theme** | Biến đổi giao diện theo thời tiết & lễ hội. | Open-Meteo API → CSS Variable Injector. |
| **S20** | **Financials & Payment** | Thanh toán tự động, báo cáo doanh thu. | MoMo/ZaloPay Webhooks → `exceljs`/`jspdf`. |
| **S21** | **Hardening** | CDN, Rate Limit, Security Audit. | Cloudflare → Redis → Pen-test. |
| **S22** | **Customer Portal** | Cổng thông tin khách hàng, loyalty, referral. | Loyalty system → Referral codes. |
| **S23** | **Platform Scaling** | Đa ngôn ngữ, multi-branch, search. | `next-intl` → ElasticSearch/FTS. |
| **S24** | **UX Polish & PWA** | PWA offline, page transition, polish. | Service worker → transition refinement. |
