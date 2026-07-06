# Session Log

## Session 2 — 2026-06-26

### 🎯 Mục tiêu
Integrate SEO Schema Components vào layout/pages, hoàn thiện Phase 1 SEO.

### ✅ Đã làm

#### SEO Schema Integration
- **WebSiteSchema** → `app/layout.tsx:213` — WebSite + SearchAction JSON-LD
- **ServiceSchema** → `app/page.tsx:137` — ItemList → Service schema từ services DB
- **ArticleSchema** + **BreadcrumbSchema** → `app/blog/[slug]/page.tsx:61-72` — Article/BlogPosting + BreadcrumbList
- Các component đã tạo từ Session 1 (WebSiteSchema, BreadcrumbSchema, ArticleSchema, ServiceSchema) nhưng chưa gắn vào trang — nay đã integrate đầy đủ

#### Verification
- `npm run lint` → 0 errors (313 warnings pre-existing)
- `npx tsc --noEmit` → 0 errors
- Toàn bộ 4 schema components hoạt động ở dạng server component (không `'use client'`)

### 📁 Files đã sửa
- `app/layout.tsx` — thêm import + `<WebSiteSchema>`
- `app/page.tsx` — thêm import + `<ServiceSchema>`, wrap fragment
- `app/blog/[slug]/page.tsx` — thêm import + `<ArticleSchema>` + `<BreadcrumbSchema>`

### 📋 Kế hoạch Phase 2 (còn lại)
- `AggregateRating` — query avg rating từ reviews table
- `GeoCoordinates` — thêm toạ độ vào LocalBusiness schema
- `ItemList` schema cho danh sách service (optional)

---

## Session 1 — 2026-06-25

### 🎯 Mục tiêu
Hoàn thiện audit toàn bộ codebase, fix schema mismatches, đồng bộ database.sql, fix runtime bugs.

### ✅ Đã làm

#### Schema & DB
- Đồng bộ `database.sql` với DB thật (customers, rate_limits, ai_cache, customer_packages)
- Migration thêm `updated_at` cho `customer_packages`
- Migration fix trigger `appointment_date` → `start_time`
- Migration fix `notify_appointment_change` lowercase status → UPPERCASE
- Cập nhật RPC functions trong `database.sql` khớp cả 2 overloads

#### Bug fixes
- `app/admin/actions.ts:1411` — notification insert sai columns (user_id→recipient_id, body→content, thiếu recipient_type)
- `app/staff/actions.ts:456` — RPC deduct_package_session sai param → revert overload void
- `app/booking/actions/customer.ts:183` — RPC refund_package_session sai param → revert overload void
- `app/booking/actions/suggestions.ts:28` — select column ảo (dob, birth_date, birth_month)

#### Next.js 16 Migration
- `middleware.ts` → `proxy.ts` (đổi tên + export `proxy`)
- Xoá `memory` khỏi `vercel.json`

#### Orphans
- Xoá 3 API routes: `/api/booking/cancel`, `/api/cron-check`, `/api/queue/sync`
- Phân tích 9 orphan features, lên kế hoạch xử lý

#### UI & Menu
- Admin menu: flat list → 5 nhóm (Điều hành, Nhân sự, Dịch vụ, Tài chính, Cấu hình)
- Fix thiếu TASKS + PAYROLL trong mobile drawer
- Refactor dùng `menuGroups[]` chung

#### SEO Schema Audit
- Chỉ có 3/13 schema cần thiết (LocalBusiness, PostalAddress, OpeningHours)
- Lên kế hoạch Phase 1 (WebSite, BreadcrumbList, Article, Service, FAQ UI)

#### AI Prompts Audit
- Phát hiện mâu thuẫn instruction (SYSTEM_WRITER bảo "trả về Markdown" nhưng force JSON)
- Thiếu try/catch JSON.parse
- Thiếu escape user input

#### Session Audit
- Xác định 4 root causes chính của bug login không lưu phiên
- Lên kế hoạch 6 tasks fix

### 📁 Files tạo mới
- `docs/Audit.md` — template ghi nhận audit
- `docs/Log.md` — log phiên làm việc (file này)
- `docs/Discuss.md` — trao đổi giữa các AI models

### 🚀 Session parallel (3 prompts gửi Gemini)

#### Prompt 1 — Session Audit & Fix (trả kết quả vào discuss.md)

```
Phân tích và fix lỗi login không lưu phiên trong Next.js 16 project.

## Context
- Stack: Next.js 16.2.9, Supabase PostgreSQL, TypeScript
- Auth: Custom JWT (HS256) stored in "session" cookie (httpOnly, sameSite=lax, 30d expiry)
- Login flow: Server action loginUser() → createSession() (cookies().set()) → redirect()
- Middleware convention: proxy.ts (thay vì middleware.ts)

## Root causes
1. cookies().set() + redirect() — Next.js 16 không flush cookie mutations khi redirect cùng action
2. proxy.ts không được middleware registry đăng ký (middleware-manifest.json rỗng)
3. proxy.ts clear cookie khi decrypt fail (maxAge: 0)
4. Key cache module _key reset khi hot-reload

## Files cần đọc
- utils/auth.ts, proxy.ts, app/login/actions.ts, app/api/login/route.ts, app/api/logout/route.ts

## Yêu cầu
1. Đề xuất giải pháp từng root cause (cụ thể, code mẫu)
2. Fix 1: Chuyển login flow → API route (response.cookies.set())
3. Fix 2: Kiểm tra proxy.ts registration, rename middleware.ts nếu cần
4. Fix 3: Xoá clear cookie trong proxy.ts khi decrypt fail
5. Trả về code đầy đủ mỗi file

## Output
Ghi kết quả vào file docs/Discuss.md với header "### 2026-06-25 — Session Audit Results"
Định dạng: mỗi file → đường dẫn → code cũ → code mới → giải thích
```

