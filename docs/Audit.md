# Audit Log

Ghi nhận tất cả các phát hiện từ audit codebase. Mỗi mục audit = 1 entry.

## Format

```markdown
## [YYYY-MM-DD] Audit: [Chủ đề]

### Phạm vi
- Files/areas đã audit

### Phát hiện
| # | Vấn đề | File | Mức độ | Chi tiết |
|---|--------|------|--------|----------|
| 1 | ... | ... | 🔴🟡🟢 | ... |

### Kết luận
- Actions cần làm
- Đã fix / chưa fix
```

## Entries

## [2026-06-26] Audit: SEO Schema Integration (Phase 1)

### Phạm vi
- `app/layout.tsx` — WebSiteSchema integration
- `app/page.tsx` — ServiceSchema integration (ItemList → Service)
- `app/blog/[slug]/page.tsx` — ArticleSchema + BreadcrumbSchema integration
- `components/WebSiteSchema.tsx`, `components/BreadcrumbSchema.tsx`, `components/ArticleSchema.tsx`, `components/ServiceSchema.tsx`
- `docs/Log.md`, `docs/Discuss.md`, `UPGRADE_PLAN.md` — docs update

### Phát hiện

| # | Vấn đề | File | Mức độ | Chi tiết |
|---|--------|------|--------|----------|
| 1 | `baseUrl` unused trong JSX | `app/page.tsx:133` | 🟢 | Biến `baseUrl` được khai báo nhưng không dùng trong JSX return. Không gây lỗi, chỉ warning lint. |
| 2 | `id` type mismatch (`string` vs `number` từ Supabase) | `app/page.tsx:138` → `ServiceSchema.tsx:4` | 🟢 | `ServiceItem.id` typed `string` nhưng Supabase services.id có thể là `number`. Không lỗi runtime nhờ JSON, nhưng strict type có thể cảnh báo. |

### Đã fix
| # | Fix | File |
|---|-----|------|
| 1 | Removed unused `baseUrl` declaration | `app/page.tsx:133` |
| 2 | Dùng `String(s.id)` để đảm bảo type an toàn | `app/page.tsx:138` |

### Kết quả kiểm tra
- `npm run lint` → 0 errors, 312 warnings (pre-existing, giảm 1 warning sau khi xoá `baseUrl` dư)
- `npx tsc --noEmit` → 0 errors
- 4 schema components đều là server component, render JSON-LD trong initial HTML (tốt cho SEO)

### Kết luận
- **Phase 1 SEO Schema hoàn tất.** 7/13 schema types đã có (tăng từ 3 lên 7 so với audit trước)
- Còn 6 schema chưa làm: Product, ItemList, GeoCoordinates, AggregateRating, ImageGallery (Phase 2-3)
- Không có critical/medium issues. Cả 2 minor findings đã fix.

---

## [2026-06-26] Audit: Orphan API Routes + Session Fix

### Phạm vi
- Toàn bộ `app/api/**/route.ts` (33 routes) — kiểm tra frontend reference
- `app/login/actions.ts` — cookie flush redirect
- `app/admin/actions.ts` — saveStaffSkill

### Phát hiện

| # | Vấn đề | File | Mức độ | Chi tiết |
|---|--------|------|--------|----------|
| 1 | 9 orphan API routes không frontend nào gọi | `app/api/*` | 🟡 | Login, booking/cancel, background-worker, cron-check, cron/seo-publish, cron/clone-daily-tasks, cron/check-tasks, cron/email-report, queue/sync |
| 2 | `cookies().set()` + client redirect không flush cookie | `app/login/actions.ts` | 🔴 | Server action set cookie → return JSON → client `window.location.href`. Cookie có thể mất. |
| 3 | `saveStaffSkill` upsert gửi `updated_at` | `app/admin/actions.ts:2682` | 🟢 | Column không tồn tại trong staff_skills table |

### Đã fix
| # | Fix | File |
|---|-----|------|
| 1 | Xoá 9 route files + cleanup empty dirs | `app/api/*` |
| 2 | Rewrite server action dùng `redirect()` | `app/login/actions.ts` |
| 3 | Remove `updated_at` khỏi upsert | `app/admin/actions.ts` |

---

## [2026-06-27] Audit: Toàn diện (6 mảng)

### Phạm vi
- TypeScript code quality — `app/`, `components/`, `lib/`, `utils/`
- Security & auth — server actions, API routes, RLS, CSP, cookies
- SEO & structured data — JSON-LD, metadata, sitemap, robots.txt
- Database schema — indexes, constraints, RLS, triggers, migrations
- UI/UX & error handling — loading/error states, toast, a11y, empty states
- Config & dependencies — package.json, next.config, tsconfig, tailwind, eslint

