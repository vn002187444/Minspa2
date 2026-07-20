import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as { __supabaseClient?: SupabaseClient };

export const createClient = (): SupabaseClient => {
  if (globalForSupabase.__supabaseClient) return globalForSupabase.__supabaseClient;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    globalForSupabase.__supabaseClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return globalForSupabase.__supabaseClient;
  }

  return {
    from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
    channel: () => ({} as any),
    removeChannel: () => {},
  } as unknown as SupabaseClient;
};
