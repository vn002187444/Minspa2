# 🗺️ AI_MAP: BẢN ĐỒ KỸ THUẬT & KIẾN TRÚC DỮ LIỆU - MIN NAIL & HAIR

Chào mừng bạn đến với tài liệu **AI-Map**. Đây là bản đồ chỉ dẫn kỹ thuật, cấu trúc database, sơ đồ định tuyến và các nguyên tắc kiến trúc tối cao của toàn hệ thống **Min Nail & Hair** để đảm bảo quá trình phát triển không bao giờ xảy ra xung đột hoặc lỗi thiết kế.

---

## 📦 STACK & DEPENDENCIES

| Package | Version | Mục đích |
|---------|---------|----------|
| next | ^16.2.9 | Framework |
| react / react-dom | ^19.2.7 | UI |
| @supabase/supabase-js | ^2.107.0 | Database client |
| @supabase/ssr | ^0.10.3 | SSR helpers (không dùng override auth) |
| jose | ^6.2.3 | JWT encrypt/decrypt session cookie |
| lucide-react | ^0.471.0 | Icons |
| date-fns | ^4.4.0 | Date utilities |
| recharts | ^3.8.1 | Charts (admin dashboard) |
| sonner | ^2.0.7 | Toast notifications |
| tailwind-merge + clsx | — | Class utilities |
| web-push | ^3.6.7 | Web push notifications |
| @google/genai | ^2.7.0 | Gemini AI integration |
| bcryptjs | ^2.4.3 | Password hashing |
| dompurify | ^3.2.4 | XSS sanitization (server + client) |
| @sentry/nextjs | — | Error tracking (logger utility) |
| zod | — | Input validation (login, booking) |
| TypeScript | ^5 | Language |

**next.config.ts** — Custom config (security headers, image remote patterns, logging, CSP-Report-Only)

### New files added in this session
| File | Purpose |
|------|---------|
| `components/ui/Button.tsx` | Design system button (5 variants, 3 sizes, loading) |
| `components/ui/Input.tsx` | Design system input (label, error, leftIcon) |
| `lib/cn.ts` | `clsx` + `tailwind-merge` utility |
| `lib/design-tokens.ts` | CSS variable design tokens |
| `lib/services.ts` | Service category normalization + grouping |
| `lib/logger.ts` | Logger with Sentry integration (production) |
| `lib/sanitize.client.ts` | Client-side DOMPurify |
| `hooks/useReducedMotion.ts` | `prefers-reduced-motion` hook |
| `lib/i18n/*` | 9-language i18n system (LanguageSwitcher) |

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
- `password_hash` (VARCHAR - bcrypt hash qua `lib/password.ts`)
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
- `image_alt` (VARCHAR, Nullable — SEO alt text, fallback to title)
- `keywords` (TEXT, Nullable)
- `published` (BOOLEAN, DEFAULT false)
- `published_at` (TIMESTAMP, Nullable)
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

### 14. Bảng `blog_views` (Lượt xem blog)
- `id` (UUID, PK)
- `post_id` (UUID, FK → blogs.id ON DELETE CASCADE)
- `viewed_at` (TIMESTAMP)
- `ip_hash` (VARCHAR - sha256 ẩn danh)
- `user_agent` (TEXT)
- Index: `idx_blog_views_post_id(post_id)`
- Index: `idx_blog_views_post_ip(post_id, ip_hash)`

### 15. Bảng `blog_stats` (Thống kê blog theo ngày)
- `id` (UUID, PK)
- `post_id` (UUID, FK → blogs.id ON DELETE CASCADE)
- `date` (DATE)
- `views` (INTEGER DEFAULT 0)
- UNIQUE: `(post_id, date)`

### 16. Bảng `ai_cache` (Cache Gemini response)
- `id` (UUID, PK)
- `cache_key` (VARCHAR, UNIQUE)
- `response` (TEXT)
- `created_at` (TIMESTAMP)
- Index: `idx_ai_cache_created_at(created_at)`

### 17. Bảng `rate_limits` (Rate limiting)
- `id` (UUID, PK)
- `key` (VARCHAR - IP hoặc user_id)
- `count` (INTEGER)
- `window_start` (TIMESTAMP)
- UNIQUE: `(key, window_start)`

### 18. Bảng `notifications` (Thông báo realtime)
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

