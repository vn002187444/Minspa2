# Blog SEO & AI Upgrade Plan

## Phase 1 — Critical SEO Fixes (HIGH)
| # | Task | File | Est. |
|---|------|------|------|
| 1 | Add `OG:article:published_time`, `modified_time`, `author`, `tag` | `app/blog/[slug]/page.tsx` | 10min |
| 2 | Add `<meta name="keywords">` to detail page | `app/blog/[slug]/page.tsx` | 5min |
| 3 | Fetch `updated_at` from DB (currently missing → `dateModified` stale) | `app/blog/actions.ts` | 5min |
| 4 | Filter sitemap by `published = true` (exclude drafts) | `app/sitemap.ts` | 5min |
| 5 | Remove duplicate `/about`, `/faq` from sitemap | `app/sitemap.ts` | 2min |
| 6 | Use `COALESCE(updated_at, created_at)` for sitemap `lastModified` | `app/sitemap.ts` | 3min |
| 7 | Remove `h1` from sanitizer ALLOWED_TAGS (prevents duplicate H1) | `lib/sanitize.ts` | 2min |

## Phase 2 — Medium SEO Fixes
| # | Task | File | Est. |
|---|------|------|------|
| 8 | Fix heading hierarchy: wrap cards in `<h2>` section heading | `app/blog/page.tsx` | 10min |
| 9 | Add `rel="prev"` / `rel="next"` to pagination links | `app/blog/page.tsx` | 5min |
| 10 | Increase blog list OG image to 1200x630 | `app/blog/page.tsx` | 3min |
| 11 | Use absolute URLs in JSON-LD `@id` (remove `#article`, `#breadcrumb-N`) | `components/ArticleSchema.tsx`, `components/BreadcrumbSchema.tsx` | 10min |
| 12 | Add `keywords` + `robots` meta to list page | `app/blog/page.tsx` | 3min |

## Phase 3 — AI Integration
| # | Task | File | Est. |
|---|------|------|------|
| 13 | Create AI blog assistant: suggest keywords, meta desc, summary via Google GenAI | `app/admin/blog/AIAssistant.tsx` + API route | 2h |
| 14 | Add internal link suggester between related posts | `app/admin/blog/LinkSuggester.tsx` | 1h |
| 15 | Add schema `articleSection` auto-detect from content keywords | `app/blog/[slug]/page.tsx` | 30min |
| 16 | Generate AI alt text for blog images | `app/admin/blog/AltTextGenerator.tsx` | 45min |

## Phase 4 — Content Quality (User action needed in admin)
| # | Task | Guide |
|---|------|-------|
| 17 | Add `\n\n` before each `### Header` in blog content | Fixes header detection in markdown parser |
| 18 | Break long paragraphs (>3 sentences) into shorter ones | Improves readability + AI parseability |
| 19 | Use `* item` for benefit lists instead of inline commas | Renders as proper `<ul>` with prose styling |
| 20 | Add internal links between related posts | Boosts topical authority + dwell time |
| 21 | Write unique `summary` (≠ first paragraph, 120-160 chars) | Required for rich snippets + OG |
| 22 | Add real images to content body via `![alt](url)` | Prose styles images with rounded-xl |
