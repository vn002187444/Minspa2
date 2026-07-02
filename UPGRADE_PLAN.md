# 🚀 KẾ HOẠCH NÂNG CẤP (UPGRADE_PLAN)
 
> **Tất cả các task chính đã hoàn thành.** Xem chi tiết tại `PLAN.md` → section **UPGRADE_PLAN — Code Quality Audit**
 
---
 
## 📋 Các mục CHƯA LÀM (UNDONE)
 
*Không còn mục nào — audit code quality 100% complete.*
 
---
 
---
 
## 📱 Phase 9 — Mobile UI/UX Audit & Fix

*Audit 24 files (homepage → admin → staff → components) — xem chi tiết trong PLAN.md section 11.*

### 🔴 HIGH ✅ (17/17 items — đã implement)

| # | File | Dòng | Vấn đề | Fix | Status |
|---|------|------|--------|-----|--------|
| 1 | `layout.tsx` | 37 | `viewportFit: "cover"` nhưng body không safe-area padding | `env(safe-area-inset-*)` trên body | ✅ |
| 2 | `page.tsx` | 168,276,607 | Touch target dưới 44px | `min-h-[44px]` | ✅ |
| 3 | `HeaderNav.tsx` | 118-133 | Menu mobile không focus trap | `min-h-[44px]` + items flex | ✅ |
| 4 | `HeaderNav.tsx` | 136 | Thiếu `aria-expanded` trên hamburger | `aria-expanded={mobileMenuOpen}` | ✅ |
| 5 | `BottomNavigation.tsx` | 57,77 | Label `text-[10px]` — quá nhỏ | `text-[11px]` | ✅ |
| 6 | `login/page.tsx` | 82 | Nút Auto-Fill `opacity-0` trên mobile | `md:opacity-0 md:group-hover:opacity-100` | ✅ |
| 7 | `booking/page.tsx` | 1014-1062 | Sticky invoice `bottom-16` đè bottom nav | `bottom: calc(4rem + env(safe-area-inset-bottom))` | ✅ |
| 8 | `staff/page.tsx` | 716 | Bottom nav thiếu safe-area-bottom | `env(safe-area-inset-bottom)` | ✅ |
| 9 | `staff/page.tsx` | 743 | Label `text-[10px]` staff bottom nav | `text-[11px]` | ✅ |
| 10 | `BookingCalendar.tsx` | 125 | Time slot `py-2.5` — ~34px | Đã có `min-h-[44px]` từ trước | ✅ |
| 11 | `AppointmentLookup.tsx` | 608,634 | Progress timeline `text-[10px]` | `text-[11px]` | ✅ |
| 12 | `MasterSchedule.tsx` | 435 | DnD không hoạt động trên mobile | Thêm `TouchSensor` | ✅ |
| 13 | `TabStaff.tsx` | 296-318 | Action button touch target <20px | `min-h-[44px]` + `px-3 py-2` | ✅ |
| 14 | `TabServices.tsx` | 139,149,156 | Toggle/badge/action quá nhỏ | `min-h-[44px]` + `px-3 py-1.5` | ✅ |
| 15 | `TabTasks.tsx` | 92 | 5-cột stats grid quá chật | `grid-cols-2 sm:grid-cols-5` | ✅ |
| 16 | `TabReports.tsx` | 259 | Export dropdown broken trên mobile | Thêm `group-focus-within:block` | ✅ |
| 17 | `admin/page.tsx` | 235 | Header fixed thiếu safe-area-top | `env(safe-area-inset-top)` | ✅ |

### Cập nhật Menu (mới)
- **BottomNavigation admin**: Giảm xuống 4 items (Tổng Quan, Đơn Hàng, Lịch Tổng, Menu) + hamburger mở drawer
- **Admin drawer**: Gom nhóm "Cấu Hình" thành collapsible accordion (mặc định đóng)
- **Homepage**: Sửa link "Dịch Vụ" → `/#services`
- **BottomNavigation**: Thêm prop `onMenuClick` cho admin drawer integration

### 🟡 MEDIUM (~40 items — đợt 2 ✅)