### 19. Bảng cấu hình single-row
| Table | Key columns |
|-------|-------------|
| `seo_settings` | id=1, page_title, meta_description, meta_keywords, og_image_url, logo_url, facebook_url, zalo_url, hotline, online_discount_enabled, online_discount_percent, default_commission_percent |
| `seo_articles` | id(VARCHAR PK), topic, keywords, article, image_url, image_alt, status (draft/published), topic_source, blog_slug, published_at |
| `banner_settings` | id=1, is_enabled, content |
| `bank_settings` | id=1, bank_id, bank_name, account_number, account_owner |

### 20. Bảng reminder logs (4 bảng)
- `attendance_reminders_log` — id, staff_id FK, sent_at
- `random_booking_reminders_log` — id, staff_id FK, appointment_id FK, sent_at
- `unaccepted_booking_reminders_log` — id, appointment_id FK, sent_at
- `uncompleted_booking_reminders_log` — id, appointment_id FK, sent_at

### 21. Bảng `tasks` (Công việc)
- `id` (UUID, PK)
- `title` (VARCHAR)
- `description` (TEXT)
- `task_type` (VARCHAR - 'daily', 'adhoc', etc.)
- `assignee_id` (UUID, FK → users.id, Nullable)
- `assignee_type` (VARCHAR - 'specific' | 'all')
- `created_by` (UUID, FK → users.id)
- `status` (VARCHAR - `PENDING` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED` | `REJECTED`) — ALL UPPERCASE
- `priority` (VARCHAR - 'low' | 'medium' | 'high' | 'urgent')
- `deadline` (TIMESTAMP, Nullable)
- `time_slot` (VARCHAR, Nullable)
- `original_task_id` (UUID, FK → tasks.id, Nullable)
- `completed_at` (TIMESTAMP, Nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 22. Bảng `background_tasks` (Queue)
- `id` (UUID, PK)
- `task_type` (VARCHAR)
- `payload` (JSONB)
- `status` (VARCHAR - 'pending' | 'processing' | 'completed' | 'failed') — lowercase
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 23. Bảng `salary_payments` (Bảng lương)
- `id` (UUID, PK)
- `staff_id` (UUID, FK → users.id)
- `period_start`, `period_end` (TIMESTAMP)
- `base_salary`, `total_commission`, `total_tips`, `total_package_commission`, `bonus`, `deduction`, `advance`, `net_pay` (DECIMAL)
- `status` (VARCHAR)
- `notes`, `paid_by` (TEXT/UUID)
- `paid_at`, `created_at` (TIMESTAMP)

### 24. Bảng `faqs` (Câu hỏi thường gặp)
- `id` (UUID, PK)
- `question`, `answer` (TEXT)
- `category` (VARCHAR)
- `sort_order` (INT)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### 25. Bảng `service_categories` (Danh mục dịch vụ)
- `id` (UUID, PK)
- `name` (VARCHAR)
- `slug` (VARCHAR)
- `sort_order` (INT)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- **LƯU Ý:** Table tồn tại trong schema nhưng code vẫn dùng legacy `category` text column

### 26. RPC Functions
- `deduct_package_session` — Trừ buổi liệu trình
- `refund_package_session` — Hoàn buổi liệu trình
- `enqueue_background_task` — Thêm task vào queue
- `dequeue_all_background_tasks` — Lấy tất cả pending tasks
- `increment_blog_view` — Tăng lượt xem blog
- `exec_sql` — Execute raw SQL (dev tool only, không trong database.sql)

### 27. Storage `seo-images`
- Public bucket, file_size_limit=5MB, allowed MIME: png/jpeg/webp
- Upload flow: Base64 → `sharp` resize 1200px → WebP quality 80 → Supabase Storage

---

## 🗺️ BẢN ĐỒ ROUTES

### Page Routes
| Route | File | Mô tả |
|-------|------|-------|
| `/` | `app/page.tsx` | Landing page: services, feedback, schedule tracker, packages, booking CTA |
| `/booking` | `app/booking/page.tsx` | Đặt lịch 3 bước: (1) chọn ngày-giờ-dịch vụ, (2) nhập thông tin KH, (3) xác nhận |
| `/booking/actions/` | 6 server action files | `public.ts` (services/SEO/packages), `slots.ts` (availability), `booking.ts` (submit), `customer.ts` (history/review/cancel), `suggestions.ts` (AI care), `notifications.ts` (CRUD) |
| `/login` | `app/login/page.tsx` | Đăng nhập admin/staff với auto-fill buttons |
| `/login/actions.ts` | Server action | `loginUser(prevState, formData)` — Zod validation, rate-limit, DB auth |
| `/admin` | `app/admin/page.tsx` | Dashboard: charts, staff table, services, packages, blog SEO AI, settings (424 dòng — đã tách ra 16 component files) |
| `/admin/schedule` | `app/admin/schedule/page.tsx` + `actions.ts` | MasterSchedule lịch ngang (grid: `MasterScheduleGrid.tsx`, list: `MasterScheduleList.tsx`, DnD: `ScheduleDndComponents.tsx`, modal: `AppointmentDetailModal.tsx`) |
| `/admin/customers` | `app/admin/customers/page.tsx` + `actions.ts` + `CustomerCRM.tsx` | CRM khách hàng |
| `/admin/blog` | `app/admin/blog/page.tsx` | Quản lý bài viết SEO |
| `/admin/orders` | `app/admin/orders/page.tsx` | Đơn hàng / packages đã bán |
| `/admin/audit-logs` | `app/admin/audit-logs/page.tsx` + `actions.ts` | Nhật ký thao tác |
| `/staff` | `app/staff/page.tsx` + `actions.ts` | Portal NV: chấm công, lịch cá nhân, trừ buổi liệu trình |
| `/notifications` | `app/notifications/page.tsx` | Danh sách thông báo |
| `/offline` | `app/offline/page.tsx` | Offline fallback page |
| `/admin/blog-analytics` | `app/admin/blog-analytics/page.tsx` | Thống kê blog |
| `/blog` | `app/blog/page.tsx` | Danh sách bài viết (phân trang 6/page); BreadcrumbSchema |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` + `ShareButton.tsx` + `ViewTracker.tsx` | Chi tiết bài viết SEO; BreadcrumbSchema + ArticleSchema |
| `/admin/seo-articles` | `app/admin/seo-articles/page.tsx` | SEO articles CRUD (list, create, edit, delete, publish to blog) |

### API Routes
| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `api/auth/me` | GET | `{ authenticated: boolean, user: ... }` từ session cookie |
| `api/logout` | POST | Xóa session cookie |
| `api/vapid` | GET | Trả VAPID public key cho push notification |
| `api/subscribe` | POST | Lưu push subscription |
| `api/notifications` | GET | Danh sách notifications (có phân trang) |
| `api/notifications/unread-count` | GET | Số lượng chưa đọc |
| `api/notifications/[id]/read` | PATCH | Đánh dấu đã đọc |
| `api/notifications/read-all` | POST | Đánh dấu tất cả đã đọc |
| `api/cron/reminders` | GET | Cron job: 4 reminder rules (cần CRON_SECRET) |
| `api/cron/marketing` | GET | Cron job: marketing auto-posts (cần CRON_SECRET) |
| `api/cron/auto-assign` | GET | Cron job: auto-assign staff to unassigned bookings |
| `api/generate-description` | POST | AI sinh mô tả dịch vụ |
| `api/generate-seo-article` | POST | AI sinh bài viết SEO |
| `api/generate-seo-image` | POST | AI sinh ảnh SEO |
| `api/ai-assist` | POST | AI assistant chat |
| `api/seo-search` | POST | Tìm kiếm từ khóa SEO |
| `api/blog/view` | POST | Track blog view (ip_hash, user_agent) |
| `sitemap.ts` | GET | Sitemap XML — blogs, services, seo_articles (with blog_slug) |

---

## 🔐 AUTH SYSTEM

### Cookie Session (tự custom, KHÔNG dùng Supabase Auth)

```
Cookie: session=<JWT>
├── httpOnly: true
├── secure: true (production)
├── sameSite: 'strict'
├── path: /
├── maxAge: 24h access + 7d refresh (sliding session)
└── payload: { user: { id, role, username }, expires }
```

### Luồng xác thực

```
Client → Login form → loginUser() server action
                        ├── Zod validation + rate-limit (5/min)
                        └── DB path: query users → check is_active → compare password_hash → createSession → redirect()

Mỗi request:
  proxy.ts (formerly middleware.ts)
    ├── Đọc cookie "session"
    ├── Decrypt JWT → nếu OK → re-encrypt với exp mới → set cookie (sliding session)
    ├── Nếu fail → redirect /login
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

### Login validation (app/login/actions.ts)
```
Zod schema: username (min 1), password (min 1)
Rate-limit: 5 attempts/min per username
No bypass logic — all auth through DB path
```

### JWT Secret
```
process.env.JWT_SECRET — REQUIRED in production (validates at startup)
```

### Error Logging
```
lib/logger.ts → logger.error() sends to Sentry in production
All server actions use logger.error() instead of console.error
All .catch(() => {}) replaced with logger.error()
All bare catch {} blocks log errors via logger
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
| `lockTimeSlots` | Function | Insert time_slot_locks + error logging |
| `unlockTimeSlots` | Function | Deactivate locks cho appointment + error logging |
| `unlockTimeSlotsInRange` | Function | Deactivate locks trong khoảng thời gian + error logging |
| `cascadeShiftForward` | Function | Dời lịch tới khi hoàn thành sớm + error logging |
| `handleCancelAndUnlock` | Function | Hủy + unlock + cascade + notif + error logging |
| `incrementSlotLimit` | Function | Tăng slot counter + error logging |
| `getSlotAvailabilityWithNames` | Function | Grid availability (dùng `durationMinutes` động) |

> **Error checking:** Tất cả functions đều check `{ error }` từ Supabase và log qua `logger.error()` → Sentry. Ngăn silent double-booking.

### Booking flow
```
1. Page load → getPublicServices() + getSlotAvailability(date, [], [])
2. Chọn ngày → getSlotAvailability(date, selectedServiceIds, services)
3. Click slot → getAvailableStaff(date, time, totalDuration) (Promise.all 3 queries)
4. Chọn staff + services → next step
5. Nhập SDT → checkCustomerHistory(phone) (Promise.all appointments+packages)
6. Xác nhận → submitBooking(formData) (Promise.all seoSettings+services+package)
   ├── Online → lockTimeSlots → insert → notifications
   └── Offline → enqueue vào IndexedDB → sync khi online
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

### insertNotification (utils/notifications.ts)
```
insertNotification(recipientType, recipientId, title, content, link)
  → Promise<{ success: boolean; error?: string }>
  → Logs errors via logger.error() → Sentry
  → Returns success/failure indicator (not void)
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

### Cron Routes (GET method)
```
api/cron/reminders    → GET (admin UI trigger hoặc pg_cron)
api/cron/marketing    → GET (admin UI trigger hoặc pg_cron)
api/cron/auto-assign  → GET (admin UI trigger hoặc pg_cron)
api/cron/seo-publish  → GET (admin UI trigger hoặc pg_cron)
Auth: CRON_SECRET Bearer token OR x-supabase-cron header
```

---

## ⚙️ CRITICAL CONFIG FILES

| File | Vai trò |
|------|---------|
| `database.sql` | **Source of truth** cho DB schema. Chạy 1 phát trên Supabase SQL Editor |
| `.env.local` | Chứa: SUPABASE_*, JWT_SECRET, GEMINI_API_KEY, VAPID_*, CRON_SECRET, UNSPLASH_ACCESS_KEY |
| `.env.example` | Mẫu các biến môi trường |
| `next.config.ts` | images.remotePatterns + logging.fetches (P4.3) |
| `proxy.ts` | Session refresh + route protection (Next.js 16, replaces middleware.ts) |
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
5. **AI** — Gemini-3.1-flash-lite (text), Gemini-2.5-flash-image (image). Fallback Unsplash
6. **Image** — Base64 → sharp (resize 1200px, WebP q80) → Supabase Storage
7. **Schedule Grid** — Ẩn cột giờ trống tự động
8. **Session** — Custom JWT cookie, middleware refresh mỗi request
9. **Login** — bcrypt hash (`lib/password.ts`), env-based bypass fallback for admin/staff1
10. **Booking** — `getSlotAvailabilityWithNames` với duration động theo services
11. **Realtime** — Subscribe `notifications` channel, polling fallback 5 phút
12. **Offline Queue** — IndexedDB `min-salon-queue`, auto-sync khi online + mỗi 30s
13. **Slot Lookup** — Dùng Map O(1) thay vì .find() O(n) trong MasterSchedule
14. **Date Cache** — Map<string, Data> cache cho MasterSchedule tránh re-fetch
15. **Blog Pagination** — `.range(from, to)` với `count: 'exact'`, 6 posts/page

---

## ⚠️ QUY CHẾ VẬN HÀNH (CYCLE PROTOCOL)

> **Chi tiết hơn:** Xem `PLAN.md` mục "QUY TẮC VẬN HÀNH & GIAO TIẾP"

1. **Đọc `UPGRADE_PLAN.md`** → Các mục chưa làm + ưu tiên
2. **Đọc `PLAN.md`** → Workflows + cycle protocol (nếu cần reference cũ)
3. **Đọc `AI_MAP.md`** → Kiến trúc, DB schema, quy tắc kỹ thuật
4. **Viết code** theo đúng kiến trúc
5. **Cập nhật `PLAN.md`** (dấu `[x]`) và **`AI_MAP.md`** sau mỗi thay đổi
6. **Commit** với message rõ ràng: `feat:`, `fix:`, `refactor:`
7. **Không push secrets** (.env.local, .env)

---

## 📊 TỈ LỆ PHỤC HỒI

| Thành phần | Bao phủ | Mất gì? |
|-----------|---------|---------|
| DB Schema | **~97%** | Thêm blog_views, blog_stats, ai_cache, rate_limits |
| Routes | **~95%** | Đã liệt kê tất cả routes + API endpoints + offline + blog-analytics |
| Auth | **~95%** | Cookie, JWT, middleware, bypass, override auth.getUser |
| Booking | **~95%** | Engine exports, flow, localStorage cache, offline queue, batch API |
| Notifications | **~90%** | Realtime + push + cron + offline queue sync |
| UI Components | **~50%** | Grid/List visual fixes, mobile hamburger, touch targets, OfflineIndicator, ViewTracker |
| Business Logic | **~75%** | Cron rules, offline queue, blog analytics, slot memoize, date cache |
| Dependencies | **100%** | package.json đầy đủ |

**Tỉ lệ phục hồi ước tính: ~85-90%**

Nếu mất source code, có thể tái thiết từ 2 file này + database.sql. Các phần bị thiếu: chi tiết UI layout, business logic xử lý edge cases, và 22 seed services trong database.sql.

---

## 🤖 HƯỚNG DẪN CHO AI MODEL

> Khi bắt đầu làm việc với project này, hãy thực hiện theo thứ tự:

### Step 1: Đọc 3 file chính
```
1. UPGRADE_PLAN.md → Các mục CHƯA LÀM + ưu tiên + hướng dẫn cụ thể
2. PLAN.md        → Tổng quan workflows cũ + cycle protocol (nếu cần)
3. AI_MAP.md       → File bạn đang đọc (kiến trúc, DB, routes, auth)
```

### Step 2: Hiểu cấu trúc project
```
app/
├── booking/          → Landing page + booking flow (public)
├── admin/            → Dashboard admin + 16 components
├── staff/            → Portal nhân viên
├── api/              → API routes (cron, auth, notifications...)
└── login/            → Trang đăng nhập

components/           → Shared UI components (SEO schema: WebSiteSchema, BreadcrumbSchema, BreadcrumbNav, ArticleSchema, GoogleTranslate, ServiceSchema, FaqSchema, AggregateRatingSchema, ProductSchema, ReviewCustomerModal)
lib/                  → Business logic (booking-engine.ts)
utils/                → Helpers (supabase, push, reminders)
scripts/              → DB migration + seed
```

### Step 3: Quy tắc khi code
| Quy tắc | Chi tiết |
|---------|----------|
| Không `SELECT *` | Luôn định rõ fields |
| Soft Delete | `is_active = false`, không DELETE |
| Session | Custom JWT cookie, không dùng Supabase Auth |
| Auth | Override `auth.getUser` trong `utils/supabase/server.ts` |
| Schema | Không sửa `database.sql`, tạo file migrate mới |

### Step 4: Sau khi code xong
```
□ Cập nhật UPGRADE_PLAN.md (đánh dấu [x])
□ Cập nhật AI_MAP.md (nếu thêm table/route/dependency)
□ Tạo migration file nếu cần ALTER TABLE
□ npm run lint
□ npm run build
□ Commit message rõ ràng
```

### Step 5: Đọc docs trước khi hỏi
```
docs/Log.md      → Lịch sử các phiên làm việc trước (biết đã làm gì)
docs/workflow.md → Sơ đồ quy trình nghiệp vụ (booking, notification, auth, v.v.)
```

### Step 6: Nếu cần help
- Thắc mắc về logic → Hỏi người dùng
- Không chắc về architecture → Đọc lại AI_MAP.md
- Muốn biết đã làm gì → Đọc UPGRADE_PLAN.md + AI_MAP.md + docs/Log.md
