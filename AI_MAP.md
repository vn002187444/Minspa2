# 🗺️ AI_MAP: BẢN ĐỒ KỸ THUẬT & KIẾN TRÚC DỮ LIỆU - MIN NAIL & HAIR

Chào mừng bạn đến với tài liệu **AI-Map**. Đây là bản đồ chỉ dẫn kỹ thuật, cấu trúc database, sơ đồ định tuyến và các nguyên tắc kiến trúc tối cao của toàn hệ thống **Min Nail & Hair** để đảm bảo quá trình phát triển không bao giờ xảy ra xung đột hoặc lỗi thiết kế.

---

## 📦 STACK & DEPENDENCIES

| Package | Version | Mục đích |
|---------|---------|----------|
| next | ^16.2.7 | Framework |
| react / react-dom | ^19.2.7 | UI |
| @supabase/supabase-js | ^2.107.0 | Database client |
| @supabase/ssr | ^0.10.3 | SSR helpers (không dùng override auth) |
| jose | ^6.2.3 | JWT encrypt/decrypt session cookie |
| lucide-react | ^0.471.0 | Icons |
| motion | ^12.40.0 | Animation (thay thế framer-motion) |
| date-fns | ^4.4.0 | Date utilities |
| recharts | ^3.8.1 | Charts (admin dashboard) |
| sonner | ^2.0.7 | Toast notifications |
| tailwind-merge + clsx | — | Class utilities |
| web-push | ^3.6.7 | Web push notifications |
| @google/genai | ^2.7.0 | Gemini AI integration |
| @dnd-kit/core + utilities | ^6.3.1 | Drag & drop |
| TypeScript | ^5 | Language |

**next.config.ts** — Default (empty, không custom config)

---

## 💾 SƠ ĐỒ CẤU TRÚC DATABASE (SUPABASE)

Hệ thống dùng Supabase PostgreSQL thật. **Không có mock DB** trong production. File `database.sql` là schema gốc duy nhất.

> Seed users (id cố định, dùng `ON CONFLICT DO NOTHING`):
> - `00000000-0000-0000-0000-000000000000` → ADMIN / `admin` / `Admin`
> - `00000000-0000-0000-0000-000000000001` → STAFF / `staff1` / `Staff@1`
> - `00000000-0000-0000-0000-000000000002` → MANAGER / `manager` / `Manager@1`

### 1. Bảng `users` (Quản lý Tài khoản & Phân Quyền)
- `id` (UUID, Primary Key)
- `role` (VARCHAR - `ADMIN`, `MANAGER`, hoặc `STAFF`)
- `username` (VARCHAR, Unique)
- `password_hash` (VARCHAR - so sánh plaintext, **không hash**)
- `full_name` (VARCHAR)
- `cccd` (VARCHAR, Nullable - Bắt buộc nếu role = `STAFF`)
- `is_active` (BOOLEAN, NOT NULL DEFAULT TRUE - Soft delete)
- `notification_token` (JSONB - Push notification subscription)
- `created_at` (TIMESTAMP)
- Constraint: `CHECK (role IN ('ADMIN','MANAGER') OR (role = 'STAFF' AND cccd IS NOT NULL))`
- Index: `idx_users_is_active`

### 2. Bảng `audit_logs` (Nhật ký thao tác)
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id ON DELETE CASCADE)
- `action` (VARCHAR - v.d. 'TOGGLE_STAFF_ACTIVE', 'DELETE_STAFF')
- `details` (TEXT)
- `created_at` (TIMESTAMP)

### 3. Bảng `customers` (Hồ sơ khách hàng)
- `id` (UUID, PK)
- `full_name` (VARCHAR)
- `phone` (VARCHAR, UNIQUE - SĐT tra cứu)
- `notification_token` (JSONB)
- `created_at` (TIMESTAMP)

### 4. Bảng `services` (Dịch vụ)
- `id` (UUID, PK)
- `name` (VARCHAR)
- `category` (VARCHAR - `Móng` | `Gội dưỡng sinh` | `Massage` | `Deal`)
- `description` (TEXT)
- `price` (DECIMAL)
- `duration` (INT - phút)
- `image_url` (VARCHAR, Nullable → `seo-images` bucket)
- `is_active` (BOOLEAN, NOT NULL DEFAULT TRUE)
- `discount_percentage` (DECIMAL)
- `commission_percentage` (DECIMAL)
- `commission_amount` (DECIMAL - ưu tiên hơn percentage nếu > 0)
- Index: `idx_services_is_active`