**Đã implement (build thành công, 0 lỗi TypeScript):**
| Item | Chi tiết | Files |
|------|----------|-------|
| `text-[10px]` → `text-[11px]` | Trên buttons, badges, interactive elements | ~20 files (staff, booking, blog, admin components, shared components) |
| `py-1.5`/`py-2` buttons → `py-2.5` + `min-h-[44px]` | Touch target ≥44px | ~18 files (TodayMonitoringWidget, TabReports, TabFAQ, TabPayroll, TabSettings, blog toolbar, etc.) |
| Mobile card fallback | `md:hidden` cards thay table trên mobile | `TabStaff.tsx`, `TabServices.tsx`, `TabAttendance.tsx`, `CustomerCRM.tsx` |
| Skeleton loading | Thêm `isLoadingServices` + skeleton grid | `booking/page.tsx` |
| Search inputs `py-2` | `min-h-[44px]` | `TabCommission.tsx`, `TabPayroll.tsx`, `TabReports.tsx` |
| `prefers-reduced-motion` | CSS media query | `globals.css` — disable animation khi user yêu cầu |
| `xs:` breakpoint | 480px | `tailwind.config.ts` |

### Còn lại (ưu tiên thấp, không critical):
- `text-[10px]` còn trên non-interactive (timestamps, section subtitles, table headers, decorative labels) — giữ nguyên vì phù hợp
- Filter chips `px-3 py-1.5` — **Đã rà soát và fix toàn bộ 7 chỗ interactive còn lại lên chuẩn `min-h-[44px]`** ✅
- Tables khác (staff master schedule, payroll) — payroll đã có fallback, master schedule dùng viewType toggle rất tốt.

---

## 📝 Ghi chép

- Tasks Phase 1–8 (build, schema, auth, DB, UX, chore, lint, `as any`) → `PLAN.md`
- Phase 9 (Mobile UI/UX) — **HIGH + MEDIUM items đã implement xong**
- Quy tắc migration & PgBouncer-safe patterns: `PLAN.md` section 10
- Audit session persistence: `proxy.ts` đã đúng tên (Next.js 16), fix `sameSite: 'lax'` + `maxAge` + home page redirect + dead code `layout.tsx` + audit_logs re-export
- **Fix HTML Hydration Error**: Di chuyển `<Toaster />` từ `<head>` vào đầu thẻ `<body>` trong `app/layout.tsx` ✅
- **Staff Mobile Navigation Upgrade**: Nâng cấp thanh Bottom Navigation trên di động của Staff Portal từ dạng danh sách dàn trải thiếu hụt (thiếu Đặt lịch hộ, Bán gói, Đổi mật khẩu) sang cấu trúc **4 nút hành vi chính + 1 nút Menu** tích hợp **collapsible Drawer Menu** (bằng Framer Motion) giúp Staff trên điện thoại sử dụng được 100% chức năng như trên Desktop ✅
 
## 🛠️ Phase 10 — Final Polish & Performance
 
### ✅ Đã hoàn thành
- **Tối ưu hiệu năng (Performance)**:
  - Cài đặt Dynamic Import cho các component nặng: `BottomNavigation`, `BookingCalendar`, `BookingMascotGuide`, `GlobalSearch`, `HeaderNav`.
  - Tách bundle `motion/react` ra khỏi critical path bằng cách lazy-load `MascotProvider` trong layout.
  - Defer (trì hoãn) load script Google Translate cho đến khi người dùng tương tác.
  - Thêm `optimizePackageImports` cho `lucide-react`, `date-fns`, `motion` trong `next.config.ts`.
  - Thêm thuộc tính `priority` cho logo trong Header để cải thiện LCP.
- **Fix Google Translate**:
  - Thay thế widget mặc định bằng Custom Dropdown UI.
  - Sử dụng URL `translate.googleapis.com` để tránh lỗi redirect.
  - Fix domain cho cookie `googtrans` để hoạt động ổn định trên Vercel Preview/Production.
- **Fix Lỗi Font (Unicode Normalization)**:
  - Triển khai chuẩn hóa NFC cho toàn bộ dữ liệu fetch từ Supabase thông qua `lib/cache.ts`, fix lỗi tách dấu tiếng Việt.
- **Tự động hóa Auto SEO**:
  - Chuyển trigger từ Vercel Cron $\rightarrow$ Supabase Cron (`pg_cron` + `pg_net`).
  - Thêm tham số `?force=1` cho API route để trigger đăng bài thủ công.
- **Sửa lỗi điều hướng**: Sửa link `/admin/seo_articles` $\rightarrow$ `/admin/seo-articles`.
- **Kiểm tra chất lượng cuối**: 0 Lint warnings, 0 Type errors, Build successful.