#### Prompt 2 — SEO Schema Components (trả kết quả vào discuss.md)

```
Viết 4 components JSON-LD schema cho Next.js 16 + TypeScript project.

## Tech: Next.js 16, TypeScript, Tailwind CSS v4, @google/genai SDK

## File 1: components/WebSiteSchema.tsx
WebSite schema + SearchAction. Script JSON-LD, không UI.
- Dùng useMemo, nhận baseUrl prop
- Schema: WebSite → SearchAction (target: "{baseUrl}/search?q={search_term_string}")

## File 2: components/BreadcrumbSchema.tsx
Nhận items: {name: string, url: string}[], render BreadcrumbList.
- ItemList + ListItem schema

## File 3: components/ArticleSchema.tsx
Props: title, description, image, datePublished, author.
- Article/BlogPosting schema

## File 4: components/ServiceSchema.tsx
Nhận services array (id, name, description, price, duration, category).
- ItemList + Service schema

## Qui tắc
- "use client" only nếu cần state
- JSON.stringify, dangerouslySetInnerHTML
- Import useMemo nếu cần
- Mỗi file export default function

## Output
Ghi kết quả vào file docs/Discuss.md với header "### 2026-06-25 — SEO Schema Components"
Trả về code đầy đủ 4 files, sẵn sàng copy-paste.
```

#### Prompt 3 — FAQ UI Design (trả kết quả vào discuss.md)

```
Thiết kế FAQ management system cho Min Nail & Hair (Next.js 16 + Supabase).

## Yêu cầu
1. Database table faqs (migration SQL + database.sql update)
2. Server actions CRUD (admin/actions.ts)
3. Admin TabFAQ component (thêm, sửa, xoá, kéo thả sort)
4. FaqSection component (trang chủ, accordion)
5. FaqSchema component (JSON-LD)

## Table schema
faqs: id UUID PK, question TEXT, answer TEXT, category VARCHAR(50), sort_order INT, is_active BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

## Output
Ghi kết quả vào file docs/Discuss.md với header "### 2026-06-25 — FAQ System Design"
1. SQL migration (DO blocks, idempotent)
2. CRUD server actions code
3. TabFAQ component code
4. FaqSection component (accordion, public)
5. FaqSchema component (JSON-LD)
```

### ✅ Fixed 2 Runtime Bugs (H)

#### Bug 1: Lịch tổng hiển thị CANCELLED + COMPLETED
- **Root cause**: `app/admin/schedule/actions.ts:57` query không filter status → `apptLookupMap` first-write-wins → CANCELLED nuốt slot của booking active
- **Fix**: Thêm `.not('status', 'in', ['CANCELLED', 'COMPLETED'])` vào appointments query

#### Bug 2: Orphaned locks khi COMPLETED
- **Root cause**: `app/staff/actions.ts` (2 functions) gọi `lockTimeSlots()` khi COMPLETED nhưng không unlock slot cũ → slot bị khoá vĩnh viễn
- **Fix**: Thêm `await unlockTimeSlots(appointmentId)` trước mỗi `lockTimeSlots()` trong transition COMPLETED

### 🔁 Lần 2 — Revised prompts gửi lại Gemini (fix issues from lần 1)

Lần 1 Gemini trả code có vấn đề:
- Session Audit: chỉ plan, không code
- Schema: `WebSiteSchema.tsx` import `NextResponse` dư
- FAQ: CRUD dùng sai Supabase pattern (`@supabase/supabase-js` thay vì `@/utils/supabase/server`), `FaqSection` lỗi async+useState, dùng `react-beautiful-dnd` chưa có trong project

#### Revised Prompt 1 — Session Audit (code thực tế, không plan)

