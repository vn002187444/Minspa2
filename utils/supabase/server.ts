import { createClient as createRealClient } from '@supabase/supabase-js';

/**
 * Creates and returns a real Supabase client using environment variables.
 * Throws an error if the required environment variables are not set.
 *
 * auth.getUser is overridden to use our custom JWT cookie-based session
 * (stored in the 'session' cookie) rather than Supabase's native auth,
 * because we use a custom `users` table for authentication.
 */
export const createClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      '[Supabase] Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set.'
    );
  }

  const client = createRealClient(url, key);

  // Override auth.getUser to resolve from our custom JWT cookie session,
  // since we manage users via a custom `users` table, not Supabase Auth.
  client.auth.getUser = async () => {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const session = cookieStore.get('session')?.value;
      if (session) {
        const { decrypt } = await import('@/utils/auth');
        const parsed = await decrypt(session);
        if (parsed && parsed.user) {
          return { data: { user: parsed.user }, error: null } as any;
        }
      }
    } catch (e) {
      // Session cookie not available (e.g. called outside request context)
    }
    return { data: { user: null }, error: null } as any;
  };

  return client;
};
