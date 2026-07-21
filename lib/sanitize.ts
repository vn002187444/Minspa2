const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'img', 'blockquote', 'hr', 'pre', 'code']);
const ALLOWED_ATTR = new Set(['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'loading']);

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
const ATTR_RE = /\s+([a-zA-Z-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
const SRC_RE = /^\s*(https?:|\/)/i;

function stripUnsafe(input: string): string {
  return input.replace(/javascript:/gi, '').replace(/on\w+=/gi, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  let s = stripUnsafe(dirty);
  s = s.replace(TAG_RE, (full, tag) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return '';
    const closing = full.startsWith('</');
    if (closing) return `</${lower}>`;
    const attrs: string[] = [];
    let m: RegExpExecArray | null;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(full)) !== null) {
      const name = m[1].toLowerCase();
      if (!ALLOWED_ATTR.has(name)) continue;
      if (name === 'src' || name === 'href') {
        const val = (m[2] || '').replace(/^["']|["']$/g, '');
        if (!SRC_RE.test(val)) continue;
      }
      attrs.push(m[0].trim());
    }
    const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
    return `<${lower}${attrStr}>`;
  });
  return s;
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