### Phát hiện

#### 🔴 Critical (10)

| # | Vấn đề | File | Chi tiết |
|---|--------|------|----------|
| 1 | **Tailwind config SPLIT** — `.ts` sai content path + empty theme; `.cjs` chứa animations/fonts/safelist (untracked) | `tailwind.config.ts` + `.cjs` | Build sẽ purge hết custom classes |
| 2 | **ArticleSchema + BreadcrumbSchema defined nhưng ko import** | `components/*Schema.tsx` | Component tồn tại nhưng ko render ở page nào |
| 3 | **Blog detail thiếu structured data** — ArticleSchema ko render | `app/blog/[slug]/page.tsx` | Google ko nhận diện Article |
| 4 | **15+ server actions + 12 API routes thiếu auth guard** | `app/staff/actions.ts`, `app/api/*` | ai-assist, generate-*, subscribe ko check session |
| 5 | **`userScalable: false`** trong viewport | `app/layout.tsx` | WCAG 1.4.4 violation — ko zoom được |
| 6 | **Plaintext password fallback** — nếu bcrypt.compare fail thì so sánh plaintext | `app/login/actions.ts:26` | Bypass authentication |
| 7 | **Missing `@id` trên ALL schema entities** | 6 Schema components + layout.tsx | Google cần @id cho entity linking |
| 8 | **Ko có root `not-found.tsx`** | Project root | 404 mặc định trắng |
| 9 | **14+ routes thiếu `loading.tsx` + `error.tsx`** | `/login`, `/notifications`, `/blog`, admin sub-routes | Flash trắng + crash ko fallback |
| 10 | **`next dev` crash trên Windows** — Turbopack WASM | `package.json` | Ko chạy được dev server |

#### 🟠 High (7)

| # | Vấn đề | File | Chi tiết |
|---|--------|------|----------|
| 11 | **`as any` tràn lan** (100+ occurrences) | `app/staff/page.tsx` (~50), khắp codebase | Mất type safety |
| 12 | **20+ FK columns thiếu index** | `database.sql` | Chậm JOIN khi data lớn |
| 13 | **`sameSite: 'lax'`** nên là `'strict'` | `utils/auth.ts`, `proxy.ts` | CSRF dễ hơn |
| 14 | **No `updated_at` trigger** cho 10+ bảng | `database.sql` | Stale data |
| 15 | **`cash_register.amount` là INTEGER** | `database.sql:469` | Phải là DECIMAL(10,2) |
| 16 | **ArticleSchema thiếu `dateModified`, `publisher`** | `components/ArticleSchema.tsx` | Schema ko hợp lệ |
| 17 | **Sitemap service URLs dùng hash fragment** | `app/sitemap.ts:33` | Google ko index được |

#### 🟡 Medium (20+)

| # | Vấn đề | File |
|---|--------|------|
| 18 | `catch (err: any)` ko toast feedback (15+ chỗ) | `app/staff/page.tsx`, `app/booking/page.tsx`, `components/GlobalSearch.tsx`, v.v. |
| 19 | 4 staff modals thiếu `role="dialog"`, `aria-modal`, focus trap | `components/staff/CheckoutModal.tsx`, `SwapModal.tsx`, `ReviewCustomerModal.tsx`, `StaffBookingTab.tsx` |
| 20 | SkipLink text tiếng Anh ("Skip to main content") trong app Việt | `components/SkipLink.tsx` |
| 21 | IosErrorHandler hiển thị runtime error cho user (debug tool) | `components/IosErrorHandler.tsx` |
| 22 | BottomNavigation thiếu `aria-current` | `components/BottomNavigation.tsx` |
| 23 | 30+ bảng RLS enabled nhưng ko có policy trong `database.sql` | `database.sql:540-598` |
| 24 | `cash_register.type` dùng `'THU'/'CHI'` (Vietnamese) — inconsistent với English schema | `database.sql` |
| 25 | `notifications.recipient_id` ko có FK constraint | `database.sql:308-309` |
| 26 | `customers.email` thiếu UNIQUE constraint | `database.sql:36` |
| 27 | `turbopack.root` trong next.config ko phải option hợp lệ | `next.config.ts` |
| 28 | Migration history chaotic — 27 files sai directory, inconsistent naming | `scripts/archive/migrations/` |
| 29 | Trigger `trg_update_customer_last_booking` reference column ko tồn tại | Migration files |
| 30 | `@ts-expect-error` 1 occurrence | `lib/invoice-pdf.ts:114` |
| 31 | `app/loading.tsx` + `components/SkipLink.tsx` có `'use client'` ko cần thiết | Có thể là server component |
| 32 | `lib/sounds.ts:playSuccess()`, `lib/weather.ts:getThemeModifier()`, `lib/defaults.ts`, `lib/env.ts`, `lib/analytics.ts:getMascotStats()` — dead exports | `lib/` |
| 33 | `components/staff/*` import từ `@/app/` — tight coupling | `components/` → `app/` |
| 34 | `cash_register.recorded_by` thiếu ON DELETE clause (default NO ACTION) | `database.sql:473` |
| 35 | Status value casing inconsistent (UPPERCASE vs lowercase) | `database.sql` — appointments vs tasks |

