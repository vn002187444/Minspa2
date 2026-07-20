# AGENTS.md — Min Nail & Hair (Minspa)

Project-scoped rules cho AI agents làm việc trong workspace này.
Stack: **Next.js 15 · Supabase PostgreSQL · Custom JWT (HS256) · Tailwind CSS v4 · TypeScript**

---

## 1. Skill Bắt Buộc

Trước khi bắt đầu bất kỳ task nào, **phải đọc skill tương ứng**. Skills chia làm 2 nhóm:

### 1a. Workspace Skills (project-specific)

| Tình huống | Skill |
|-----------|-------|
| Mọi tính năng trong project (kiến trúc, auth, DB, storage) | `.agents/skills/minspa/SKILL.md` |
| Supabase (DB, Auth, Storage, Realtime, RPC, CLI) | `.agents/skills/supabase/SKILL.md` |
| Postgres query / schema / migration / index | `.agents/skills/supabase-postgres-best-practices/SKILL.md` |
| Rút bài học / cập nhật skill sau bug fix | `.agents/skills/train/SKILL.md` |

### 1b. Global Skills (tự động load — dùng theo tình huống)

### 1b. Global Skills (tự động load — dùng theo tình huống)

| Tình huống | Skill |
|-----------|-------|
| Build/sửa UI, component, layout, responsive, accessibility | `frontend-ui-engineering` |
| UI/UX max pro (premium design, micro‑animations, color palette, typography) | `ui-ux-pro` |
| Debug lỗi, trace root cause, fix unexpected behavior | `debugging-and-error-recovery` |
| Tính năng lớn — cần chia nhỏ thành tasks | `planning-and-task-breakdown` |
| Implement từng bước, tránh làm quá nhiều cùng lúc | `incremental-implementation` |
| Viết code từ tài liệu chính thức (Next.js, Supabase docs) | `source-driven-development` |
| Thiết kế API endpoint, type contract giữa modules | `api-and-interface-design` |
| Commit, branch, merge, semantic versioning, changelog | `git-workflow-and-versioning` |
| Code review, quality check trước khi merge | `code-review-and-quality` |
| Bảo mật: input validation, auth, XSS, injection | `security-and-hardening` |
| Tối ưu Core Web Vitals, N+1 query, bundle size | `performance-optimization` |
| Viết test, TDD, fix bug với coverage | `test-driven-development` |
| Viết spec/requirement trước khi code | `spec-driven-development` |
| Refactor code phức tạp thành code đơn giản hơn | `code-simplification` |
| Logging, metrics, tracing trong production | `observability-and-instrumentation` |
| Deploy production, pre-launch checklist, rollback | `shipping-and-launch` |
| Ideate, brainstorm, stress-test một ý tưởng | `idea-refine` |
| Yêu cầu mơ hồ — cần hỏi làm rõ trước khi code | `interview-me` |
| Quyết định quan trọng cần kiểm tra lại trước khi thực hiện | `doubt-driven-development` |
| Kiểm tra kết quả trực tiếp trên browser | `browser-testing-with-devtools` |

### 1c. Development Lifecycle — Agent × Giai đoạn × Skill

> Bảng này giúp xác định **Agent nào** cần dùng **Skill nào** ở **giai đoạn nào** trong vòng đời phát triển.

| Giai đoạn | Mô tả | Agent / Vai trò | Skills cần dùng |
|-----------|-------|----------------|-----------------|
| **🔍 Khám phá & Làm rõ** | Nhận yêu cầu mơ hồ, brainstorm, align với user | Planner Agent | `interview-me` · `idea-refine` · `doubt-driven-development` |
| **📋 Spec & Thiết kế** | Viết spec, thiết kế API, phân tích schema DB | Architect Agent | `spec-driven-development` · `api-and-interface-design` · `minspa` · `supabase` |
| **🗂️ Lập kế hoạch** | Chia tính năng lớn thành tasks nhỏ, estimate | Planner Agent | `planning-and-task-breakdown` · `incremental-implementation` |
| **🗄️ Database & Backend** | Viết migration, RLS, query, RPC, trigger | Backend Agent | `supabase` · `supabase-postgres-best-practices` · `minspa` · `security-and-hardening` |
| **🎨 UI & Frontend** | Build component, layout, responsive, animation | Frontend Agent | `frontend-ui-engineering` · `source-driven-development` · `minspa` |
| **⚙️ Implementation** | Viết code từng bước, không làm quá nhiều cùng lúc | Dev Agent | `incremental-implementation` · `source-driven-development` · `minspa` |
| **🔒 Bảo mật** | Input validation, auth guards, XSS, RLS audit | Security Agent | `security-and-hardening` · `supabase` · `minspa` |
| **🧪 Testing & Debug** | Viết test, trace bug, fix root cause | QA Agent | `test-driven-development` · `debugging-and-error-recovery` · `browser-testing-with-devtools` |
| **📐 Code Review** | Review PR, kiểm tra quality, refactor | Reviewer Agent | `code-review-and-quality` · `code-simplification` · `doubt-driven-development` |
| **🚀 Performance** | Tối ưu Core Web Vitals, query, bundle | Perf Agent | `performance-optimization` · `supabase-postgres-best-practices` |
| **📦 Commit & Version** | Stage đúng file, viết commit message, tag | Dev Agent | `git-workflow-and-versioning` · `minspa` (commit hygiene) |
| **🚢 Deploy & Launch** | Pre-launch checklist, staging, rollback plan | DevOps Agent | `shipping-and-launch` · `observability-and-instrumentation` |
| **📊 Production Monitor** | Logging, metrics, alert khi có sự cố | Ops Agent | `observability-and-instrumentation` · `debugging-and-error-recovery` |
| **🎓 Sau Bug Fix / Train** | Rút bài học, cập nhật SKILL.md, SUPABASE_FEATURES.md | Any Agent | `train` · `minspa` · `supabase` |

