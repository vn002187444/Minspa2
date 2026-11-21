import bcrypt from 'bcryptjs';

/**
 * Hash a plaintext password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify a plaintext password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
  // Disallow plaintext password comparison in production
  return false;
}