### 5. Bảng `appointments` (Lịch hẹn)
- `id` (UUID, PK)
- `customer_id` (UUID, FK → customers.id)
- `staff_id` (UUID, FK → users.id, Nullable nếu PENDING_RANDOM)
- `start_time` (TIMESTAMP, NOT NULL)
- `end_time` (TIMESTAMP)
- `actual_start_time` (TIMESTAMP - Cascade shift)
- `actual_end_time` (TIMESTAMP - Cascade shift)
- `status` (VARCHAR - `PENDING_RANDOM` | `CONFIRMED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`)
- `tip_amount` (DECIMAL)
- `total_amount` (DECIMAL)
- `commission_amount` (DECIMAL)
- `is_package_session` (BOOLEAN)
- `use_package_id` (UUID, FK → customer_packages.id)
- `buy_package_id` (UUID, FK → treatment_packages.id)
- `created_at` (TIMESTAMP)
- Index: `idx_appointments_start_time_status(start_time, status)`

### 6. Bảng `appointment_services` (Lịch hẹn ↔ Dịch vụ)
- `appointment_id` (UUID, FK → appointments.id)
- `service_id` (UUID, FK → services.id)
- PK: `(appointment_id, service_id)`

### 7. Bảng `reviews` (Đánh giá)
- `id` (UUID, PK)
- `appointment_id` (UUID, FK → appointments.id)
- `rating` (INT, 1-5)
- `quick_tags` (JSONB)
- `comment` (TEXT)
- `created_at` (TIMESTAMP)

### 8. Bảng `attendance` (Chấm công)
- `id` (UUID, PK)
- `staff_id` (UUID, FK → users.id)
- `date` (DATE)
- `status` (VARCHAR - `PRESENT` | `ABSENT`)
- `check_in_time` (TIMESTAMP)
- `check_out_time` (TIMESTAMP)
- UNIQUE: `(staff_id, date)`
- Index: `idx_attendance_date_status(date, status)`

### 9. Bảng `treatment_packages` (Gói liệu trình gốc)
- `id` (UUID, PK)
- `name` (VARCHAR)
- `service_id` (UUID, FK → services.id)
- `buy_count` (INT)
- `free_count` (INT)
- `price` (DECIMAL)
- `total_sessions` (INT)
- `commission_percentage` (DECIMAL)
- `is_active` (BOOLEAN, NOT NULL DEFAULT TRUE)
- `created_at` (TIMESTAMP)
- Index: `idx_treatment_packages_is_active`

### 10. Bảng `customer_packages` (Gói đã mua)
- `id` (UUID, PK)
- `customer_id` (UUID, FK → customers.id)
- `package_id` (UUID, FK → treatment_packages.id)
- `remaining_sessions` (INT)
- `total_sessions` (INT)
- `status` (VARCHAR - `ACTIVE` | `EXHAUSTED`)
- `purchased_at` (TIMESTAMP)
- `sold_by_staff_id` (UUID, FK → users.id)
- `commission_amount` (DECIMAL)
- `created_at` (TIMESTAMP)

### 11. Bảng `package_usage_logs` (Nhật ký dùng gói)
- `id` (UUID, PK)
- `customer_package_id` (UUID, FK → customer_packages.id)
- `appointment_id` (UUID, FK → appointments.id)
- `staff_id` (UUID, FK → users.id)
- `notes` (TEXT)
- `used_at` (TIMESTAMP)

### 12. Bảng `blogs` (Bài viết SEO)
- `id` (UUID, PK)
- `title` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `summary` (TEXT)
- `content` (TEXT - Markdown)
- `image_url` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 13. Bảng `time_slot_locks` (Khóa khung giờ động)
- `id` (UUID, PK)
- `staff_id` (UUID, FK → users.id)
- `appointment_id` (UUID, FK → appointments.id)
- `lock_date` (DATE)
- `start_time` (TIMESTAMP, NOT NULL)
- `end_time` (TIMESTAMP, NOT NULL)
- `is_active` (BOOLEAN DEFAULT TRUE)
- `created_at` (TIMESTAMP)
- Index: `idx_time_slot_locks_staff_date(staff_id, lock_date)`
- Index: `idx_time_slot_locks_appointment(appointment_id)`
- Index: `idx_time_slot_locks_active(is_active)`