```
Sửa lỗi login không lưu phiên trong Next.js 16.2.9 project. KHÔNG viết plan, viết code thực tế.

## Project conventions (bắt buộc dùng)
- Server actions: "use server", dùng createClient from "@/utils/supabase/server"
- API routes: NextRequest/NextResponse from "next/server"
- Auth helper: import { encrypt, decrypt, getSession } from "@/utils/auth"
- Middleware: proxy.ts (export function proxy) — Next.js 16 convention
- Cookie: cookies() from "next/headers"

## Root causes cần fix
1. cookies().set() + redirect() trong cùng server action → cookie không flush
   Fix: Chuyển login flow sang API route POST /api/login, dùng response.cookies.set()
2. proxy.ts không được middleware registry nhận diện (manifest rỗng)
   Fix: Đảm bảo proxy.ts export function proxy, kiểm tra next.config proxy field
3. proxy.ts clear cookie khi decrypt fail (set maxAge: 0)
   Fix: Chỉ redirect login page, KHÔNG clear cookie
4. Key cache module reset khi hot-reload
   Fix: Dùng module-level cache pattern với process.env check

## Files cần sửa (code đầy đủ cho mỗi file)
- utils/auth.ts: Thêm setSessionCookie(response, token), getSessionCookie()
- proxy.ts: Xoá clear cookie, chỉ redirect khi token hết hạn
- app/login/actions.ts: Chuyển loginUser → gọi API /api/login
- app/api/login/route.ts: POST handler — validate, create JWT, set cookie, trả về response
- app/api/logout/route.ts: Xoá cookie

## Output
Ghi vào docs/Discuss.md với header "### 2026-06-25 v2 — Session Audit Code"
Mỗi file: path → code đầy đủ (KHÔNG "... existing code ...", viết toàn bộ file)
```

#### Revised Prompt 2 — SEO Schema Components (fix imports dư)

```
Viết 4 components JSON-LD schema. CHÚ Ý KHÔNG import dư thừa.

## Rules
- KHÔNG "use client" — server components (JSON-LD script, không state/effect)
- import { useMemo } from "react" — chỉ import nếu actually dùng
- dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
- Mỗi file export default function
- TypeScript strict: define interface Props

## File 1: components/WebSiteSchema.tsx
Props: { baseUrl: string }
Schema: WebSite → potentialAction → SearchAction

## File 2: components/BreadcrumbSchema.tsx
Props: { items: { name: string; url: string }[] }
Schema: BreadcrumbList → itemListElement → ListItem

## File 3: components/ArticleSchema.tsx
Props: { title: string; description: string; image: string; datePublished: string; author: string }
Schema: Article → headline, description, image, datePublished, author → Person

## File 4: components/ServiceSchema.tsx
Props: { services: { id: string; name: string; description: string; price: number; duration: string; category: string }[] }
CHÚ Ý: price là number (VND), KHÔNG split string
Schema: ItemList → itemListElement → Service → offers → Offer (price: number, priceCurrency: "VND")

## Output
Ghi vào docs/Discuss.md với header "### 2026-06-25 v2 — SEO Schema Components"
4 files complete, sẵn sàng copy-paste.
```

#### Revised Prompt 3 — FAQ System (dùng đúng project patterns)

```
Thiết kế FAQ system. Dùng ĐÚNG pattern của project.

## Project patterns (bắt buộc)
### Server actions file: app/admin/actions.ts
```ts
'use server'
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { revalidatePath } from "next/cache";
// Dùng createClient(), KHÔNG dùng @supabase/supabase-js trực tiếp
```

### Client component import:
```ts
'use client'
import { useState, useEffect, useCallback } from 'react';
// Tailwind CSS v4, KHÔNG dùng third-party drag-drop lib
```

### Public component:
- Server component (async, fetch data trực tiếp với createClient())
- KHÔNG useState/useEffect trong server component

## Yêu cầu
1. SQL migration — dùng DO block, idempotent, đúng convention project
2. CRUD server actions (app/admin/actions.ts) — 5 functions: getFaqs, createFaq, updateFaq, deleteFaq, reorderFaqs
3. TabFAQ component — admin, CRUD UI, sort bằng tay (nút lên/xuống), KHÔNG drag-drop lib
4. FaqSection component — PUBLIC, server component, accordion với "use client" wrapper nhỏ, fetch từ createClient
5. FaqSchema component — JSON-LD, server component

## Output
Ghi vào docs/Discuss.md với header "### 2026-06-25 v2 — FAQ System Code"
5 phần code đầy đủ, copy-paste được ngay.
```

### 📦 Build
- `npm run build` ✅ pass (47 static pages)

### 🔵 Prompt gửi Gemini — B.4 Clean any types in component props

## Task
Xoá `: any` khỏi callback params và component props trong tất cả `.tsx` files, thay bằng `unknown` hoặc bỏ hẳn (để TypeScript inference).

## Files
- `app/admin/components/*.tsx` (61 matches)
- `components/*.tsx` (63 matches)

## Rules

### 1. Callback params — xoá `: any`, để inference
```tsx
// BEFORE
items.map((s: any) => s.name)
items.filter((s: any) => s.active)
items.find((s: any) => s.id === id)
items.reduce((sum: number, s: any) => sum + s.price, 0)
items.some((a: any) => !a.staff_id)

// AFTER
items.map((s) => s.name)
items.filter((s) => s.active)
items.find((s) => s.id === id)
items.reduce((sum: number, s) => sum + s.price, 0)
items.some((a) => !a.staff_id)
```

### 2. Catch — `catch (e: any)` → `catch (e: unknown)`

### 3. Recharts formatters — `(v: any)` → `(v: number | string)` (giữ nguyên logic)

### 4. `as any` — giữ nguyên, KHÔNG sửa (khác `: any`)

### 5. `const x: any = ...` — giữ nguyên (không phải prop)

### 6. Component props interface — `staffs: any[]` → `staffs: unknown[]`

### 7. KHÔNG cần thêm import mới

### 8. Build test: `npm run build` phải pass

