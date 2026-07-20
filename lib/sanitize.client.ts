"use client";

import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "h2", "h3", "h4", "h5", "h6", "span", "div"];
const ALLOWED_ATTR = ["href", "target", "rel", "class"];

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS, ALLOWED_ATTR });
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