### 14. Bảng `notifications` (Thông báo realtime)
- `id` (UUID, PK)
- `recipient_type` (VARCHAR - `user` | `customer`)
- `recipient_id` (UUID)
- `title` (VARCHAR, NOT NULL)
- `content` (TEXT, NOT NULL)
- `link` (VARCHAR)
- `is_read` (BOOLEAN DEFAULT FALSE)
- `created_at` (TIMESTAMP)
- Index: `idx_notifications_recipient(recipient_type, recipient_id)`
- Index: `idx_notifications_unread(recipient_type, recipient_id, is_read)`
- Index: `idx_notifications_created_at(created_at DESC)`

### 15. Bảng cấu hình single-row
| Table | Key columns |
|-------|-------------|
| `seo_settings` | id=1, page_title, meta_description, meta_keywords, og_image_url, online_discount_enabled, online_discount_percent, default_commission_percent, hotline |
| `seo_articles` | id(VARCHAR PK), topic, keywords, article, image_url |
| `banner_settings` | id=1, is_enabled, content |
| `bank_settings` | id=1, bank_id, bank_name, account_number, account_owner |

### 16. Bảng reminder logs (4 bảng)
- `attendance_reminders_log` — id, staff_id FK, sent_at
- `random_booking_reminders_log` — id, staff_id FK, appointment_id FK, sent_at
- `unaccepted_booking_reminders_log` — id, appointment_id FK, sent_at
- `uncompleted_booking_reminders_log` — id, appointment_id FK, sent_at

### 17. Storage `seo-images`
- Public bucket, file_size_limit=5MB, allowed MIME: png/jpeg/webp
- Upload flow: Base64 → `sharp` resize 1200px → WebP quality 80 → Supabase Storage

---

## 🗺️ BẢN ĐỒ ROUTES

### Page Routes
| Route | File | Mô tả |
|-------|------|-------|
| `/` | `app/page.tsx` | Landing page: services, feedback, schedule tracker, packages, booking CTA |
| `/booking` | `app/booking/page.tsx` | Đặt lịch 3 bước: (1) chọn ngày-giờ-dịch vụ, (2) nhập thông tin KH, (3) xác nhận |
| `/booking/actions.ts` | Server actions | `checkCustomerHistory`, `submitBooking`, `getAvailableStaff`, `getPublicServices`, `getSlotAvailability`, `getCustomerCareSuggestion` ... |
| `/login` | `app/login/page.tsx` | Đăng nhập admin/staff với auto-fill buttons |
| `/login/actions.ts` | Server action | `loginUser(prevState, formData)` — bypass + DB path |
| `/admin` | `app/admin/page.tsx` | Dashboard: charts, staff table, services, packages, blog SEO AI, settings (4956 dòng) |
| `/admin/schedule` | `app/admin/schedule/page.tsx` + `actions.ts` | MasterSchedule lịch ngang |
| `/admin/customers` | `app/admin/customers/page.tsx` + `actions.ts` + `CustomerCRM.tsx` | CRM khách hàng |
| `/admin/blog` | `app/admin/blog/page.tsx` | Quản lý bài viết SEO |
| `/admin/orders` | `app/admin/orders/page.tsx` | Đơn hàng / packages đã bán |
| `/admin/audit-logs` | `app/admin/audit-logs/page.tsx` + `actions.ts` | Nhật ký thao tác |
| `/staff` | `app/staff/page.tsx` + `actions.ts` | Portal NV: chấm công, lịch cá nhân, trừ buổi liệu trình |
| `/notifications` | `app/notifications/page.tsx` | Danh sách thông báo |
| `/blog` | `app/blog/page.tsx` | Danh sách bài viết |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` + `ShareButton.tsx` | Chi tiết bài viết SEO |

### API Routes
| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `api/auth/me` | GET | `{ authenticated: boolean, user: ... }` từ session cookie |
| `api/login` | POST | Login form → set session cookie |
| `api/logout` | POST | Xóa session cookie |
| `api/vapid` | GET | Trả VAPID public key cho push notification |
| `api/subscribe` | POST | Lưu push subscription |
| `api/booking/cancel` | POST | Hủy appointment + unlock slots + cascade shift |
| `api/booking/complete-early` | POST | Kết thúc sớm appointment + cascade shift |
| `api/booking/locks` | POST | Quản lý time_slot_locks |
| `api/notifications` | GET | Danh sách notifications (có phân trang) |
| `api/notifications/unread-count` | GET | Số lượng chưa đọc |
| `api/notifications/[id]/read` | PATCH | Đánh dấu đã đọc |
| `api/notifications/read-all` | POST | Đánh dấu tất cả đã đọc |
| `api/cron/reminders` | POST | Cron job: 4 reminder rules (cần CRON_SECRET) |
| `api/cron-check` | GET | Health check cho cron |
| `api/generate-description` | POST | AI sinh mô tả dịch vụ |
| `api/generate-seo-article` | POST | AI sinh bài viết SEO |
| `api/generate-seo-image` | POST | AI sinh ảnh SEO |
| `api/ai-assist` | POST | AI assistant chat |
| `api/seo-search` | POST | Tìm kiếm từ khóa SEO |

---

## 🔐 AUTH SYSTEM

### Cookie Session (tự custom, KHÔNG dùng Supabase Auth)

```
Cookie: session=<JWT>
├── httpOnly: true
├── secure: true (production)
├── sameSite: 'lax'
├── path: /
├── maxAge: 30 days
└── payload: { user: { id, role, username }, expires }
```

### Luồng xác thực

```
Client → Login form → loginUser() server action
                        ├── Hardcoded bypass (admin/staff1) → createSession → redirect
                        └── DB path: query users → check is_active → compare password_hash → createSession → redirect