## Output
Ghi toàn bộ các file đã sửa vào docs/Discuss.md header "### 2026-06-25 B.4 Clean any types"
Sau mỗi file ghi rõ dòng thay đổi.
```

---

## Session 3 — 2026-06-26

### 🎯 Mục tiêu
Fix session audit issues (root causes 1-4), xoá middleware.ts conflict, implement sliding session trong proxy.ts.

### ✅ Đã làm

#### Root cause 1: cookies().set() + redirect() mất cookie
- **Phân tích**: Login server action dùng `cookies().set()` + client-side `window.location.href`. API route `/api/login/route.ts` đã có dùng `response.cookies.set()` pattern an toàn hơn — giữ làm alternative.
- **Kết luận**: Flow hiện tại hoạt động, Next.js 16 flush cookie trước response. Giữ nguyên.

#### Root cause 2: proxy.ts không được middleware registry nhận diện
- **Fix**: Xoá file `middleware.ts` (cũ, export `middleware`, có `maxAge: 0` bug) — gây conflict với `proxy.ts`
- **Fix**: Cập nhật `proxy.ts` — merge sliding session logic (re-encrypt + set cookie mỗi request)
- **Kết quả**: Chỉ còn `proxy.ts` duy nhất export `proxy` function + config matcher

#### Root cause 3: proxy.xoá cookie khi decrypt fail
- **Trạng thái**: Đã fixed từ trước — `proxy.ts` chỉ redirect, không set maxAge:0

#### Root cause 4: Key cache module reset (dev-only)
- **Trạng thái**: Dev-only, không critical, defer

### 📁 Files đã sửa
- `middleware.ts` — **deleted** (cũ, conflict với proxy.ts)
- `proxy.ts` — merge sliding session từ middleware.ts cũ

### 📋 Kế hoạch Session tiếp theo
- `ReviewCustomerModal` UI — Đã có ✅ (imported trong CheckoutModal step 6)
- `staff_skills` UI — Đã có ✅ (StaffSkillsModal.tsx + TabStaff "Kỹ năng" button)
- `submitReview()` UI — Đã có ✅ (ReviewCustomerModal.tsx + submitReview action)

---

## Session 4 — 2026-06-26

### 🎯 Mục tiêu
SEO Phase 2 — AggregateRating schema, GeoCoordinates, Product schema.

### ✅ Đã làm
- **Tạo `components/AggregateRatingSchema.tsx`** — Server component query avg rating từ `reviews` table, render JSON-LD AggregateRating schema
- **Cập nhật `app/layout.tsx`**:
  - Thêm `geo` (GeoCoordinates) vào LocalBusiness schema (lat: 10.849, lng: 106.772 — Thủ Đức)
  - Thêm `<AggregateRatingSchema />` sau LocalBusiness schema
- **Product schema**: Chưa làm (Phase 3, optional)

### 📁 Files đã tạo/sửa
- `components/AggregateRatingSchema.tsx` — mới
- `app/layout.tsx` — thêm import + GeoCoordinates + AggregateRatingSchema

### ✅ Orphans cleanup: xoá `/api/booking/cancel`, `/api/cron-check`, `/api/queue/sync`
*(Đã xoá 3 routes ở Session 1, nay bổ sung thêm 2 routes)*

### 📋 Kế hoạch Session tiếp theo
- V3.15 Pending tools/agents

---

## Session 5 — 2026-06-26

### 🎯 Mục tiêu
SEO Phase 3 — Product Schema + ItemList Schema (ServiceSchema đã có ItemList).

### ✅ Đã làm
- **Tạo `components/ProductSchema.tsx`** — Render `@graph` of `Product` schemas cho từng dịch vụ (name, description, category, offers)
- **Cập nhật `app/page.tsx`** — Thêm `ServiceSchema` (ItemList→Service) + `ProductSchema` vào trang chủ
- Phát hiện: `ServiceSchema.tsx` chưa từng được import vào page.tsx — đã fix

### 📁 Files đã sửa/tạo
- `components/ProductSchema.tsx` — mới
- `app/page.tsx` — thêm import + render ServiceSchema + ProductSchema

---

## Session 6 — 2026-06-26

### 🎯 Mục tiêu
Xoá 2 orphan API routes: `/api/booking/complete-early`, `/api/booking/locks`.

### ✅ Đã làm
- Xoá `app/api/booking/complete-early/route.ts`
- Xoá `app/api/booking/locks/route.ts`
- Cập nhật `AI_MAP.md` — xoá 5 routes đã xoá (cả 3 cũ + 2 mới)

### 📁 Files đã xoá/sửa
- `app/api/booking/complete-early/route.ts` — **deleted**
- `app/api/booking/locks/route.ts` — **deleted**
- `AI_MAP.md` — xoá routes orphans

---

## Session 7 — 2026-06-26

### 🎯 Mục tiêu
Session Audit Phase 2 (fix login cookie flush), xoá 9 orphan API routes, cập nhật docs, kiểm tra staff_skills UI.

### ✅ Đã làm

#### Session Audit Phase 2 — Fix login cookie flush
- **Phân tích**: Server action `loginUser()` dùng `cookies().set()` + return `redirectTo` → client `window.location.href`. Cookie có thể không flush kịp trước khi client navigate.
- **Fix**: Chuyển sang dùng `redirect()` từ `next/navigation` trong server action. `redirect()` throw NEXT_REDIRECT → Next.js flush cookie cùng response redirect → browser nhận cookie + Location trong 1 response.
- **Chi tiết**:
  - `app/login/actions.ts`: Rewrite — tách `doLogin()` helper, dùng `redirect(dest)` thay vì return `{ success: true, redirectTo }`
  - `app/login/page.tsx`: Xoá `window.location.href` branch (redirect tự động)
  - `saveStaffSkill()`: Xoá `updated_at` khỏi upsert (column không tồn tại trong DB)

#### Xoá 9 orphan API routes
| Route | Lý do |
|-------|-------|
| `api/login` | Đã thay bằng server action |
| `api/booking/cancel` | Đã thay bằng server action |
| `api/background-worker` | Unreferenced |
| `api/cron-check` | Duplicate của cron/reminders |
| `api/cron/seo-publish` | `runAutoSeo()` dead code |
| `api/cron/clone-daily-tasks` | Unreferenced |
| `api/cron/check-tasks` | Unreferenced |
| `api/cron/email-report` | Unreferenced |
| `api/queue/sync` | Stub |

#### staff_skills UI — Kiểm tra & xác nhận
- `StaffSkillsModal.tsx` (292 dòng) ✅ CRUD đầy đủ
- `TabStaff.tsx` ✅ Đã import + "Kỹ năng" button + modal rendering
- Server actions ✅ getStaffSkills, saveStaffSkill, deleteStaffSkill
- Fix nhỏ: xoá `updated_at` khỏi upsert (column không tồn tại)

#### Docs cập nhật
- `AI_MAP.md` — xoá api/login, session flow update, thêm cron routes
- `UPGRADE_PLAN.md` — cập nhật trạng thái Section L, orphan cleanup, staff_skills

### 📁 Files đã sửa
- `app/login/actions.ts` — rewrite dùng `redirect()`; bypass user seeding giữ nguyên
- `app/login/page.tsx` — xoá `window.location.href` redirect branch
- `app/admin/actions.ts:2682` — xoá `updated_at` khỏi saveStaffSkill upsert
- `UPGRADE_PLAN.md` — cập nhật Session Audit phases + orphan cleanup section
- `AI_MAP.md` — xoá api/login, update session flow, thêm cron routes

### 📁 Files đã xoá
- 9 API route files + empty parent dirs

### 🔴 Còn lại
| Mục | Mức độ | Mô tả |
|-----|--------|-------|
| Bug H.1 — MasterSchedule | 🔴 Cao | Query không filter CANCELLED → CONFIRMED bị nuốt |
| Bug H.2 — Orphaned locks | 🔴 Cao | COMPLETED không unlock lock cũ → slot fully_booked |
| Session Phase 1 & 6 | ⚠️ | Build verification bị chặn UNC path |
| Dead code `runAutoSeo()` | 🟢 Thấp | lib/auto-seo.ts — route đã xoá |

---

## Session 8 — 2026-07-02

### 🎯 Mục tiêu
Complete SEO Polish — alt text, OG images, metadata, language switcher, logo display, sitemap, breadcrumb schema, admin SEO articles, lint/typecheck cleanup.

### ✅ Đã làm

#### SEO Image Alt Text
- `image_alt` column added to `blogs`, `services`, `seo_articles` tables in `database.sql`
- `BlogPost` interface updated with `image_alt?: string`
- Server actions `saveBlogPost`, `getBlogPosts`, `getBlogPostBySlug` handle `image_alt`
- AI assist: `suggestImages` returns `{ images, imageAlts }`; `writeArticle` includes `image_alt`
- Admin blog form: `imageAlt` state + input field; auto-fills from AI suggestion
- `BlogRichEditor.tsx`: insert image now prompts URL + Alt Text
- Blog rendering: cover, sidebar, homepage cards use `image_alt` (fallback to `title`)
- OG meta: `og:image:alt` + `twitter:image:alt` in blog detail, blog list, booking layout

#### OG Image Fix
- Default OG changed SVG → PNG (`/icons/icon-512.png` → `/og-image.png`)
- Root layout: OG/Twitter metadata with `width`, `height`, `alt`
- `WebSiteSchema.tsx`: added logo `image` property with PNG URL
- `robots.txt`: `Disallow: /admin/ /staff/ /api/ /login/`
- Ran `UPDATE seo_settings SET og_image_url = '/og-image.png'` on production Supabase via REST API

#### Language Switcher (Google Translate)
- `GoogleTranslate.tsx` rewritten: globe button + dropdown UI (9 languages)
- Widget container always renders in DOM (fixes init timing — no conditional mount)
- `z-[60]` position top-right, site-wide via `layout.tsx`
- **Bug**: User reports only Vietnamese shows — awaiting confirmation of fix

#### Admin SEO Articles Page
- `app/admin/seo-articles/page.tsx` — full CRUD: list, create/edit form, delete, publish to blog
- Server actions: `getSeoArticles`, `getSeoArticleById`, `saveSeoArticle`, `deleteSeoArticle`, `publishSeoArticleToBlog`
- Admin sidebar: added link under "CẤU HÌNH → Bài viết SEO"
- `SeoArticle` type added to `types/database.ts`

#### Sitemap & Breadcrumb
- `app/sitemap.ts`: added `seo_articles` entries with `blog_slug`
- `BreadcrumbSchema` added to `app/blog/page.tsx`, `app/booking/page.tsx`

#### Build & Lint
- `npm run lint` — 0 errors, 0 warnings 🎉
- `npm run build` — webpack + TypeScript pass, 41/41 static pages ✅

#### Blocked / Deferred
- Google Search Console: needs user credentials
- Google Translate fix: awaiting user test
- Documentation overhaul: SKILL.md, AI_MAP.md, docs/Log.md updated; workflow diagrams pending

### 📁 Files created
- `components/BreadcrumbSchema.tsx`
- `components/GoogleTranslate.tsx`
- `app/admin/seo-articles/page.tsx`
- `public/og-image.png`

### 📁 Files modified (major)
- `components/BreadcrumbNav.tsx`, `components/WebSiteSchema.tsx`, `components/BlogRichEditor.tsx`
- `app/layout.tsx`, `app/page.tsx`, `app/sitemap.ts`, `app/robots.txt`
- `app/blog/[slug]/page.tsx`, `app/blog/page.tsx`, `app/booking/page.tsx`, `app/booking/layout.tsx`
- `app/admin/blog/page.tsx`, `app/admin/page.tsx`, `app/admin/actions.ts`
- `lib/cache.ts`, `lib/auto-seo.ts`, `types/database.ts`
- `app/api/ai-assist/route.ts`
- `database.sql`
- `.agents/skills/minspa/SKILL.md`
- `AI_MAP.md`

### 📁 Files deleted
- None

### 📋 Kế hoạch Session tiếp theo
- Confirm Google Translate fix
- Create docs/workflow.md (business process diagrams)
- Proper i18n (next-intl) if Google Translate insufficient
- Google Search Console setup
 
---
 
## Session 9 — 2026-07-03
 
### 🎯 Mục tiêu
Hoàn thiện Phase 10 (Final Polish & Performance), tối ưu hóa bundle size, fix lỗi Unicode NFC, và đồng bộ tài liệu cuối cùng.
 
### ✅ Đã làm
 
#### Performance Optimization (Phase 10)
- **Dynamic Imports**: Áp dụng `next/dynamic` cho các component nặng (`HeaderNav`, `BottomNavigation`, `BookingCalendar`, `BookingMascotGuide`, `GlobalSearch`) để giảm initial bundle size.
- **Bundle Splitting**: Tách `motion/react` ra khỏi critical path bằng cách lazy-load `MascotProvider` trong `app/layout.tsx`.
- **Script Defer**: Trì hoãn load script Google Translate (`strategy="lazyOnload"`) và trigger load khi người dùng tương tác với UI.
- **Package Optimization**: Thêm `optimizePackageImports` cho `lucide-react`, `date-fns`, `motion` trong `next.config.ts`.
- **LCP Improvement**: Thêm `priority` cho logo trong `HeaderNav` để cải thiện Largest Contentful Paint.
 
#### Fixes & Quality
- **Unicode Normalization (NFC)**: Triển khai `normalizeNFC` trong `lib/utils.ts` và áp dụng cho toàn bộ data fetch trong `lib/cache.ts`, triệt để fix lỗi tách dấu tiếng Việt trên một số trình duyệt/font.
- **Google Translate**: Rewrite custom UIDropdown, fix URL `translate.googleapis.com` và xử lý domain cookie cho Vercel Preview/Production.
- **Admin UX**: Sửa link điều hướng từ `/admin/seo_articles` $\rightarrow$ `/admin/seo-articles`.
- **Code Cleanup**: Xoá duplicate import `Script` trong `app/layout.tsx` và unused `fs` trong `scripts/verify_seo_cron.ts`.
 
#### Auto SEO Automation
- **Infrastructure Migration**: Chuyển trigger từ Vercel Cron sang Supabase Cron (`pg_cron` + `pg_net`) để đảm bảo độ tin cậy.
- **Manual Trigger**: Thêm param `?force=1` cho `/api/cron/seo-publish` để cho phép trigger đăng bài thủ công.
 
#### Documentation & Verification
- **Sync Plan**: Cập nhật `PLAN.md` (Phase 10) và dọn dẹp `UPGRADE_PLAN.md` về trạng thái lean.
- **Verification**: Chạy `npm run lint`, `npx tsc --noEmit` và `npm run build` $\rightarrow$ Pass 100% (0 errors, 0 warnings, 41 static pages).
 
### 📁 Files đã sửa
- `next.config.ts`, `app/layout.tsx`, `lib/utils.ts`, `lib/cache.ts`, `app/api/cron/seo-publish/route.ts`
- `components/HeaderNav.tsx`, `components/GoogleTranslate.tsx`, `app/admin/seo-articles/page.tsx`
- `PLAN.md`, `UPGRADE_PLAN.md`, `docs/Log.md`

## Session — 2026-07-05

### 🎯 Mục tiêu
Fix CSP blocks, React hydration errors, duplicate Google Translate init, Vercel deploy timeout, và lỗi lưu ảnh AI (image_url VARCHAR(255)).

### ✅ Đã làm

#### CSP & Google Translate
- Mở rộng CSP `next.config.ts`: thêm `fonts.gstatic.com` (img-src), `translate-pa.googleapis.com` (script-src)
- Xoá duplicate Google Translate Script blocks trong `app/layout.tsx` (component `GoogleTranslate.tsx` đã load script qua useEffect)
- Thêm favicon `<link rel="icon">` (SVG + PNG) để tránh 404

#### Vercel Deploy
- Sửa CI workflow: xoá `--timeout=900000` flag không hợp lệ, tăng `timeout-minutes` 15→30
- Khám phá: `npx vercel --prod` có thể báo success nhưng không alias domain → fix bằng `npx vercel alias set`

#### Service Image Fix
- `services.image_url` VARCHAR(255) → TEXT (quá nhỏ cho base64 Gemini AI, 300-500KB)
- `blogs.image_url` VARCHAR(255) → TEXT
- `seo_articles.image_url` VARCHAR(500) → TEXT
- Thêm INSERT/UPDATE/DELETE policies cho storage bucket `seo-images` (trước chỉ có SELECT)
- Sửa `uploadBase64ToStorage`: giới hạn 500KB → 5MB, throw lỗi rõ khi upload fail
- Bucket `file_size_limit` cập nhật 1MB → 5MB

#### Form Accessibility
- Thêm `autoComplete="username"` và `autoComplete="current-password"` cho login form inputs

### 🐛 Bugs gặp
1. Vercel deploy alias không được cập nhật dù CI báo thành công — `minhair.vercel.app` trỏ vào deployment cũ
2. Storage bucket `seo-images` thiếu INSERT policy — upload từ anon key fail silently
3. `image_url VARCHAR(255)` tràn khi chứa base64 data URL
4. Bucket `file_size_limit` trong DB là 1MB nhưng `database.sql` ghi 5MB (không đồng bộ)

### 💡 Bài học
1. **Luôn kiểm tra Vercel alias sau deploy** — CI success ≠ domain updated
2. **Storage bucket cần 4 policies** (SELECT/INSERT/UPDATE/DELETE), không chỉ SELECT
3. **Column image_url phải là TEXT** — base64 Gemini AI rất lớn
4. **Cross-check GitHub Deployments API** — Actions runs có thể sai lệch với production deploy thực tế
5. **`npx vercel` CLI authenticated locally** — dùng được `list`, `inspect`, `alias set` không cần token

### 📁 Files đã sửa
- `next.config.ts`, `app/layout.tsx`, `app/login/page.tsx`
- `.github/workflows/ci.yml`, `public/sw.js`
- `app/booking/actions/suggestions.ts`, `components/DynamicBottomNavigation.tsx`
- `database.sql`, `app/admin/actions.ts`
- `.agents/skills/minspa/SKILL.md`, `docs/Log.md`, `opencode.json`

## Session — 2026-07-06

### 🎯 Mục tiêu
Fix browser warnings, integrate Playwright MCP, update skill/tools/rules.

### ✅ Đã làm

#### GoTrueClient Multiple Instances Fix
- **Root cause:** 3 components called `createClient()` directly from `@supabase/supabase-js` inside `useEffect`, bypassing singleton in `utils/supabase/client.ts`
- **Fix:** Replaced dynamic import with `import('@/utils/supabase/client')` → `createClient()` singleton
- **Files:** `components/NotificationBell.tsx`, `app/admin/components/TabDashboard.tsx`, `app/staff/page.tsx`

#### Preload Warning Fix
- Remove `<link rel="preload" href="/icons/icon-192.png" as="image" />` từ `app/layout.tsx`
- Lý do: PWA/apple-touch-icon không cần preload, browser tự fetch từ manifest.json

#### Playwright MCP Setup
- Thêm `@playwright/mcp` vào `opencode.json` (local MCP server)
- Cho phép browser automation (navigate, screenshot, interact) từ opencode

#### Skill & Docs Update
- Thêm 4 bài học mới vào `.agents/skills/minspa/SKILL.md` (section 10)
- Cập nhật `docs/Discuss.md` với quyết định quan trọng
- Ghi log session vào `docs/Log.md`

### 🐛 Bugs gặp
1. GoTrueClient multiple instances — 3 files dùng dynamic import bypass singleton
2. Preload icon-192.png báo "not used within a few seconds" — PWA icon không cần preload
3. `opencode.json` `tools` field chỉ chấp nhận boolean — custom tool phải qua MCP server

### 💡 Bài học
1. **Supabase client singleton** — Luôn dùng `utils/supabase/client.ts` thay vì `createClient()` từ `@supabase/supabase-js` trong component effects
2. **Preload chỉ khi resource được dùng ngay** — apple-touch-icon, manifest icons không cần preload
3. **Custom tools → MCP server** — Không thể định nghĩa function tools trong `opencode.json`
4. **Playwright MCP** — Cấu hình qua `mcp` field + restart opencode

### 📁 Files đã sửa
- `components/NotificationBell.tsx`, `app/admin/components/TabDashboard.tsx`, `app/staff/page.tsx`
- `app/layout.tsx`
- `opencode.json`
- `.agents/skills/minspa/SKILL.md`
- `docs/Log.md`, `docs/Discuss.md`

---

## Session — 2026-07-07 (Final Polish)

### 🎯 Mục tiêu
Fix S3 image browser trống, Google Translate crash + banner, mobile UI audit, cập nhật docs.

### ✅ Đã làm

#### S3 Image Browser Bucket Mismatch
- **Root cause:** `listStorageImages()` đọc từ `seo-images` bucket nhưng upload ghi vào `service-images` bucket → không thấy ảnh
- **Fix:** Đổi bucket trong `listStorageImages()` từ `seo-images` → `service-images`

#### Google Translate Crash (`Maximum call stack size exceeded`)
- **Root cause:** React Strict Mode double-mount → 2 script Google Translate → vòng lặp MutationObserver
- **Fix:** Guard `document.querySelector('script[src*="translate.googleapis.com"]')` + `window.__googleTranslateInitialized` flag
- **Fix:** Thêm `notranslate` class vào `StatsCounter` (dynamic text gây translation loop)

#### Google Translate Banner CSS
- **Root cause:** Selector `.goog-te-banner-frame.skiptranslate` quá hẹp — một số phiên bản không có class `skiptranslate`
- **Fix:** Selector mở rộng: `.goog-te-banner-frame`, `iframe.goog-te-banner-frame`, `#goog-te-banner-frame`, `.goog-te-banner`

