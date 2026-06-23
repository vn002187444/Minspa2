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

  const client = createRealClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url && url.startsWith('https://api.supabase.com/')) {
          return Promise.resolve(new Response(null, { status: 200 }));
        }
        return fetch(input, init);
      },
    },
  });

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
