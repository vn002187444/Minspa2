import { describe, it, expect, vi, beforeAll } from 'vitest'
import { encrypt, decrypt } from '@/utils/auth'

// jose uses crypto.subtle which isn't available in jsdom
// Mock the underlying key to avoid the dependency
const mockSign = vi.fn()
const mockVerify = vi.fn()

vi.mock('jose', () => ({
  SignJWT: class {
    setProtectedHeader() { return this }
    setIssuedAt() { return this }
    setExpirationTime() { return this }
    sign() { return mockSign() }
  },
  jwtVerify: (...args: unknown[]) => mockVerify(...args),
}))

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key'
})

describe('encrypt / decrypt', () => {
  it('should call SignJWT and return token', async () => {
    mockSign.mockResolvedValue('mock-jwt-token')
    const token = await encrypt({
      user: { id: 'u1', role: 'STAFF', username: 'staff1' },
      expires: new Date(Date.now() + 86400000),
    })
    expect(token).toBe('mock-jwt-token')
  })

  it('should return payload on valid token', async () => {
    const payload = { user: { id: 'u1', role: 'STAFF', username: 'staff1' }, expires: new Date() }
    mockVerify.mockResolvedValue({ payload })
    const result = await decrypt('valid-token')
    expect(result?.user.id).toBe('u1')
    expect(result?.user.role).toBe('STAFF')
  })

  it('should return null for invalid token', async () => {
    mockVerify.mockRejectedValue(new Error('invalid'))
    const result = await decrypt('bad-token')
    expect(result).toBeNull()
  })
})