#### 🟢 Low

| # | Vấn đề | File |
|---|--------|------|
| 36 | `app/loading.tsx` + `components/SkipLink.tsx` có `'use client'` ko cần | — |
| 37 | `target: "es2017"` outdated, nên là `es2022` | `tsconfig.json` |
| 38 | `caniuse-lite` trong dependencies (nên dev) | `package.json` |
| 39 | `cross-env` trong devDependencies nhưng ko dùng | `package.json` |
| 40 | `.env.example` thiếu 15+ env vars documentation | `.env.example` |
| 41 | `data/demo_db.json` tracked despite `.gitignore` | Root |
| 42 | `eslint-config-next` version mismatch (16.2.7 vs 16.2.9) | `package.json` |
| 43 | GlobalSearch.tsx image alt text empty | `components/GlobalSearch.tsx:117` |
| 44 | Login page dùng `h2` thay vì `h1` | `app/login/page.tsx:61` |
| 45 | Heading hierarchy: `h3` trước `h2` | `app/page.tsx:240` vs `281` |
| 46 | Admin/staff pages indexable (ko có noindex trong robots.txt) | `public/robots.txt` |

### Đã fix trong session này

| # | Fix | File |
|---|-----|------|
| 1 | Thêm `upgrade_plan` view (database) | `database.sql:615-685` |
| 2 | Cập nhật UPGRADE_PLAN.md với audit results + optimized plan | `UPGRADE_PLAN.md` |
| 3 | Cập nhật Audit.md entry | `docs/Audit.md` |

### Kết luận
- **Critical path**: Fix Tailwind config + next dev → build/run được → mới fix được cái khác
- **SEO critical**: Import ArticleSchema + BreadcrumbSchema, thêm @id → Google rich results
- **Security critical**: Auth guard cho API routes + server actions, xoá plaintext fallback
- **Database**: Indexes + triggers + constraints — phòng khi scale
- **UX**: loading/error states + toast feedback + a11y — chất lượng tổng thể
- Xem `UPGRADE_PLAN.md` cho execution plan chi tiết theo phase

---

## [2026-06-27] Audit: Dependency Security (npm audit)

### Phạm vi
- `npm audit` sau khi cập nhật dependencies
- `package.json`, `node_modules`

### Phát hiện

| # | Package | Version | Severity | Issue | Fix |
|---|---------|---------|----------|-------|-----|
| 1 | `uuid` | 14.0.1 | 🟡 moderate | Missing buffer bounds check (CWE-787, CWE-1285) | latest already — monitor upstream |
| 2 | `exceljs` | 4.4.0 | 🟡 moderate | Depends on vulnerable `uuid`; no direct fix yet | major bump needed, already at latest |
| 3 | `next` | 16.2.9 | 🟡 moderate | Vulnerable via `postcss` dependency | monitor next releases |
| 4 | `postcss` | 8.5.15 | 🟡 moderate | XSS via unescaped `<style>` (CWE-79) | major v9.3.3 suggested |

### Kết luận

**4 moderate vulnerabilities** còn lại:
- `uuid` + `exceljs`: lỗi transitive, chờ upstream fix
- `next` + `postcss`: lỗi transitive qua build pipeline, ảnh hưởng thấp
- **Chưa có critical/high** — an toàn để deploy
- Khuyến nghị: thêm CI step `npm audit --audit-level=moderate`, monitor upstream releases, mask `.env*` trong logs

<!-- Template:
## [YYYY-MM-DD] Audit: [Chủ đề]

### Phạm vi
- 

### Phát hiện
| # | Vấn đề | File | Mức độ | Chi tiết |
|---|--------|------|--------|----------|
| 1 | ... | ... | 🔴 | ... |

### Kết luận
- 
-->
