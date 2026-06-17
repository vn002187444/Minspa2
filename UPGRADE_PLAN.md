# KẾ HOẠCH NÂNG CẤP HỆ THỐNG — MIN NAIL & HAIR

> Ngày tạo: 17/06/2026 | Cập nhật: 18/06/2026
> Mục tiêu: Fix bug, cải thiện UI/UX, tối ưu performance cho 7 vấn đề lớn

---

## THỨ TỰ ƯU TIÊN THỰC HIỆN

### Phase 1 — P0: Critical (Lỗi sai + Bảo mật)

| # | Vấn đề | Lý do | Gộp với |
|---|--------|-------|---------|
| **P1.1** | **Vấn đề 4** — Session persistence | Login sai → không dùng được app | VĐ6 (soft delete login) |
| **P1.2** | **Vấn đề 6a** — Chặn soft-delete login | Bảo mật: staff đã xóa vẫn login được | VĐ4 (cùng file login) |
| **P1.3** | **Vấn đề 2** — MasterSchedule attendance | Sai dữ liệu "Đã trực" → admin tin tưởng sai | VĐ6b (filter is_active) |

### Phase 2 — P1: High (Nâng cấp UI/UX)

| # | Vấn đề | Lý do | Gộp với |
|---|--------|-------|---------|
| **P2.1** | **Vấn đề 1** — Staff status trong Admin | Admin cần thấy ai đang hoạt động | VĐ6d (restore UI), VĐ6c (index) |
| **P2.2** | **Vấn đề 6b** — Filter `is_active` trong query | Commission, schedule, notification sai | VĐ2, VĐ5 (cùng file) |
| **P2.3** | **Vấn đề 5** — Booking time slots | Mở rộng giờ, cache lịch sử, recommend | — |
| **P2.4** | **Vấn đề 6c** — Index + NOT NULL DB | Tối ưu query cho is_active | VĐ1, VĐ7 (index chung) |

### Phase 3 — P2: Medium (Layout + Performance)

| # | Vấn đề | Lý do | Gộp với |
|---|--------|-------|---------|
| **P3.1** | **Vấn đề 3** — Bell layout admin | UI xấu, không ảnh hưởng chức năng | — |
| **P3.2** | **Vấn đề 7a** — Edge middleware + Cache | Tối ưu Vercel cost | — |
| **P3.3** | **Vấn đề 7b** — Composite index + Fix N+1 | Tối ưu Supabase | VĐ6c (index) |
| **P3.4** | **Vấn đề 7c** — Realtime notifications | Thay polling bằng WebSocket | — |

### Ghi chép gộp file

Khi code cần xử lý đồng thời các vấn đề chung file:
- `app/login/actions.ts` + `app/api/login/route.ts`: Làm VĐ4 và VĐ6a trong 1 lần sửa
- `app/admin/schedule/actions.ts`: Làm VĐ2, VĐ6b, VĐ7b trong 1 lần sửa
- `app/admin/page.tsx`: Làm VĐ1, VĐ3, VĐ6d trong 1 lần sửa
- Lib, index: Làm VĐ5c, VĐ5e, VĐ6c, VĐ7b cùng lúc

---

## MỤC LỤC