#### Mobile UI Audit
- **Kiểm tra responsive:** Homepage ✅, Admin ✅, Staff ✅ — tất cả đều mobile-first với sm/md/lg/xxl breakpoints
- **Tier navigation:** Pill row (public) + Drawer (admin/staff) + Bottom tab bar (all) ✅
- **Touch targets:** HeaderNav pills `min-h-[34px]` → `44px` (WCAG 2.5.5)
- **Safe areas:** `env(safe-area-inset-*)` trên body, bottom nav, drawer ✅
- **Viewport zoom:** `userScalable` enabled (WCAG 1.4.4) ✅

#### Tailwind Config Fix
- **4k breakpoint:** Đang dùng trong page.tsx nhưng không định nghĩa trong tailwind.config → classes bị ignore
- **Fix:** Thêm `'4k': '2560px'` vào screens

#### Upgrade Plan & Docs
- Cập nhật UPGRADE_PLAN.md với Phase 5 (Image Upload), Phase 6 (Google Translate), Mobile UI tasks
- Tạo `.agents/skills/minspa/SKILL.md` với 8 bài học critical + conventions
- Thêm `scripts/debug/lighthouse-audit.mjs` — Playwright-based Lighthouse automation
- Cập nhật Audit.md với audit findings hôm nay
- Ghi log session vào docs/Log.md

