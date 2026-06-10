import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const createClient = () => {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return {
    from: () => {
      return {
        select: () => {
          return {
            eq: () => Promise.resolve({ data: [], error: null })
          };
        }
      };
    }
  };
};
