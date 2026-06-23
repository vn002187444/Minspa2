import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

let _key: Uint8Array | null = null;
function getKey(): Uint8Array {
  if (!_key) {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[AUTH] JWT_SECRET is required in production environment');
      }
      console.warn('[AUTH] JWT_SECRET not set — using fallback key for development only');
    }
    _key = new TextEncoder().encode(secretKey || 'min-nail-hair-dev-secret-key-2026');
  }
  return _key;
}

export interface SessionPayload {
  user: { id: string; role: string; username: string };
  expires: Date;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getKey());
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, getKey(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(user: { id: string; role: string; username: string }) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });
  const cookieStore = await cookies();
  
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  const parsed = await decrypt(session);
  return parsed;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