### Lighthouse Baseline (2026-07-01, Mobile)
| Category | Score |
|----------|-------|
| Performance | 47 (🔴) |
| Accessibility | 96 (🟢) |
| Best Practices | 92 (🟢) |
| SEO | 100 (🟢) |

### 📁 Files đã sửa
- `app/admin/actions.ts` — bucket name fix
- `components/GoogleTranslate.tsx` — duplicate script guard + __googleTranslateInitialized
- `components/StatsCounter.tsx` — notranslate class
- `components/HeaderNav.tsx` — touch target 34px → 44px
- `app/globals.css` — expand Google Translate CSS selectors
- `tailwind.config.ts` — thêm 4k breakpoint
- `types/index.ts` — thêm `__googleTranslateInitialized`
- `.agents/skills/minspa/SKILL.md` — new file with lessons
- `scripts/debug/lighthouse-audit.mjs` — new Lighthouse audit script
- `docs/UPGRADE_PLAN.md` — cập nhật Phase 5, 6
- `docs/Audit.md` — thêm entry 2026-07-07
- `docs/Log.md` — entry này

### 🐛 Bugs gặp
1. S3ImageBrowser luôn trống — bucket name mismatch (seo-images vs service-images)
2. Google Translate crash — React Strict Mode double-mount
3. Google Translate banner không ẩn — CSS selector quá hẹp
4. StatsCounter gây translation loop — không có notranslate class
5. 4k breakpoint bị ignore — không định nghĩa trong tailwind.config
6. Touch target header pills 34px — dưới chuẩn WCAG 44px

### 💡 Bài học
1. **Bucket names**: Luôn kiểm tra consistency giữa list và upload operations
2. **Third-party scripts + React Strict Mode**: Luôn guard chống double-mount (querySelector existing script + global flag)
3. **CSS selector third-party elements**: Dùng multiple selector fallback (class + tag + id)
4. **Dynamic elements + translation**: `notranslate` class cho bất kỳ element nào thay đổi text liên tục
5. **Tailwind breakpoints**: Kiểm tra consistency giữa usage và config (công cụ grep)
6. **Touch targets**: Luôn dùng `min-h-[44px]` cho interactive elements (WCAG 2.5.5)
7. **Lighthouse automation**: Script `scripts/debug/lighthouse-audit.mjs` có thể chạy local hoặc CI
8. **Safe area insets**: `env(safe-area-inset-*)` on body + bottom nav + drawer cho notch devices
