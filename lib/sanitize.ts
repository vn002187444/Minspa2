import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return purify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return purify.sanitize(html, { ALLOWED_TAGS: [] });
}
