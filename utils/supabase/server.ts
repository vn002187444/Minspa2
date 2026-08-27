import { createClient as createRealClient } from '@supabase/supabase-js';

function buildClient(supabaseUrl: string, supabaseKey: string) {
  const client = createRealClient(supabaseUrl, supabaseKey);

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
}

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing. Set it in .env.');
  return url;
}

/**
 * Privileged client — uses SERVICE_ROLE_KEY, BYPASSES RLS.
 * Chỉ dùng cho: cron jobs, admin actions, login flow.
 * Không dùng cho queries thường của user (sẽ bỏ qua RLS).
 */
export const createServiceClient = async () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
  return buildClient(supabaseUrl, supabaseKey);
};

/**
 * RLS-respecting client — uses ANON_KEY, tôn trọng RLS policies.
 * Dùng cho: queries thường (customers, appointments, notifications).
 * Cần bật RLS + tạo policies cho các bảng có PII.
 */
export const createAnonClient = async () => {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Set it in .env.');
  return buildClient(supabaseUrl, anonKey);
};

/**
 * @deprecated Dùng createServiceClient hoặc createAnonClient thay thế.
 * Giữ lại để backward compat — hiện tại alias của createServiceClient.
 */
export const createClient = createServiceClient;
