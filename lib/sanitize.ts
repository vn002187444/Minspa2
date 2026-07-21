export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

let _purify: { sanitize: (..._args: any[]) => string } | null = null;

async function getPurify() {
  if (!_purify) {
    const [{ JSDOM }, DOMPurify] = await Promise.all([
      import('jsdom'),
      import('dompurify'),
    ]);
    const window = new JSDOM('').window;
    _purify = DOMPurify.default(window as any);
  }
  return _purify;
}

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export async function sanitizeHtml(dirty: string): Promise<string> {
  if (!dirty) return '';
  const purify = await getPurify();
  return purify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
