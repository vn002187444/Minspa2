const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div']);
const ALLOWED_ATTR = new Set(['href', 'target', 'rel', 'class']);

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<(\/?)(\w+)([^>]*)>/g, (match, close, tag, attrs) => {
      if (ALLOWED_TAGS.has(tag.toLowerCase())) {
        if (close) return `</${tag}>`;
        const safeAttrs = attrs.replace(/(\w+)\s*=\s*"[^"]*"/g, (attrMatch: string, name: string) => {
          return ALLOWED_ATTR.has(name) ? attrMatch : '';
        });
        return `<${tag}${safeAttrs}>`;
      }
      return '';
    });
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}
