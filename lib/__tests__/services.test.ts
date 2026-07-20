import { describe, it, expect } from 'vitest'
import { normalizeServiceCategory, groupServicesByCategory, SERVICE_CATEGORIES } from '../services'

describe('SERVICE_CATEGORIES', () => {
  it('should contain all expected categories', () => {
    expect(SERVICE_CATEGORIES).toContain('Chăm Sóc & Trang Trí Móng')
    expect(SERVICE_CATEGORIES).toContain('Gội dưỡng sinh')
    expect(SERVICE_CATEGORIES).toContain('Massage')
    expect(SERVICE_CATEGORIES).toContain('Deal Chấn Động')
    expect(SERVICE_CATEGORIES).toContain('Chà Gót Chân')
  })
})

describe('normalizeServiceCategory', () => {
  it('should map "Móng" to "Chăm Sóc & Trang Trí Móng"', () => {
    expect(normalizeServiceCategory('Móng')).toBe('Chăm Sóc & Trang Trí Móng')
  })

  it('should map lowercase "móng" to nail category', () => {
    expect(normalizeServiceCategory('móng tay')).toBe('Chăm Sóc & Trang Trí Móng')
  })

  it('should map "nail" to nail category', () => {
    expect(normalizeServiceCategory('nail art')).toBe('Chăm Sóc & Trang Trí Móng')
  })

  it('should map "Deal" to "Deal Chấn Động"', () => {
    expect(normalizeServiceCategory('Deal')).toBe('Deal Chấn Động')
  })

  it('should map lowercase "deal" to deal category', () => {
    expect(normalizeServiceCategory('deal combo')).toBe('Deal Chấn Động')
  })

  it('should map "Gội dưỡng sinh" correctly', () => {
    expect(normalizeServiceCategory('Gội Dưỡng Sinh')).toBe('Gội dưỡng sinh')
  })

  it('should return trimmed input for unknown categories', () => {
    expect(normalizeServiceCategory('Khác')).toBe('Khác')
  })

  it('should handle null input', () => {
    expect(normalizeServiceCategory(null)).toBe('Khác')
  })

  it('should handle undefined input', () => {
    expect(normalizeServiceCategory(undefined)).toBe('Khác')
  })

  it('should handle empty string', () => {
    expect(normalizeServiceCategory('')).toBe('Khác')
  })
})

describe('groupServicesByCategory', () => {
  const services = [
    { id: '1', name: 'Sơn gel', category: 'Móng', price: 110000 },
    { id: '2', name: 'Gội thư giãn', category: 'Gội dưỡng sinh', price: 69000 },
    { id: '3', name: 'Massage Body', category: 'Massage', price: 300000 },
    { id: '4', name: 'Combo Sơn Gel', category: 'Deal', price: 99000 },
  ]

  it('should group services by normalized category', () => {
    const grouped = groupServicesByCategory(services)
    expect(Object.keys(grouped)).toContain('Chăm Sóc & Trang Trí Móng')
    expect(Object.keys(grouped)).toContain('Gội dưỡng sinh')
    expect(Object.keys(grouped)).toContain('Massage')
    expect(Object.keys(grouped)).toContain('Deal Chấn Động')
  })

  it('should place services in correct groups', () => {
    const grouped = groupServicesByCategory(services)
    expect(grouped['Chăm Sóc & Trang Trí Móng']).toHaveLength(1)
    expect(grouped['Chăm Sóc & Trang Trí Móng'][0].name).toBe('Sơn gel')
  })

  it('should handle empty array', () => {
    const grouped = groupServicesByCategory([])
    expect(Object.keys(grouped)).toHaveLength(0)
  })
})
