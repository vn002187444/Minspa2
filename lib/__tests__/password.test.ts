import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../password'

describe('hashPassword', () => {
  it('should return a hash string', async () => {
    const hash = await hashPassword('password123')
    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
    expect(hash).not.toBe('password123')
  })

  it('should produce different hashes for same password', async () => {
    const [hash1, hash2] = await Promise.all([
      hashPassword('password123'),
      hashPassword('password123'),
    ])
    expect(hash1).not.toBe(hash2)
  })

  it('should produce different hashes for different passwords', async () => {
    const [hash1, hash2] = await Promise.all([
      hashPassword('password123'),
      hashPassword('password456'),
    ])
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  it('should return true for matching password', async () => {
    const hash = await hashPassword('password123')
    const result = await verifyPassword('password123', hash)
    expect(result).toBe(true)
  })

  it('should return false for wrong password', async () => {
    const hash = await hashPassword('password123')
    const result = await verifyPassword('wrongpassword', hash)
    expect(result).toBe(false)
  })

  it('should return false for empty password', async () => {
    const hash = await hashPassword('password123')
    const result = await verifyPassword('', hash)
    expect(result).toBe(false)
  })
})
