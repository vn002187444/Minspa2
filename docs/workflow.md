# Quy trình Nghiệp vụ (Workflow Diagrams)

## 1. Booking Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Trang chủ   │────>│  Chọn ngày +     │────>│  Chọn khung giờ  │
│  /booking    │     │  dịch vụ         │     │  + nhân viên     │
└─────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                                                      v
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Xác nhận    │<────│  Nhập SĐT + tên   │<────│  Chọn gói/gọi    │
│  + đặt lịch  │     │  (check KH cũ)    │     │  dịch vụ lẻ     │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │
       ├── Online → lockTimeSlots → insert appointments → notification
       └── Offline → IndexedDB queue → sync khi online

Server actions:
  public.ts       → getPublicServices(), getSeoSettings(), getPackages()
  slots.ts        → getSlotAvailability(), getAvailableStaff()
  booking.ts      → submitBooking(), checkCustomerByPhone()
  customer.ts     → getCustomerHistory(), submitReview(), cancelBooking()
```

## 2. Auth Flow

```
┌──────────┐     ┌──────────────────┐     ┌────────────────┐
│  /login   │────>│  loginUser()      │────>│  createSession  │
│  page     │     │  server action    │     │  → JWT cookie   │
└──────────┘     └──────────────────┘     └────────────────┘
                                                   │
                                                   v
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  redirect /admin │<────│  proxy.ts        │<────│  Kiểm tra role  │
│  hoặc /staff     │     │  (mỗi request)   │     │  ADMIN/STAFF   │
└─────────────────┘     └──────────────────┘     └────────────────┘
                               │
                               v
                    ┌──────────────────────┐
                    │  Decrypt JWT → verify │
                    │  Re-encrypt + set     │
                    │  cookie (sliding)      │
                    └──────────────────────┘

Bypass login (dev):
  admin  → password 'Admin'  → redirect /admin
  staff1 → password 'Staff@1' → redirect /staff

DB path:
  query users → check is_active → bcrypt compare → createSession
```

## 3. Staff Portal Flow

```
┌──────────┐     ┌──────────────────┐     ┌────────────────┐
│  /staff   │────>│  Check-in/out     │────>│  Xem lịch cá    │
│  portal   │     │  (attendance)     │     │  nhân hôm nay   │
└──────────┘     └──────────────────┘     └────────────────┘
                                                 │
                                                 v
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Cập nhật       │<────│  Xử lý booking   │<────│  Danh sách      │
│  trạng thái      │     │  (nhận/từ chối)  │     │  việc cần làm   │
│  (IN_PROGRESS,   │     └──────────────────┘     └────────────────┘
│   COMPLETED)     │
└─────────────────┘
       │
       v
┌──────────────────────┐
│  Trừ buổi liệu trình   │
│  (deduct_package_     │
│   session RPC)        │
└──────────────────────┘
```

## 4. Admin Dashboard Flow

```
┌──────────┐     ┌──────────────────────────────────┐
│  /admin   │────>│  Dashboard tổng quan              │
│           │     │  - Doanh thu (chart recharts)     │
│           │     │  - Lịch hẹn hôm nay              │
│           │     │  - Staff online/offline          │
└──────────┘     └──────────────────────────────────┘
       │
       ├── /admin/schedule      → MasterSchedule (grid + list)
       ├── /admin/customers     → CRM (lịch sử, gói, đánh giá)
       ├── /admin/blog          → Quản lý bài viết SEO
       ├── /admin/seo-articles  → Bài viết SEO tự động
       ├── /admin/orders        → Gói liệu trình đã bán
       ├── /admin/blog-analytics→ Thống kê blog views
       └── /admin/audit-logs    → Nhật ký thao tác
```

## 5. Notification Flow

```
┌──────────────────┐
│  Sự kiện phát sinh│
│  - Đặt lịch       │
│  - Hủy lịch       │
│  - Nhắc việc      │
│  - Marketing      │
└────────┬─────────┘
         │
         v
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Ghi notifications│────>│  Realtime channel  │────>│  NotificationBell│
│  table (INSERT)   │     │  (Supabase Realtime)│     │  (client)       │
└──────────────────┘     └──────────────────┘     └────────────────┘
         │
         v
┌──────────────────┐     ┌──────────────────┐
│  Push notification│────>│  web-push (VAPID) │
│  (nếu có token)   │     │  → Service Worker │
└──────────────────┘     └──────────────────┘

Cron reminders (/api/cron/reminders):
  Rule 1: Attendance reminder (chưa điểm danh sáng)
  Rule 2: Random booking reminder (chưa nhận lịch)
  Rule 3: Unaccepted booking reminder
  Rule 4: Uncompleted booking reminder
