# KẾ HOẠCH NÂNG CẤP HỆ THỐNG — MIN NAIL & HAIR

> Ngày tạo: 17/06/2026 | Cập nhật: 18/06/2026
> Mục tiêu: Tối ưu Vercel & Supabase performance, giảm cost, tăng tốc ứng dụng
>
> **Các giai đoạn đã hoàn thành:** Phase 1–6 → xem `PLAN.md`
> **Quy tắc vận hành:** Xem `PLAN.md` phần "QUY TẮC VẬN HÀNH & GIAO TIẾP"

---

## 📜 HƯỚNG DẪN SỬ DỤNG FILE NÀY

### Đọc khi nào?
- Bắt đầu 1 session mới → Đọc từ đầu đến `Tiến độ Phase 7`
- Muốn biết mục nào cần làm tiếp → Xem bảng `Tiến độ Phase 7` ở cuối file

### Cập nhật khi nào?
- Hoàn thành 1 mục PX.Y → Đánh dấu `[x]` trong `Tiến độ Phase 7`
- Thêm mục mới → Thêm vào `Tiến độ Phase 7` + mô tả chi tiết bên trên
- Bỏ qua mục → Đánh dấu `[-]` + ghi lý do

### Format khi thêm mục mới
```markdown
### [Mức ưu tiên] PX.Y — Tên mục

**Vấn đề:** Mô tả ngắn gọn vấn đề

| File | Cần sửa |
|------|---------|
| `file/path.ts` | Mô tả cần sửa |

**Giải pháp:** Hướng dẫn cụ thể
```

---

## 📊 Phase 7 — P1/P2: Tối ưu Vercel & Supabase (CÒN DỰ KIẾN)

> Các mục đã hoàn thành trong Phase 1–6 đã được chuyển sang `PLAN.md`.
> Dưới đây là **các mục CHƯA LÀM** từ Vấn đề 7 (Tối ưu Vercel & Supabase).

### Ưu tiên thực hiện

| Mức | Mục | Lý do |
|-----|-----|-------|
| 🔴 **P0** | 7.9 (Limit select) | Tránh crash DB do data lớn |
| 🟡 **P1** | 7.3 (Batch API) | Giảm request booking flow |
| 🟡 **P1** | 7.5 (Lazy-load recharts) | Giảm initial bundle 200KB+ |
| 🟡 **P1** | 7.6 (Unused code check) | Tối ưu deployment size |
| 🟢 **P2** | 7.10 (PostgreSQL VIEW) | Giảm CPU cho aggregation queries |
| 🟢 **P2** | 7.12 (RLS policy) | Refactor lớn, giảm code complexity |
| 🟢 **P2** | 7.13 (EXPLAIN ANALYZE) | Phát hiện sớm degradation |
| 🟢 **P2** | 7.14 (Connection pooling) | Giảm memory trên DB |
| 🟢 **P2** | 7.15 (Server Action → API Route) | Tránh timeout 60s cho booking heavy |
| 🟢 **P2** | 7.17 (Incremental realtime migration) | Zero downtime |

### 🔴 P7.9 — Giới hạn result mặc định (Limit select)

**Vấn đề:** Mọi query `select()` đều không có `.limit()` hoặc `.range()` — khi data lớn sẽ load toàn bộ vào memory → crash.

| File | Cần sửa |
|------|---------|
| `app/admin/actions.ts` | `getStaffs()`, `getCommissionReport()`, `getFilteredAppointments()` |
| `app/admin/schedule/actions.ts` | `getScheduleData()` |
| `app/booking/actions/customer.ts` | `checkCustomerHistory()`, `lookupAppointmentsByPhone()` |
| `app/staff/actions.ts` | `getStaffData()` |

**Giải pháp:** Thêm `.range(0, 199)` hoặc `.limit(200)` cho tất cả query chưa có limit.

---

### 🟡 P7.3 — Batch API — gộp nhiều action vào 1 call

**Vấn đề:** Mỗi lần click trong booking flow gọi 1 server action riêng → 3-4 request/booking.

| File | Cần sửa |
|------|---------|
| `app/booking/actions/booking.ts` | `submitBooking()` — gộp validate + insert + notify |

**Giải pháp:** Gộp các thao tác nhỏ (validate + insert + notify) vào 1 server action duy nhất.

---

### 🟡 P7.5 — Lazy-load heavy libs (recharts)

**Vấn đề:** `recharts` (~200KB) được import static trong `app/admin/components/TabDashboard.tsx` → tăng initial bundle.

| File | Cần sửa |
|------|---------|
| `app/admin/components/TabDashboard.tsx` | Dynamic import recharts |

**Giải pháp:**
```typescript
const RechartsBar = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
```

---

### 🟡 P7.6 — Kiểm tra unused code

**Vấn đề:** Tree-shaking không hoạt động tối ưu nếu import unused modules.

| File | Cần kiểm tra |
|------|-------------|
| `app/admin/page.tsx` | Kiểm tra import sau refactor |
| `lib/` | Kiểm tra utilities không dùng |

**Giải pháp:** `npx next lint` + grep import chain để xác định dead code.

---

### 🟢 P7.10 — PostgreSQL VIEW cho report

