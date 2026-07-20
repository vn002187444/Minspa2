'use server'

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createSession } from '@/utils/auth';
import { verifyPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập').max(50),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(100),
});

async function doLogin(username: string, password: string): Promise<string> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, username, password_hash, full_name, is_active')
    .ilike('username', username)
    .single();

  if (error || !user) {
    throw new Error('Sai tên đăng nhập hoặc mật khẩu');
  }

  if (user.is_active === false) {
    throw new Error('Tài khoản đã bị vô hiệu hóa');
  }

  const userRoleNormalized = (user.role || '').trim().toUpperCase();
  const isPasswordCorrect = await verifyPassword(password, user.password_hash);

  if (!isPasswordCorrect) {
    throw new Error('Sai tên đăng nhập hoặc mật khẩu');
  }

  await createSession({ id: user.id, role: userRoleNormalized, username: user.username });

  return (userRoleNormalized === 'ADMIN' || userRoleNormalized === 'MANAGER') ? '/admin' : '/staff';
}

export async function loginUser(prevState: unknown, formData: FormData) {
  try {
    const raw = {
      username: formData.get('username'),
      password: formData.get('password'),
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { username, password } = parsed.data;
    const normUsername = username.trim().toLowerCase();
    const normPassword = password.trim();

    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    const rl = await rateLimit(`login:${ip}`, 5, 60);
    if (!rl.allowed) {
      return { success: false, message: 'Quá nhiều lần thử. Vui lòng thử lại sau 60 giây.' };
    }

    const dest = await doLogin(normUsername, normPassword);
    redirect(dest);
  } catch (error) {
    if (error instanceof Error && 'digest' in error && typeof (error as any).digest === 'string' && (error as any).digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return { success: false, message: error instanceof Error ? error.message : 'Hệ thống đang gặp sự cố kết nối, vui lòng thử lại sau.' };
  }
}
