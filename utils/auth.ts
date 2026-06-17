import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET;
if (!secretKey && process.env.NODE_ENV === 'production') {
  console.warn('[AUTH] JWT_SECRET not set — using fallback key (insecure in production)');
}
const safeKey = secretKey || 'min-nail-hair-super-secret-key-24h';
const key = new TextEncoder().encode(safeKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function createSession(user: { id: string; role: string; username: string }) {
  console.log(`[AUTH] createSession called for user: ${user.username}, role: ${user.role}`);
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
  console.log(`[AUTH] createSession successfully set cookie for: ${user.username}`);
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) {
    console.log(`[AUTH] getSession: No session cookie found.`);
    return null;
  }
  try {
    const parsed = await decrypt(session);
    console.log(`[AUTH] getSession: Session valid. User ID: ${parsed.user.id}, Role: ${parsed.user.role}`);
    return parsed;
  } catch (error) {
    console.error(`[AUTH] getSession: Session decryption failed!`, error);
    return null;
  }
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