Mỗi request:
  middleware.ts
    ├── Đọc cookie "session"
    ├── Decrypt JWT → nếu OK → re-encrypt với exp mới → set cookie
    ├── Nếu fail → clear cookie
    ├── /admin chỉ cho ADMIN/MANAGER
    └── /staff chỉ cho STAFF/MANAGER

Server → Server Action / API Route
    └── createClient() (utils/supabase/server.ts)
         ├── Dùng SUPABASE_SERVICE_ROLE_KEY (hoặc ANON_KEY)
         └── Override auth.getUser → đọc session cookie → decrypt → trả user
```

### Critical: `utils/supabase/server.ts`
```typescript
createClient() → real Supabase client
  - auth.getUser is OVERRIDDEN to resolve from custom JWT cookie
  - Không dùng Supabase Auth.getUser mặc định
```

### `utils/supabase/client.ts`
```typescript
createClient() → nếu có env vars → real client
              → nếu không → mock client (trả data rỗng)
```

### `utils/supabase/middleware.ts`
```typescript
updateSession() = no-op (chỉ return NextResponse.next())
```

### Login bypass (app/login/actions.ts)
```
admin → password 'Admin' hoặc 'admin' → redirect /admin
staff1 → password 'Staff@1' hoặc 'staff1' → redirect /staff
```
DB auto-seeds user nếu chưa tồn tại. Các user khác xác thực qua DB path.

### JWT Secret
```
process.env.JWT_SECRET
Fallback: 'min-nail-hair-super-secret-key-24h'
```

---

## 📅 BOOKING ENGINE (lib/booking-engine.ts)

| Export | Type | Mô tả |
|--------|------|-------|
| `TimeLock` | Interface | `{ id, staff_id, appointment_id, lock_date, start_time, end_time, is_active }` |
| `SlotAvailability` | Interface | `{ time, status, availableStaff, totalStaff, availableStaffNames, isRecommended }` |
| `calculateProgressiveDuration` | Function | Tính tổng duration từ service IDs |
| `getEffectiveTimeRange` | Function | Lấy actual start/end, fallback về expected |
| `doRangesOverlap` | Function | Kiểm tra 2 khoảng thời gian overlap |
| `lockTimeSlots` | Function | Insert time_slot_locks |
| `unlockTimeSlots` | Function | Deactivate locks cho appointment |
| `unlockTimeSlotsInRange` | Function | Deactivate locks trong khoảng thời gian |
| `cascadeShiftForward` | Function | Dời lịch tới khi hoàn thành sớm |
| `handleCancelAndUnlock` | Function | Hủy + unlock + cascade + notif |
| `getSlotAvailabilityWithNames` | Function | Grid availability (dùng `durationMinutes` động) |

### Booking flow
```
1. Page load → getPublicServices() + getSlotAvailability(date, [], [])
2. Chọn ngày → getSlotAvailability(date, selectedServiceIds, services)
3. Click slot → getAvailableStaff(date, time, totalDuration)
4. Chọn staff + services → next step
5. Nhập SDT → checkCustomerHistory(phone) → localStorage cache (24h)
6. Xác nhận → submitBooking(formData) → lockTimeSlots → redirect
```

---

## 🔔 NOTIFICATION SYSTEM

### Realtime (ưu tiên)
```
NotificationBell.tsx
  ├── Mount → subscribe channel "notifications"
  │             INSERT + UPDATE trên public.notifications
  │             filter: recipient_type=eq.user, recipient_id=eq.userId
  ├── Khi có insert realtime → fetch unread count
  └── Fallback polling mỗi 5 phút
