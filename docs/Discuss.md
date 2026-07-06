# Updated Discuss.md with additional audit summary

### 2026-06-25 — Additional Audit Summary

All code implementations for the **FAQ System**, **Session Audit**, and **SEO Schema Components** have been reviewed and meet the project’s mandatory patterns and quality standards:

- **SQL migration** is idempotent and includes needed indexes.
- **Server actions** correctly use `createClient`, `getSession`, `revalidatePath`, and redirect handling.
- **Admin UI (TabFAQ)** adheres to client‑side constraints, uses up/down sorting buttons, and avoids third‑party drag‑drop libraries.
- **Public FAQ Section** is an async server component with a minimal client‑side accordion wrapper.
- **FAQ JSON‑LD Schema** is a pure server component with proper `useMemo` usage and no redundant imports.
- **Session Audit** fixes login persistence, middleware registration, and cookie handling using `setSessionCookie`.
- **SEO Schema Components** are clean server components, import‑only `useMemo`, and output correct JSON‑LD.

**Verification**: Manual testing (`npm run dev`) confirms session cookie persists, FAQ CRUD operations work, and schema scripts render JSON‑LD correctly. No linting or runtime errors observed.

**Next steps**: Run the full test suite (`npm test`) and deploy to staging for final validation.

---

### 2026-06-26 — SEO Schema Integration Complete

All 4 SEO Schema components (WebSiteSchema, BreadcrumbSchema, ArticleSchema, ServiceSchema) đã được integrate vào trang:

| Component | Vị trí | Trạng thái |
|-----------|--------|-----------|
| `WebSiteSchema` | `app/layout.tsx:213` | ✅ WebSite + SearchAction |
| `BreadcrumbSchema` | `app/blog/[slug]/page.tsx:68` | ✅ BreadcrumbList |
| `ArticleSchema` | `app/blog/[slug]/page.tsx:61` | ✅ Article/BlogPosting |
| `ServiceSchema` | `app/page.tsx:137` | ✅ ItemList → Service |

Các component đều là server component (không `'use client'`), dùng `useMemo` cho JSON-LD render, không có dependencies phụ. `Schema type` audit trong UPGRADE_PLAN.md section J đã cập nhật trạng thái.

**Phase 1 SEO hoàn tất.**

---

### 2026-07-06 — Browser Warnings Fix + Playwright MCP

**Context:** Console warnings: (1) Multiple GoTrueClient instances detected, (2) Preload icon-192.png not used within 3 seconds. Need to integrate Playwright for browser automation.

**Decisions:**
- **Supabase client:** Always use singleton from `utils/supabase/client.ts`. Do NOT call `createClient()` from `@supabase/supabase-js` inside component effects — this bypasses the cached instance and creates duplicate GoTrueClients competing for localStorage. 3 files fixed.
- **Preload:** Remove `<link rel="preload">` for PWA/apple-touch-icons. Browser fetches these from manifest.json automatically. Preloading causes "not used" warning since the resource isn't referenced as `<img>`/CSS within 3s.
- **Playwright MCP:** Add `@playwright/mcp` as a local MCP server in `opencode.json` for programmatic browser control (navigate, screenshot, interact) — alternative to Antigravity Browser Control which requires IDE extension.
- **Antigravity `open_browser_url`:** Tool is injected by IDE extension, NOT definable in `opencode.json`. The `tools` field only accepts booleans per schema at https://opencode.ai/config.json. Must install "Browser Control" extension to use.

**Files:** `components/NotificationBell.tsx`, `app/admin/components/TabDashboard.tsx`, `app/staff/page.tsx`, `app/layout.tsx`, `opencode.json`, `.agents/skills/minspa/SKILL.md`

---

*(The rest of the document remains unchanged.)

---

### 2026-06-26 — Session Audit Phase 2 + Orphan Cleanup

Direct execution (no Gemini needed):
- Login cookie flush: rewrite `loginUser()` → dùng `redirect()` đảm bảo cookie flush
- Xoá 9 orphan API routes (tổng 11 sau 2 đợt)
- staff_skills UI đã có sẵn, chỉ fix `updated_at` bug
- Cập nhật PLAN.md + dọn UPGRADE_PLAN.md (750→94 dòng)
