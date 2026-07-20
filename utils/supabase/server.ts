import { createClient as createRealClient } from '@supabase/supabase-js';

function createMockClient() {
  const noop = async () => ({ data: null, error: null });
  const builder = new Proxy(noop, { get(t, prop) {
    if (prop === 'auth') return { getUser: async () => ({ data: { user: null }, error: null }) };
    if (prop === 'rpc') return async () => ({ data: null, error: null });
    if (prop === 'from' || prop === 'select' || prop === 'eq' || prop === 'in' || prop === 'order' || prop === 'limit' || prop === 'single' || prop === 'insert' || prop === 'upsert' || prop === 'update' || prop === 'delete' || prop === 'match' || prop === 'filter' || prop === 'or' || prop === 'contains' || prop === 'textSearch' || prop === 'not' || prop === 'gte' || prop === 'lte' || prop === 'gt' || prop === 'lt' || prop === 'is' || prop === 'returns') return () => builder;
    return Reflect.get(t, prop);
  }});
  return builder as unknown as ReturnType<typeof createRealClient>;
}

/**
 * Creates and returns a real Supabase client using environment variables.
 * Returns a mock client when env vars are missing (e.g. during build).
 *
 * auth.getUser is overridden to use our custom JWT cookie-based session
 * (stored in the 'session' cookie) rather than Supabase's native auth,
 * because we use a custom `users` table for authentication.
 */
export const createClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return createMockClient();
  }

  const client = createRealClient(supabaseUrl, supabaseKey);

  client.auth.getUser = async () => {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const session = cookieStore.get('session')?.value;
      if (session) {
        const { decrypt } = await import('@/utils/auth');
        const parsed = await decrypt(session);
        if (parsed?.user) {
          return { data: { user: parsed.user as any }, error: null };
        }
      }
    } catch {
      // Session cookie not available (e.g. called outside request context)
    }
    return { data: { user: null }, error: null };
  };

  return client;
};
