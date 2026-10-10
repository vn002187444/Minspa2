## 2026-07-07 - [Fix XSS Vulnerability]
**Vulnerability:** XSS vulnerability found in `app/admin/blog/page.tsx` where user content was rendered directly using `dangerouslySetInnerHTML={{ __html: content || '...' }}` without any sanitization.
**Learning:** Even internal admin pages need robust input sanitization, especially for dynamic blog content that might be synced or generated automatically. The `sanitizeHtml` utility from `@/lib/sanitize` was available but missed in this specific location.
**Prevention:** Always wrap dynamically generated HTML in a robust sanitization function (e.g., `sanitizeHtml(content)`) before passing it to `dangerouslySetInnerHTML`.
