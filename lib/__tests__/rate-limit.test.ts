import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit } from '../rate-limit'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockMaybeSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()

  // .from('rate_limits') returns { select, insert, update }
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  })

  // .select(...) returns { eq }
  mockSelect.mockReturnValue({
    eq: mockEq,
  })

  // .eq('key', key) returns { maybeSingle } for reads, or Promise<{error}> for writes
  mockEq.mockReturnValue({
    maybeSingle: mockMaybeSingle,
  })

  // .update(...) returns { eq }
  mockUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })

  // .insert(...) returns Promise
  mockInsert.mockResolvedValue({ error: null })
})

describe('rateLimit', () => {
  it('should allow request when no prior record exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await rateLimit('test-key', 10, 60)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('should allow request within limit', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { request_count: 1, last_request: new Date().toISOString() },
      error: null,
    })

    const result = await rateLimit('test-key', 10, 60)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(8)
  })

  it('should block request when limit exceeded', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { request_count: 10, last_request: new Date().toISOString() },
      error: null,
    })

    const result = await rateLimit('test-key', 10, 60)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset after window expires', async () => {
    const oldTime = new Date(Date.now() - 120000).toISOString()
    mockMaybeSingle.mockResolvedValue({
      data: { request_count: 10, last_request: oldTime },
      error: null,
    })

    const result = await rateLimit('test-key', 10, 60)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('should fail open on DB error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('DB down') })

    const result = await rateLimit('test-key', 10, 60)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(10)
  })
})
