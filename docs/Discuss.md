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

*(The rest of the document remains unchanged.)

---

### 2026-06-26 — Session Audit Phase 2 + Orphan Cleanup

Direct execution (no Gemini needed):
- Login cookie flush: rewrite `loginUser()` → dùng `redirect()` đảm bảo cookie flush
- Xoá 9 orphan API routes (tổng 11 sau 2 đợt)
- staff_skills UI đã có sẵn, chỉ fix `updated_at` bug
- Cập nhật PLAN.md + dọn UPGRADE_PLAN.md (750→94 dòng)