### 1d. Quy tắc Ưu tiên Skill (khi nhiều skill cùng áp dụng)

> Khi một tình huống khớp **nhiều skill**, dùng bảng dưới để chọn skill ưu tiên cao nhất. Các skill còn lại có thể dùng **bổ trợ** nếu phạm vi công việc mở rộng.

| Độ ưu tiên | Tiêu chí | Skill ưu tiên |
|-----------|----------|---------------|
| **1 — Bảo mật** | Yêu cầu liên quan auth, RLS, XSS, input validation, dữ liệu nhạy cảm | `security-and-hardening` (+ `supabase`, `minspa`) |
| **2 — Compliance DB** | Thay đổi schema, migration, RLS policy, query tối ưu | `supabase-postgres-best-practices` · `supabase` |
| **3 — Hiệu năng** | Slow page, heavy query, bundle lớn, Core Web Vitals | `performance-optimization` (+ `supabase-postgres-best-practices` nếu là DB) |
| **4 — UI/UX premium** | Thiết kế cao cấp, micro‑animations, color palette, typography | `ui-ux-pro` (trước `frontend-ui-engineering`) |
| **5 — UI chức năng** | Component, layout, responsive, accessibility | `frontend-ui-engineering` · `source-driven-development` |
| **6 — API / Logic** | Tạo endpoint, type contract, business logic | `api-and-interface-design` · `source-driven-development` |
| **7 — Testing / Debug** | Bug, test, trace root cause, verify behavior | `test-driven-development` · `debugging-and-error-recovery` |
| **8 — Lập kế hoạch** | Task lớn, chưa có cấu trúc, cần estimate | `planning-and-task-breakdown` · `incremental-implementation` |
| **9 — Review / Refactor** | Code đã xong, cần kiểm tra quality, đơn giản hóa | `code-review-and-quality` · `code-simplification` |
| **10 — Deploy / Ops** | Chuẩn bị ra production, monitoring, rollback | `shipping-and-launch` · `observability-and-instrumentation` |
| **11 — Làm rõ yêu cầu** | Yêu cầu mơ hồ, cần hỏi lại, stress‑test ý tưởng | `interview-me` · `idea-refine` · `doubt-driven-development` |

#### Quyết định nhanh (Decision Tree)

```
Có yếu tố bảo mật / auth / RLS?
  └─ YES → security-and-hardening (ưu tiên 1)
  └─ NO  → Liên quan schema / migration / DB query?
              └─ YES → supabase-postgres-best-practices (ưu tiên 2)
              └─ NO  → Có vấn đề hiệu năng rõ ràng?
                          └─ YES → performance-optimization (ưu tiên 3)
                          └─ NO  → Mục tiêu là UI/UX cao cấp?
                                      └─ YES → ui-ux-pro (ưu tiên 4)
                                      └─ NO  → Xây dựng UI/component?
                                                  └─ YES → frontend-ui-engineering (ưu tiên 5)
                                                  └─ NO  → API / business logic?
                                                              └─ YES → api-and-interface-design (ưu tiên 6)
                                                              └─ NO  → Bug / cần test?
                                                                          └─ YES → test-driven-development (ưu tiên 7)
                                                                          └─ NO  → Theo thứ tự 8 → 11
```