**Vấn đề:** Báo cáo hoa hồng (`getCommissionReport()`) chạy aggregation mỗi lần request → CPU cao.

**Giải pháp:**
```sql
CREATE VIEW commission_report_view AS
SELECT
  u.id AS staff_id,
  u.full_name,
  a.id AS appointment_id,
  a.start_time,
  a.commission_amount,
  a.tip_amount,
  ...
FROM appointments a
JOIN users u ON a.staff_id = u.id
WHERE a.status = 'COMPLETED';
```

---

### 🟢 P7.12 — RLS policy cho notifications

**Vấn đề:** Mọi query notifications đều qua server action → tốn round-trip + code.

**Giải pháp:** Enable RLS trên `notifications` table, tạo policy `recipient_id = auth.uid()`.

**Lưu ý:** Cần test kỹ vì Supabase RLS dùng `auth.uid()` — cần map `users.id` → `auth.uid()`.

---

### 🟢 P7.13 — EXPLAIN ANALYZE định kỳ

**Vấn đề:** Không có monitoring slow queries → phát hiện degradation muộn.

**Giải pháp:**
- Tạo script chạy `EXPLAIN ANALYZE` trên các query thường gặp
- Review Supabase Logs → Dashboard → Database → Query Performance

---

### 🟢 P7.14 — Connection pooling (PgBouncer)

**Vấn đề:** Mỗi serverless function tạo TCP connection mới → memory spike trên DB.

**Giải pháp:** Bật **Transaction mode** trong Supabase Dashboard → Settings → Database → Connection pooling.

---

### 🟢 P7.15 — Server Action → API Route cho booking heavy

**Vấn đề:** `completeAppointment()` chạy nhiều thao tác (update + deduct + notify + cascade) → có thể timeout 60s.

| File | Cần sửa |
|------|---------|
| `app/staff/actions.ts` | `completeAppointment()` |

**Giải pháp:** Chuyển sang API route (`/api/booking/complete`) để dùng streaming response + timeout dài hơn.

---

### 🟢 P7.17 — Incremental migration polling → realtime

**Vấn đề:** Một số component vẫn dùng polling 30s thay vì Realtime.

| Component | Hiện tại | Cần chuyển |
|-----------|----------|-----------|
| `NotificationBell` | ✅ Đã realtime | — |
| `StaffPage` (booking list) | Polling | Realtime `appointments` |
| `MasterSchedule` | Manual refresh | Realtime `appointments` + `attendance` |

---

## Tổng kết files cần sửa

| File | P7 | Mức |
|------|----|-----|
| `app/admin/actions.ts` | 7.9, 7.10 | P0, P2 |
| `app/admin/schedule/actions.ts` | 7.9 | P0 |
| `app/admin/components/TabDashboard.tsx` | 7.5 | P1 |
| `app/booking/actions/customer.ts` | 7.9 | P0 |
| `app/booking/actions/booking.ts` | 7.3 | P1 |
| `app/staff/actions.ts` | 7.9, 7.15 | P0, P2 |
| `scripts/migrate_schema.sql` | 7.10 | P2 |
| `components/StaffPage.tsx` | 7.17 | P2 |
| `components/MasterSchedule.tsx` | 7.17 | P2 |

---

## Tiến độ Phase 7

- [x] **P7.3** — Batch API (submitBooking() đã gộp sẵn)
- [x] **P7.5** — Lazy-load recharts (next/dynamic trong TabDashboard.tsx)
- [x] **P7.6** — Unused code cleanup (xóa motion + @dnd-kit/utilities)
- [x] **P7.9** — Limit select cho tất cả query (admin, staff, booking, schedule)
- [x] **P7.10** — PostgreSQL VIEW cho commission report (scripts/migrate_p7_10_view.sql)
- [x] **P7.12** — RLS policy cho notifications (scripts/migrate_p7_12_rls_notifications.sql)
- [x] **P7.13** — EXPLAIN ANALYZE monitoring (scripts/monitor_queries.sql)
- [x] **P7.14** — Connection pooling (Supabase tự xử lý qua PostgREST)
- [x] **P7.15** — Server Action → API Route (tách background tasks sang /api/booking/background-tasks)
- [x] **P7.17** — Realtime migration (Staff page + Dashboard dùng Supabase Realtime)

**Tổng Phase 7: 10/10 items — ✅ HOÀN THÀNH**

---

## 📦 VERSION HISTORY

| Version | Ngày | Mô tả | Files thay đổi |
|---------|------|-------|----------------|
| `v1.0.0` | 17/06/2026 | Phase 1–6 hoàn thành | Nhiều files |
| `v1.1.0` | 18/06/2026 | Phase 7 partial: P7.3, P7.5, P7.6, P7.9, P7.10, P7.12, P7.13, P7.14 | admin/actions.ts, staff/actions.ts, booking/actions/customer.ts, schedule/actions.ts, TabDashboard.tsx, package.json, migrate_p7_*.sql, monitor_queries.sql |

> **Lưu ý:** Khi upgrade schema, tạo file `scripts/migrate_vX.Y.Z.sql` mới, KHÔNG sửa `database.sql`.

---

*Cập nhật lần cuối: 18/06/2026*
