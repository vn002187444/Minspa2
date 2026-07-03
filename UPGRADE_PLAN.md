# 🚀 KẾ HOẠCH NÂNG CẤP (UPGRADE_PLAN)
 
> **Tất cả các task chính đã hoàn thành.** Xem chi tiết tại `PLAN.md` → section **CÁC GIAI ĐOẠN NÂNG CẤP HOÀN THÀNH**
 
---
 
## 📋 Trạng thái hiện tại

*Phase 11 – Font & Encoding Fix hoàn tất. 0 lint / 0 type / build pass 43 static pages.*

---

## 🔧 Phase 11 — Font Subset & Encoding Fix

### Root cause "Bài viê´t mới nhâ´t"
- **Font subsets thiếu** `latin-ext` và `vietnamese`:
  - `Inter` chỉ dùng `["latin"]` → thiếu glyph cho ế, ấ, ộ, v.v. → trình duyệt fallback sai.
  - `Playfair_Display` chỉ dùng `["latin"]` → tương tự.
- **Fix**: `app/layout.tsx:25-26` → thêm `"latin-ext"` (cả 2 font) + `"vietnamese"` (Inter).

### Google Translate không dịch
- **Widget container** class `hidden` (`display: none`) → iframe Google Translate không init đúng → cookie `googtrans` không được đọc.
- **Fix**: `components/GoogleTranslate.tsx` → đổi thành `translate-widget-container` với CSS `position: fixed; top: -1000px; left: -1000px; opacity: 0; pointer-events: none` → iframe vẫn render được.
- **Plus**: thêm fallback `document.querySelector('.goog-te-combo')` change event để dịch trực tiếp không cần reload.
- **Cookie domain**: thêm nhánh `cookieDomain = ''` trên localhost.

### NFC normalization defense-in-depth
- **Scripts** `scripts/migrate.ts`, `scripts/seed_blogs.mjs`, `scripts/seed_seo.mjs`:
  - Thêm `normalizeNFC()` wrapper vào tất cả insertion/upsert points (blogs, services, reviews, treatment_packages, seo_articles).
- **Phát hiện mojibake** trong `scripts/seed_blogs.mjs` (chuỗi Táº¥t Táº§n... do save sai encoding) — cần re-encode file về UTF-8.

### Files changed
| File | Change |
|------|--------|
| `app/layout.tsx` | Font subsets: `Inter` + `vietnamese`, `Playfair` + `latin-ext` |
| `components/GoogleTranslate.tsx` | Widget container CSS, cookie domain, `goog-te-combo` fallback |
| `scripts/migrate.ts` | `normalizeNFC` wrapper cho blogs, services, reviews, treatment_packages |
| `scripts/seed_blogs.mjs` | `normalizeNFC` wrapper, helper function |
| `scripts/seed_seo.mjs` | `normalizeNFC` wrapper, helper function |

---

## 📄 Pages mới
- **`/about`**: Giới thiệu salon (story, stats, values, services, location, CTA).
- **`/faq`**: Câu hỏi thường gặp (hero, DB‑driven FaqSection, contact card).
- **HeaderNav**: Thêm link `Giới Thiệu` và `Hỏi Đáp` trên cả Desktop nav (`NAV_ITEMS`) và Mobile pill bar (`MOBILE_NAV_ITEMS`).
- **BottomNavigation**: Thêm FAQ, cập nhật `isHome`.
- **Sitemap**: Thêm `/about` (0.7), `/faq` (0.7).