> **Lưu ý**: Khi 2 skill cùng bậc ưu tiên (ví dụ cùng bậc 5), chọn skill **chuyên biệt hơn**. Ví dụ: `ui-ux-pro` chuyên biệt hơn `frontend-ui-engineering` → dùng `ui-ux-pro` làm chính, `frontend-ui-engineering` làm phụ.

---

## 2. Auth & Session — Không được vi phạm

- **LUÔN** dùng `@/utils/supabase/server` → `createClient()` trong Server Components/Actions
- **LUÔN** dùng `@/utils/supabase/client` singleton trong Client Components
- **KHÔNG BAO GIỜ** gọi `createClient()` từ `@supabase/supabase-js` trực tiếp trong component
- **KHÔNG BAO GIỜ** dùng `middleware.ts` — proxy xử lý qua `proxy.ts`

---

## 3. Database — Quy tắc Schema

- `database.sql` là **source of truth duy nhất** — không sửa schema mà không có migration
- Migration files phải dùng **idempotent DO blocks** (`IF NOT EXISTS`, `IF EXISTS`)
- Status enum phải viết **HOA**: `CONFIRMED`, `COMPLETED`, `CANCELLED`, `PENDING`
- Mọi bảng mới **phải có**: RLS policies, index trên FK columns, constraints phù hợp
- Trước khi viết code tính năng mới → kiểm tra `SUPABASE_FEATURES.md` xem đã có solution sẵn chưa

---

## 4. Storage — Buckets

| Bucket | Dùng cho |
|--------|----------|
| `seo-images` | SEO/blog/service ảnh do AI generate |
| `service-images` | Ảnh upload tay qua S3ImageBrowser |

- **Luôn kiểm tra tên bucket nhất quán** giữa upload và list — đây là bug đã xảy ra trong production
- Mỗi bucket cần **4 RLS policies**: SELECT, INSERT, UPDATE, DELETE

---

## 5. Supabase Features — Dùng Trước Khi Tự Viết

| Nhu cầu | Dùng |
|---------|------|
| Schedule job định kỳ | `pg_cron` (đã cài) |
| Queue xử lý bất đồng bộ | `pgmq` — queue `background_tasks` |
| Realtime update cho client | Realtime Postgres Changes (đã có `lib/realtime.ts`) |
| Lưu file ảnh | Storage bucket có sẵn |
| HTTP call khi data thay đổi | Database Trigger + `pg_net` |

**KHÔNG tự viết cron, queue, webhook nếu Supabase đã có sẵn.**

---

## 6. Tailwind CSS v4

- Breakpoints của project: `xs` (480px) · `sm` (640px) · `md` (768px) · `lg` (1024px) · `xl` (1280px) · `xxl` (1600px) · `4k` (2560px)
- Mobile-first: `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3`
- Touch targets tối thiểu: `min-h-[44px]` (WCAG 2.5.5)
- Font chính xác: dùng `font-display` (Playfair Display) — **KHÔNG dùng `font-serif`** (project không định nghĩa `--font-serif`)
- Khi dùng `prose` class → **phải cài** `@tailwindcss/typography`

---

## 7. Third-Party Scripts

- Google Translate: guard injection bằng `document.querySelector('script[src*="translate.googleapis.com"]')` + flag `window.__googleTranslateInitialized`
- Elements có text thay đổi liên tục (`setInterval`): thêm class `notranslate`
- CSS selector ẩn banner: dùng `.goog-te-banner-frame` (không kèm `.skiptranslate`)
- Chỉ `<link rel="preload">` resource được dùng trong 3 giây đầu

---

## 8. Performance & SEO

- Dynamic import cho: `BookingCalendar`, `BookingMascotGuide`, motion components
- GA4: `next/script` với `strategy="afterInteractive"`
- `robots.txt`: Disallow `/admin/` `/staff/` `/api/` `/login/`
- Admin + staff pages: `noindex` qua layout
- JSON-LD bắt buộc: `LocalBusiness`, `WebSite`, `BreadcrumbList` trên trang public
- Canonical URL trên tất cả public pages

---

## 9. Git & Commit Hygiene

- **KHÔNG commit**: `next-env.d.ts`, `tsconfig.tsbuildinfo`
- Trước khi commit: chạy `git diff --cached --name-only` để kiểm tra staged files
- Chỉ commit intentional changes trong `app/`, `components/`, `lib/`, `.agents/`, `public/fonts/`

---

## 10. Sau Bug Fix — Bắt Buộc Train

Sau mỗi bug fix hoặc phát hiện hành vi không rõ ràng:
1. Áp dụng skill `train` (`.agents/skills/train/SKILL.md`)
2. Cập nhật `minspa/SKILL.md` với bài học mới
3. Nếu liên quan đến Supabase feature → cập nhật `SUPABASE_FEATURES.md`