```

## 6. SEO / Content Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Admin tạo bài    │────>│  AI assist:      │────>│  Sinh image     │
│  viết thủ công    │     │  writeArticle,   │     │  + alt text     │
│  (/admin/blog)    │     │  suggestImages   │     │  (Gemini)       │
└──────────────────┘     └──────────────────┘     └────────────────┘
                                                          │
                                                          v
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Sitemap.xml      │<────│  Blog detail      │<────│  Lưu bài viết   │
│  (blogs, services,│     │  + Schema JSON-LD │     │  + image_alt    │
│   seo_articles)   │     │  + OG meta        │     │  + OG image     │
└──────────────────┘     └──────────────────┘     └────────────────┘

SEO articles (/admin/seo-articles):
  1. AI sinh bài (topic → article) → status=draft
  2. Review + edit → publish → chuyển thành blog post

Schema components:
  WebSiteSchema       → layout.tsx (global)
  BreadcrumbSchema    → blog list, blog detail, booking
  ArticleSchema       → blog detail (BlogPosting)
  ServiceSchema       → home page (ItemList → Service)
  ProductSchema       → home page (Product)
  AggregateRatingSchema → layout.tsx (avg rating từ reviews)
  FaqSchema           → home page (FAQ accordion)
```

## 7. Image Processing Flow

```
┌──────────┐     ┌──────────────────┐     ┌────────────────┐
│  Upload   │────>│  Base64 decode    │────>│  sharp resize    │
│  (file    │     │                   │     │  1200px WebP    │
│   input)  │     │                   │     │  quality 80     │
└──────────┘     └──────────────────┘     └────────────────┘
                                                 │
                                                 v
                                       ┌──────────────────┐
                                       │  Supabase Storage │
                                       │  (seo-images bucket│
                                       │   public, 5MB max)│
                                       └──────────────────┘

AI image generation:
  Gemini-2.5-flash-image → generate image
  googleSearch tool → real Unsplash results (URL|ALT format)
  Fallback: gemini-2.0-flash-exp-image-generation (deprecated)
```

## 8. Offline Queue Flow

```
┌──────────────────┐
│  Client online?   │
│  (navigator.onLine)│
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    v         v
┌────────┐  ┌──────────────────────┐
│ Gửi    │  │ Lưu vào IndexedDB    │
│ request│  │ (min-salon-queue)    │
│ ngay   │  │ ┌─────────────────┐  │
└────────┘  │ │ { method, url,  │  │
            │ │   body, headers }│  │
            │ └─────────────────┘  │
            └──────────┬───────────┘
                       │
                       v
              ┌──────────────────┐
              │ online event →    │
              │ process queue     │
              │ (mỗi 30s poll)   │
              └──────────────────┘

Booking types hỗ trợ offline:
  - getPublicServices() (cache)
  - getSlotAvailability() (cache)
  - submitBooking() (queue)
```

## 9. Package / Treatment Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Admin tạo gói    │────>│  Customer mua     │────>│  Gói ACTIVE     │
│  treatment_       │     │  gói → insert     │     │  remaining_     │
│  packages         │     │  customer_        │     │  sessions > 0   │
└──────────────────┘     │  packages         │     └────────────────┘
                         └──────────────────┘            │
                                                         v
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Staff dùng gói   │<────│  Booking COMPLETED│<────│  Chọn "Dùng gói"│
│  khi booking      │     │  + có gói active  │     │  trong form     │
│  (deduct RPC)     │     │                   │     │  staff portal   │
└──────────────────┘     └──────────────────┘     └────────────────┘
       │
       v
┌─────────────────────────────────────┐
│  package_usage_logs (ghi nhật ký)   │
│  → remaining_sessions--             │
│  → EXHAUSTED nếu hết               │
└─────────────────────────────────────┘
```

## 10. Admin SEO Articles → Blog Publishing Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  AI sinh bài SEO  │────>│  Lưu vào          │────>│  Review + edit  │
│  (/api/generate-  │     │  seo_articles     │     │  (admin form)   │
│   seo-article)    │     │  status=draft     │     │                 │
└──────────────────┘     └──────────────────┘     └────────────────┘
                                                          │
                                                          v
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Blog post        │<────│  Publish →        │<────│  Chỉnh sửa lần  │
│  hiển thị public  │     │  insert into      │     │  cuối           │
│  + sitemap        │     │  blogs + set      │     │                 │
│                   │     │  blog_slug        │     │                 │
└──────────────────┘     └──────────────────┘     └────────────────┘
```