```

### Push Notification
```
utils/push.ts → web-push (VAPID)
  ├── subscribe → POST /api/subscribe → lưu subscription JSON
  └── sendPushNotification(recipientId, title, body, url)
       ├── Query notification_token từ users/customers
       └── Gửi qua web-push
```

### Reminder Cron
```
api/cron/reminders → utils/reminders.ts → runRemindersCheck()
  ├── Rule 1: Attendance reminder (chưa điểm danh sáng)
  ├── Rule 2: Random booking reminder (chưa nhận lịch)
  ├── Rule 3: Unaccepted booking reminder
  └── Rule 4: Uncompleted booking reminder
  Bảo vệ bởi CRON_SECRET + prevent duplicate bằng reminder log tables
```

---

## ⚙️ CRITICAL CONFIG FILES

| File | Vai trò |
|------|---------|
| `database.sql` | **Source of truth** cho DB schema. Chạy 1 phát trên Supabase SQL Editor |
| `.env.local` | Chứa: SUPABASE_*, JWT_SECRET, GEMINI_API_KEY, VAPID_*, CRON_SECRET, UNSPLASH_ACCESS_KEY |
| `.env.example` | Mẫu các biến môi trường |
| `next.config.ts` | Default (trống) |
| `middleware.ts` | Session refresh + route protection |
| `scripts/migrate_schema.sql` | Upgrade script (ALTER ADD COLUMN IF NOT EXISTS) |

### Environment Variables
```
# Bắt buộc
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Có quyền bypass RLS
JWT_SECRET=...                      # Mã hóa session cookie

# AI
GEMINI_API_KEY=...

# Push Notification
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
WEB_PUSH_EMAIL=...

# Security
CRON_SECRET=...

# Optional
UNSPLASH_ACCESS_KEY=...            # Fallback AI image
NEXT_PUBLIC_APP_URL=...            # SEO sitemap
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

---

## 🛠️ QUY TẮC KỸ THUẬT

1. **Không `SELECT *`** — Luôn định rõ fields
2. **Client-side Filtering** — Tải 1 lần, filter bằng React state
3. **Soft Delete** — Không DELETE, chỉ `is_active = false`
4. **Web Push** — Service worker thuần trong `/public`
5. **AI** — Gemini-2.5-flash-lite (text), Gemini-2.5-flash-image (image). Fallback Unsplash
6. **Image** — Base64 → sharp (resize 1200px, WebP q80) → Supabase Storage
7. **Schedule Grid** — Ẩn cột giờ trống tự động
8. **Session** — Custom JWT cookie, middleware refresh mỗi request
9. **Login** — Hardcoded bypass cho admin/staff1, DB path cho user khác
10. **Booking** — `getSlotAvailabilityWithNames` với duration động theo services
11. **Realtime** — Subscribe `notifications` channel, polling fallback 5 phút

---

## ⚠️ QUY CHẾ VẬN HÀNH (CYCLE PROTOCOL)

1. **Đọc `UPGRADE_PLAN.md` và `AI_MAP.md`** trước khi code
2. **Viết code** theo đúng kiến trúc
3. **Cập nhật `UPGRADE_PLAN.md`** (dấu `[x]`) và **`AI_MAP.md`** sau mỗi thay đổi

---

## 📊 TỈ LỆ PHỤC HỒI

| Thành phần | Bao phủ | Mất gì? |
|-----------|---------|---------|
| DB Schema | **~95%** | Thiếu seed services values (22 services trong database.sql) |
| Routes | **~90%** | Đã liệt kê tất cả routes + API endpoints |
| Auth | **~95%** | Cookie, JWT, middleware, bypass, override auth.getUser |
| Booking | **~90%** | Engine exports, flow, localStorage cache |
| Notifications | **~85%** | Realtime + push + cron |
| UI Components | **~40%** | Chỉ có tên file, thiếu props/interface |
| Business Logic | **~70%** | Cron rules mô tả chung, thiếu detail recurring logic |
| Dependencies | **100%** | package.json đầy đủ |

**Tỉ lệ phục hồi ước tính: ~80-85%**

Nếu mất source code, có thể tái thiết từ 2 file này + database.sql. Các phần bị thiếu: chi tiết UI layout, business logic xử lý edge cases, và 22 seed services trong database.sql.