- [Vấn đề 1: Trạng thái nhân viên trong Admin](#vấn-đề-1-trạng-thái-nhân-viên-trong-admin)
- [Vấn đề 2: Lịch ngang MasterSchedule — "Đã trực" sai](#vấn-đề-2-lịch-ngang-masterschedule--đã-trực-sai)
- [Vấn đề 3: Icon thông báo Admin trên PC bị lỗi layout](#vấn-đề-3-icon-thông-báo-admin-trên-pc-bị-lỗi-layout)
- [Vấn đề 4: Session login bị mất khi quay lại](#vấn-đề-4-session-login-bị-mất-khi-quay-lại)
- [Vấn đề 5: Booking time slots — mở rộng khung giờ & UX](#vấn-đề-5-booking-time-slots--mở-rộng-khung-giờ--ux)
- [Vấn đề 6: Soft Delete — tối ưu & đồng bộ](#vấn-đề-6-soft-delete--tối-ưu--đồng-bộ)
- [Vấn đề 7: Tối ưu Vercel & Supabase](#vấn-đề-7-tối-ưu-vercel--supabase--tránh-limit-cpu--request)
- [Tổng kết files cần sửa](#tổng-kết-files-cần-sửa)

---

## Vấn đề 1: Trạng thái nhân viên trong Admin

### Hiện trạng

Bảng nhân viên trong tab STAFF (`app/admin/page.tsx`) chỉ hiển thị:
- Tên nhân viên (`full_name`)
- Username
- Role (STAFF/MANAGER)

**Không có** indicator trạng thái hoạt động/nghỉ. Soft delete (`is_active = false`) tồn tại nhưng không hiển thị trên UI — admin không biết nhân viên nào đang bị vô hiệu hóa, không có nút khôi phục.

### Nguyên nhân

- `getStaffs()` trong `app/admin/actions.ts` không filter `is_active` (cố ý — để admin thấy tất cả)
- Nhưng view không hiển thị trạng thái `is_active` cho từng staff
- Không có action "Kích hoạt lại" (restore) trên UI

### Giải pháp

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 1.1 | Thêm cột "Trạng thái" | `app/admin/page.tsx` | Badge 🟢 Hoạt động (`is_active=true`) / 🔴 Đã vô hiệu hóa (`is_active=false`) |
| 1.2 | Thêm filter dropdown | `app/admin/page.tsx` | "Tất cả / Hoạt động / Đã vô hiệu hóa" |
| 1.3 | Thêm nút toggle | `app/admin/page.tsx` | "Vô hiệu hóa" / "Kích hoạt lại" theo từng staff |
| 1.4 | Thêm hàm restore + toggle | `app/admin/actions.ts` | `toggleStaffActive(staffId, newStatus)` |
| 1.5 | Audit log | `app/admin/actions.ts` | Log `TOGGLE_STAFF_ACTIVE` khi thay đổi |

### Ghi chú

- Mở rộng UI pattern này cho tab SERVICES và PACKAGES nếu cần
- Soft-delete staff vẫn phải chặn login được (xem Vấn đề 4)

---

## Vấn đề 2: Lịch ngang MasterSchedule — "Đã trực" sai

### Hiện trạng

Trong `components/MasterSchedule.tsx`, tất cả nhân viên đều hiển thị badge **"Đã trực"** (màu xanh lá) bất kể họ có điểm danh hay không.

### Nguyên nhân gốc

Trong `getScheduleData()` (`app/admin/schedule/actions.ts:33-40`):
```typescript
const { data: attendance } = await supabase
    .from('attendance')
    .select('staff_id')
    .eq('date', formattedDateStr)
    .eq('status', 'PRESENT');

const presentStaffIds = attendance?.map((a: any) => a.staff_id) || [];
```

Biến `presentStaffIds` được query nhưng **không bao giờ được sử dụng** trong dữ liệu trả về. Kết quả là tất cả staff từ `users` đều được render như nhau.

### Giải pháp

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 2.1 | Thêm `is_present` vào staff list | `app/admin/schedule/actions.ts` | Sau khi query attendance, gắn flag `is_present` cho mỗi staff |
| 2.2 | Chỉ render staff đã điểm danh | `components/MasterSchedule.tsx` | Grid chỉ hiển thị staff có `is_present = true` trong ngày |
| 2.3 | Badge động | `components/MasterSchedule.tsx` | "Đã trực" (xanh) nếu `is_present=true`, "Chưa điểm danh" (xám) nếu không |
| 2.4 | Ô thời gian cho staff chưa điểm danh | `components/MasterSchedule.tsx` | Hiển thị "Chưa trực" thay vì "Rảnh" |
| 2.5 | Toggle hiển thị staff chưa điểm danh | `components/MasterSchedule.tsx` | Checkbox "Hiển thị NV chưa điểm danh" (mặc định ẩn) |

---

## Vấn đề 3: Icon thông báo Admin trên PC bị lỗi layout

### Hiện trạng

NotificationBell được đặt trong desktop sidebar (`w-64`). Dropdown của bell dùng `right-0` nên đổ xuống trong sidebar, bị che khuất hoặc layout sai.

### Giải pháp

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 3.1 | Di chuyển bell ra main content | `app/admin/page.tsx` | Desktop: đặt bell ở góc phải **main content** (cạnh nội dung chính, bên ngoài sidebar) |
| 3.2 | Giữ nguyên mobile | `app/admin/page.tsx` | Mobile header giữ nguyên vị trí hiện tại |
| 3.3 | Dropdown direction | `components/NotificationBell.tsx` | Có thể cần thêm prop `dropdownAlign` để canh trái/phải tùy vị trí |

---

## Vấn đề 4: Session login bị mất khi quay lại

### Hiện trạng

Người dùng phải login lại nhiều lần, đặc biệt khi:
- Quay lại trang sau khi đóng tab
- Chuyển giữa các trang
- Sau 30 ngày sử dụng
- Logout đôi khi không hết session

### 4 nguyên nhân chính

#### Nguyên nhân 4.1: JWT không được refresh khi middleware re-set cookie

**File:** `middleware.ts:10-19`

Middleware đọc cookie cũ và re-set nó với `maxAge: 30d` nhưng **giữ nguyên JWT cũ**. JWT bên trong có `exp` (expiration) được đặt lúc login, không được refresh. Sau 30 ngày, JWT hết hạn → `decrypt()` thất bại → redirect `/login`.

**Fix:** Middleware cần giải mã session, tạo JWT mới với expiry mới, rồi mới set cookie.

#### Nguyên nhân 4.2: Middleware tạo response mới — dễ mất cookie

**File:** `utils/supabase/middleware.ts:6-10`

`updateSession()` gọi `NextResponse.next({ request: { headers: request.headers } })` tạo response hoàn toàn mới, không kế thừa cookie từ upstream.

**Fix:** Bỏ qua `updateSession()` hoặc sửa để không tạo response mới.

#### Nguyên nhân 4.3: Logout race condition

**File:** `app/api/logout/route.ts`

Khi logout:
1. Middleware chạy TRƯỚC → đọc cookie cũ → re-set với `maxAge: 30d`
2. Route handler chạy SAU → gọi `logout()` → set cookie với `expires: new Date(0)`

Nếu thứ tự merge cookie bị đảo ngược, cookie sẽ không bị xóa.

**Fix:** Thêm `maxAge: 0` song song với `expires: new Date(0)`.

#### Nguyên nhân 4.4: JWT_SECRET không đồng bộ

`.env.local` có secret riêng, production (Vercel) dùng fallback. Nếu secret khác nhau giữa các môi trường, cookie tạo ở local không decode được ở production.

### Giải pháp tổng thể

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 4.1 | Re-encrypt JWT trong middleware | `middleware.ts` | Giải mã session cũ → tạo JWT mới với `exp` mới → set cookie |
| 4.2 | Fix response creation | `utils/supabase/middleware.ts` | Không dùng `NextResponse.next({ request })` gây mất cookie |
| 4.3 | Thêm `maxAge: 0` khi logout | `utils/auth.ts` | Song song với `expires: new Date(0)` |
| 4.4 | Kiểm tra JWT_SECRET | Deploy config | Đảm bảo `JWT_SECRET` được set trên Vercel |
| 4.5 | (Optional) Thêm `/api/auth/me` | File mới | Endpoint kiểm tra session còn sống không |

---

## Vấn đề 5: Booking time slots — mở rộng khung giờ, UX & cache lịch sử

### Hiện trạng

| Yếu tố | Giá trị hiện tại |
|--------|-----------------|
| Giờ bắt đầu | 09:00 |
| Giờ kết thúc | 19:30 |
| Hard cutoff | 20:00 |
| Date picker | 7 ngày (hôm nay + 6) |
| Hiển thị slot quá giờ | Có (gray, line-through) |
| Recommend | Có flag `isRecommended` nhưng chưa nổi bật |
| Kiểm tra duration | actions.ts dùng 30p cố định (sai), booking-engine.ts đúng |
| Cache lịch sử KH | Không — `checkCustomerHistory()` gọi DB mỗi lần nhập SDT |

### Giải pháp

#### 5a. Mở rộng khung giờ đến 20:30

| File | Thay đổi |
|------|----------|
| `lib/booking-engine.ts:319` | `h <= 19` → `h <= 20` |
| `lib/booking-engine.ts:329` | `20 * 60` → `21 * 60` |
| `app/booking/actions.ts:206` | `h <= 19` → `h <= 20` |

#### 5b. Ẩn slot quá giờ (>60 phút)

| File | Thay đổi |
|------|----------|
| `components/BookingCalendar.tsx` | Lọc `status !== 'past'` trước khi render |
| `components/BookingCalendar.tsx` | Cập nhật stats (available/total) loại trừ past slots |

#### 5c. Mở rộng date picker & recommend

| File | Thay đổi |
|------|----------|
| `app/booking/page.tsx` | Date picker từ 7 ngày → 14 ngày (hoặc 30) |
| `components/BookingCalendar.tsx` | Thêm badge "⭐ Gợi ý" cho `isRecommended` |
| `components/BookingCalendar.tsx` | Highlight đậm hơn (viền xanh đậm + icon) |
| `components/BookingCalendar.tsx` | Tooltip hiển thị số lượng NV trống |

#### 5d. Fix bug duration check (actions.ts)

| File | Thay đổi |
|------|----------|
| `app/booking/actions.ts` | Dùng `getSlotAvailabilityWithNames()` từ booking-engine thay vì logic tự viết, hoặc align duration check |
| `app/booking/actions.ts` | Thay hardcoded 30p overlap bằng `totalDuration` thực tế |

#### 5e. Cache lịch sử khách hàng (localStorage)

**Vấn đề:** Mỗi lần nhập SDT, `checkCustomerHistory()` gọi **3 queries DB** (customers + appointments JOIN services + customer_packages). Trên booking page, có 2 luồng gọi: (1) khi page load auto-restore, (2) khi blur input → tối thiểu 2 request/phiên.

**Giải pháp — localStorage caching:**

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 5e.1 | Tạo cache key | `app/booking/page.tsx` | Key = `min_salon_customer_{phoneHash}`, dùng SHA-256 digest ngắn (8 ký tự đầu) từ phone |
| 5e.2 | Cache structure | `app/booking/page.tsx` | `{ data: {...}, timestamp: number }` — lưu toàn bộ response của `checkCustomerHistory` |
| 5e.3 | TTL cache | `app/booking/page.tsx` | **24h** cho history (ít thay đổi), **5 phút** cho activePackages (dễ hết) |
| 5e.4 | Check cache trước khi gọi server | `app/booking/page.tsx` | Trong `handlePhoneBlur` và `useEffect` load: kiểm tra localStorage trước, nếu còn hạn thì setState luôn, không gọi server |
| 5e.5 | Invalidate cache sau booking mới | `app/booking/page.tsx` | Sau khi đặt lịch thành công: xóa cache key của SDT đó để lần sau fetch lại |
| 5e.6 | Cache riêng cho package | `app/booking/page.tsx` | `min_salon_packages_{phoneHash}` — TTL 5 phút, tự động refresh độc lập với history |

**Kết quả mong đợi:**
- Lần 1 (no cache): 3 queries DB + 1 server action call (như hiện tại)
- Lần 2+ (có cache): 0 queries, 0 server action → render ngay từ localStorage
- Giảm ~80% request cho `checkCustomerHistory`

**Rủi ro & xử lý:**
- Dữ liệu cũ: TTL hợp lý + invalidate sau booking mới
- localStorage đầy: Dung lượng < 5KB/cache — không đáng lo
- Privacy: Cache chỉ lưu trên thiết bị, không sync — an toàn

---

---

## Vấn đề 6: Soft Delete — tối ưu & đồng bộ

### Hiện trạng

Hệ thống có `is_active` trên 4 bảng: `users`, `services`, `treatment_packages`, `time_slot_locks`. Soft delete được thực hiện bằng `UPDATE is_active = false`. Có 3 hàm soft-delete trong `app/admin/actions.ts`:
- `deleteStaffSafely()` — set `is_active = false` + xóa CCCD
- `deleteServiceSafely()` — set `is_active = false`
- `deleteTreatmentPackageSafely()` — set `is_active = false`

### Các lỗi & bất cập

| Mức độ | Vấn đề | File | Dòng |
|--------|--------|------|------|
| **CRITICAL** | Staff soft-delete **vẫn login được** | `app/login/actions.ts` | 64-100 |
| **CRITICAL** | Staff soft-delete login được qua API | `app/api/login/route.ts` | 30-46 |
| **CAO** | Báo cáo hoa hồng tính cả staff đã xóa mềm | `app/admin/actions.ts` | 743-746 |
| **CAO** | Lịch tổng hiển thị staff đã xóa mềm | `app/admin/schedule/actions.ts` | 43-46 |
| **CAO** | Thông báo booking mới gửi cho admin đã xóa | `app/booking/actions.ts` | 392 |
| **TB** | Không có nút **khôi phục** (restore) trên UI | `app/admin/page.tsx` | — |
| **TB** | Thiếu index trên cột `is_active` | `database.sql` | — |
| **TB** | Không thể toggle nhanh (bật/tắt) từ UI | `app/admin/page.tsx` | — |
| **THẤP** | Thiếu `NOT NULL` trên cột `is_active` | `database.sql` | — |

### Giải pháp

#### 6a. Chặn staff soft-delete đăng nhập

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 6.1 | Kiểm tra `is_active` sau khi verify password | `app/login/actions.ts` | Trả lỗi "Tài khoản đã bị vô hiệu hóa" nếu `is_active = false` |
| 6.2 | Kiểm tra tương tự trong API login | `app/api/login/route.ts` | Chặn login qua endpoint API |

#### 6b. Filter `is_active = true` cho các query bị thiếu

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 6.3 | Thêm `.eq('is_active', true)` | `app/admin/actions.ts` (getCommissionReport) | Chỉ tính staff đang hoạt động |
| 6.4 | Thêm `.eq('is_active', true)` | `app/admin/schedule/actions.ts` (getScheduleData) | Lịch tổng chỉ hiển thị staff hoạt động |
| 6.5 | Thêm `.eq('is_active', true)` | `app/booking/actions.ts` (gửi notif) | Chỉ gửi thông báo cho admin đang hoạt động |

#### 6c. Database tối ưu

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 6.6 | Thêm index | `scripts/migrate_schema.sql` | `idx_users_is_active`, `idx_services_is_active`, `idx_treatment_packages_is_active` |
| 6.7 | Thêm NOT NULL | `scripts/migrate_schema.sql` | `ALTER COLUMN is_active SET NOT NULL` |
| 6.8 | Cập nhật schema gốc | `database.sql` | Thêm `NOT NULL` vào DDL của 4 bảng |

#### 6d. UI Admin — Restore & Toggle

| STT | Thay đổi | File | Mô tả |
|-----|----------|------|-------|
| 6.9 | Nút "Vô hiệu hóa" / "Kích hoạt lại" | `app/admin/page.tsx` | Toggle trạng thái từng staff/service/package |
| 6.10 | Hàm toggle | `app/admin/actions.ts` | `updateStaffActive(staffId, isActive)`, tương tự cho service & package |
| 6.11 | Audit log | `app/admin/actions.ts` | Log `TOGGLE_STAFF_ACTIVE`, `TOGGLE_SERVICE_ACTIVE`, `TOGGLE_PACKAGE_ACTIVE` |

### Ghi chú

- Vấn đề 6.1 (chặn login) và 6.4 (schedule grid) **đã được đề cập** trong Vấn đề 2 và 4 — cần đồng bộ khi code
- Soft delete `time_slot_locks` đã hoạt động tốt và có index riêng — không cần thay đổi

---

---

## Vấn đề 7: Tối ưu Vercel & Supabase — tránh limit CPU / Request

### Hiện trạng

Hệ thống đang sử dụng Vercel serverless (Node.js runtime) cho tất cả API route + server actions, và Supabase PostgreSQL cho database. Chưa có tối ưu nào cho tier free/pro.

### Rủi ro hiện tại

#### Vercel

| Yếu tố | Rủi ro | Mức |
|--------|--------|-----|
| **Server Actions** | Mỗi lần click gọi 1 request → tốn số lượng function invocation | Cao |
| **Middleware** | Chạy trên **Node.js** (không Edge) → latency + cost cao hơn | Cao |
| **Cold start** | API routes cold start ~500ms–1s (Node runtime) | Trung bình |
| **Bundle size** | Import heavy libs (recharts, date-fns, lucide) trong server components → tăng size deployment | Thấp |
| **Polling 30s** | NotificationBell polling `/api/notifications/unread-count` mỗi 30s → 2 request/phút/người | Cao |
| **Recursive booking engine** | `cascadeShiftForward()` gọi đệ quy qua API → request timeout nếu nhiều booking | Trung bình |

#### Supabase

| Yếu tố | Rủi ro | Mức |
|--------|--------|-----|
| **Không RLS** | Mọi query đều qua server action → tốn cả request count + CPU | Cao |
| **N+1 queries** | Trong `getScheduleData()`, vòng lặp staff → query từng booking → 1+N pattern | Cao |
| **Full scan** | Thiếu index trên `date`, `is_active`, `status` → sequential scan | Cao |
| **Không connection pool** | Mỗi serverless function tạo TCP connection mới đến DB | Trung bình |
| **Realtime chưa dùng** | Polling 30s thay vì Supabase Realtime (WebSocket) | Cao |

### Giải pháp

#### 7a. Vercel — Giảm function invocation + cold start

| STT | Thay đổi | File/Mô tả | Tác động |
|-----|----------|------------|----------|
| 7.1 | Chuyển middleware sang **Edge Runtime** | `middleware.ts` thêm `export const runtime = 'edge'` | Giảm cold start ~10x, tăng tốc redirect |
| 7.2 | Cache unread count với **Redis/Upstash** | Polling chỉ gọi DB 1 lần, các lần sau đọc cache | Giảm 90% request đến DB |
| 7.3 | Batch API — gộp nhiều action vào 1 call | Booking steps: gộp 2-3 server action nhỏ thành 1 | Giảm 50% request |
| 7.4 | Dùng **ISR** cho trang tĩnh | `app/notifications/page.tsx` có thể SSG + revalidate | 0 server request cho phần lớn traffic |
| 7.5 | Lazy-load heavy libs recharts | `app/admin/page.tsx` dynamic import → `next/dynamic` | Giảm initial bundle 200KB+ |
| 7.6 | Kiểm tra unused code | `npm run build` kiểm tra tree-shaking | Tối ưu deployment size |

#### 7b. Supabase — Query optimization

| STT | Thay đổi | File/Mô tả | Tác động |
|-----|----------|------------|----------|
| 7.7 | Thêm **composite index** cần thiết | `(date, status)` cho attendance + booking | Eliminate sequential scan |
| 7.8 | Fix N+1 trong `getScheduleData` | Dùng `in()` query thay vì loop từng staff | Giảm từ N+1 xuống 2 queries |
| 7.9 | Giới hạn result mặc định | Tất cả `select()` phải có `.limit()` hoặc `.range()` | Tránh memory spike |
| 7.10 | Dùng PostgreSQL **VIEW** cho report | Tạo `commission_report_view` tổng hợp sẵn | Giảm CPU cho aggregation queries |
| 7.11 | Chuyển polling → **Supabase Realtime** | `NotificationBell` subscribe channel thay vì fetch 30s | Real-time, 0 request, 0 DB hit |
| 7.12 | **RLS policy** cho notifications | Dùng RLS thay vì kiểm tra trong code | Giảm round-trip + code complexity |
| 7.13 | `EXPLAIN ANALYZE` định kỳ | Kiểm tra slow queries trong Supabase Logs | Phát hiện sớm degradation |
| 7.14 | Connection pooling = PgBouncer | Supabase có sẵn Transaction mode | Giảm memory trên DB |

#### 7c. Architecture — tái cấu trúc

| STT | Thay đổi | Mô tả | Tác động |
|-----|----------|-------|----------|
| 7.15 | **Server Action** → **API Route** cho booking heavy | Chuyển booking confirm sang API route để dùng streaming/timeout dài | Tránh timeout 60s |
| 7.16 | **Edge Functions** cho cron job | Cron reminder chạy edge → 0 cold start | Rẻ hơn serverless |
| 7.17 | **Incremental migration** từ polling → realtime | Từng component migrate dần, không break UI | Zero downtime |

### Ưu tiên thực hiện

| Mức | Mục | Lý do |
|-----|-----|-------|
| 🔴 **P0** | 7.8 (Fix N+1) | Ảnh hưởng ngay đến hiệu năng Admin page |
| 🔴 **P0** | 7.9 (Limit select) | Tránh crash DB do data lớn |
| 🔴 **P0** | 7.7 (Composite index) | Ảnh hưởng mọi query booking |
| 🟡 **P1** | 7.1 (Edge middleware) | Chi phí thấp, lợi ích cao |
| 🟡 **P1** | 7.11 (Realtime notifications) | Thay polling, giảm request rõ rệt |
| 🟡 **P1** | 7.3 (Batch API) | Giảm request booking flow |
| 🟢 **P2** | 7.12 (RLS) | Refactor lớn, làm sau cùng |

#### 7d. Review bảng cần bật Supabase Realtime

Supabase Realtime dùng WebSocket, phù hợp thay polling. Cần chọn lọc vì mỗi bảng enable Realtime làm tăng CPU (write amplification).

| Bảng | Enable? | Lý do | Mức ưu tiên |
|------|---------|-------|-------------|
| `notifications` | **✅ CÓ** | Thay thế polling 30s ở NotificationBell + real-time badge count | **P0** |
| `appointments` | **✅ CÓ** | Staff page cập nhật trạng thái booking realtime (có ai vừa đặt / hủy) | **P1** |
| `attendance` | **⚠️ XEM XÉT** | Admin schedule có thể cập nhật realtime khi staff điểm danh | P2 |
| `time_slot_locks` | **❌ KHÔNG** | Lock là transient, booking engine tự quản lý, realtime không giúp ích | — |
| `users` | **❌ KHÔNG** | Dữ liệu tĩnh, chỉ thay đổi khi admin edit | — |
| `services` | **❌ KHÔNG** | Dữ liệu tĩnh, ít thay đổi | — |
| `customers` | **❌ KHÔNG** | Chỉ tạo mới qua booking flow | — |
| `audit_logs` | **❌ KHÔNG** | Log chiều, không cần realtime | — |

**Lưu ý:**
- Realtime dùng **WebSocket** — nếu client mất kết nối (đi thang máy, chuyển mạng) sẽ tự reconnect
- Về mặt CPU: bật Realtime trên `notifications` và `appointments` là chấp nhận được
- Cần thêm `Authorization` header khi subscribe channel để bảo mật

### Lưu ý khi triển khai

- Edge Runtime không hỗ trợ `fs`, `crypto` (jose) một phần — cần test middleware kỹ trước khi chuyển
- Supabase Realtime yêu cầu enable Realtime trên bảng — chỉ enable bảng đã được review ở mục 7d
- Composite index có thể làm chậm write — cần monitor sau khi thêm
- PgBouncer Transaction mode không hỗ trợ prepared statements xuyên request

---

## Tổng kết files đã sửa (19 files)

| File | Issues | Phase | Trạng thái |
|------|--------|-------|-----------|
| `app/admin/page.tsx` | 1, 3, 6 | P2, P3 | ✅ Status column, filter dropdown, toggle button, bell layout |
| `app/admin/actions.ts` | 1, 6 | P2 | ✅ `toggleStaffActive()`, filter `is_active` trong commission |
| `app/admin/schedule/actions.ts` | 2, 6 | P1, P2 | ✅ `is_present` flag, `.eq('is_active', true)`, N+1 đã fix |
| `components/MasterSchedule.tsx` | 2 | P1 | ✅ Badge "Chưa điểm danh" / "Đã trực" |
| `middleware.ts` | 4 | P1 | ✅ Re-encrypt JWT với fresh exp |
| `utils/supabase/middleware.ts` | 4 | P1 | ✅ Bỏ `updateSession()` gây mất cookie |
| `utils/auth.ts` | 4 | P1 | ✅ Thêm `maxAge: 0` khi logout |
| `app/api/logout/route.ts` | 4 | P1 | 🟢 Không cần sửa (auth.ts đã xử lý) |
| `lib/booking-engine.ts` | 5 | P2 | ✅ `getSlotAvailabilityWithNames` dùng `durationMinutes` động |
| `app/booking/actions.ts` | 5, 6 | P2 | ✅ `getSlotAvailability` → delegation, filter `is_active` notif |
| `components/BookingCalendar.tsx` | 5 | P2 | ✅ Ẩn past slot, badge "⭐ Gợi ý" |
| `app/booking/page.tsx` | 5 | P2 | ✅ Date 14 ngày, cache localStorage, pass services vào getSlotAvailability |
| `app/login/actions.ts` | 4, 6 | P1 | ✅ Hardcoded bypass, check `is_active === false` |
| `app/api/login/route.ts` | 4, 6 | P1 | ✅ Check `is_active === false` |
| `app/api/auth/me/route.ts` | 4 | P1 | ✅ Endpoint kiểm tra session |
| `scripts/migrate_schema.sql` | 5, 6, 7 | P2, P3 | ✅ Index + NOT NULL + composite index |
| `database.sql` | 5, 6 | P2 | ✅ Sửa trailing comma, thêm actual_start_time/end_time, reorder, indexes, seed data |
| `components/NotificationBell.tsx` | 3, 7 | P3 | ✅ Realtime subscribe + polling 5 phút |
| `UPGRADE_PLAN.md` | — | — | ✅ Tạo + cập nhật |

### Không thực hiện
- ~~`app/notifications/page.tsx`~~ — Không cần sửa (đã ổn)
- ~~`supabase/client.ts`~~ — Realtime config trong NotificationBell bằng dynamic import
- ~~**P3.2** Edge middleware + Redis~~ — Edge runtime không tương thích jose

---

## Tiến độ

- [x] Tạo `UPGRADE_PLAN.md`

### Phase 1 — P0: Critical ✅
- [x] **P1.1** Vấn đề 4: Session persistence (middleware + auth + logout + /api/auth/me)
- [x] **P1.2** Vấn đề 6a: Chặn soft-delete staff login (login actions + API)
- [x] **P1.3** Vấn đề 2: MasterSchedule attendance (actions + MasterSchedule.tsx)

### Phase 2 — P1: High ✅
- [x] **P2.1** Vấn đề 1: Staff status UI + toggle (admin page + actions)
- [x] **P2.2** Vấn đề 6b: Filter is_active trong query (commission, schedule, notif)
- [x] **P2.3** Vấn đề 5: Booking time slots (giờ 20:30, ẩn slot quá giờ, date picker 14 ngày, badge "⭐ Gợi ý", cache localStorage, fix hardcoded 30 → totalDuration động)
- [x] **P2.4** Vấn đề 6c: Index + NOT NULL DB (migration + database.sql)

### Phase 3 — P2: Medium ✅ (trừ 7a)
- [x] **P3.1** Vấn đề 3: Bell layout admin
- [ ] ~~**P3.2** Vấn đề 7a: Edge middleware + Redis cache~~ *(Bỏ qua — Edge runtime không tương thích jose; Redis cần Upstash infrastructure)*
- [x] **P3.3** Vấn đề 7b: Composite index (idx_attendance_date_status, idx_appointments_start_time_status) + N+1 (đã fix từ trước trong getScheduleData)
- [x] **P3.4** Vấn đề 7c: Realtime notifications (subscribe channel + giảm polling 30s → 5 phút)

### Kết quả
- **19 files** sửa / tạo mới (theo danh sách ở trên)
- **1 file** bỏ qua có chủ đích (P3.2)

---

*Cập nhật lần cuối: 18/06/2026*
