import { describe, it, expect } from 'vitest'
import { sanitizeHtml, stripHtml } from '../sanitize'

describe('sanitizeHtml', () => {
  it('should allow safe tags', () => {
    const result = sanitizeHtml('<b>bold</b> <i>italic</i>')
    expect(result).toBe('<b>bold</b> <i>italic</i>')
  })

  it('should strip unsafe tags', () => {
    const result = sanitizeHtml('<script>alert("xss")</script><p>safe</p>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert(')
    expect(result).toContain('<p>safe</p>')
  })

  it('should strip event handlers', () => {
    const result = sanitizeHtml('<p onclick="alert(1)">text</p>')
    expect(result).toBe('<p>text</p>')
  })

  it('should strip javascript: links', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">link</a>')
    expect(result).toBe('<a>link</a>')
  })

  it('should allow safe attributes', () => {
    const result = sanitizeHtml('<a href="https://example.com" target="_blank">link</a>')
    expect(result).toContain('href="https://example.com"')
  })

  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('should not crash on nullish input', () => {
    expect(sanitizeHtml(null as any)).toBe('')
    expect(sanitizeHtml(undefined as any)).toBe('')
  })
})

describe('stripHtml', () => {
  it('should strip all HTML tags', () => {
    const result = stripHtml('<b>bold</b> <i>italic</i>')
    expect(result).toBe('bold italic')
  })

  it('should keep text content', () => {
    const result = stripHtml('<h1>Title</h1><p>Paragraph</p>')
    expect(result).toBe('TitleParagraph')
  })

  it('should handle nested tags', () => {
    const result = stripHtml('<div><p>Hello <b>World</b></p></div>')
    expect(result).toBe('Hello World')
  })

  it('should return empty string for empty input', () => {
    expect(stripHtml('')).toBe('')
  })
})
