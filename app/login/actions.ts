'use server'

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createSession } from '@/utils/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

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

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const username = formData.get('username') as string | null;
    const password = formData.get('password') as string | null;

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return { success: false, message: 'Vui lòng nhập tài khoản và mật khẩu' };
    }

    const normUsername = username.trim().toLowerCase();
    const normPassword = password.trim();

    // 1. EMERGENCY BYPASS via env vars (bắt buộc set trong production)
    const bypassAdminUser = process.env.BYPASS_ADMIN_USER;
    const bypassAdminPass = process.env.BYPASS_ADMIN_PASS;
    const bypassStaffUser = process.env.BYPASS_STAFF1_USER;
    const bypassStaffPass = process.env.BYPASS_STAFF1_PASS;

    if (bypassAdminUser && bypassAdminPass && normUsername === bypassAdminUser && (normPassword === bypassAdminPass || normPassword === bypassAdminUser)) {
      try {
        const supabase = await createClient();
        const { data } = await supabase.from('users').select('id').eq('username', 'admin').maybeSingle();
        if (!data) {
          const hashedBypassAdminPass = await hashPassword(bypassAdminPass);
          await supabase.from('users').insert({
            id: '00000000-0000-0000-0000-000000000000', role: 'ADMIN', username: 'admin', password_hash: hashedBypassAdminPass, full_name: 'Admin'
          });
        }
      } catch (e) {
        console.error("Admin seeding warning:", e);
      }
      await createSession({ id: '00000000-0000-0000-0000-000000000000', role: 'ADMIN', username: 'admin' });
      redirect('/admin');
    }

    if (bypassStaffUser && bypassStaffPass && normUsername === bypassStaffUser && (normPassword === bypassStaffPass || normPassword === bypassStaffUser)) {
      try {
        const supabase = await createClient();
        const { data } = await supabase.from('users').select('id').eq('username', 'staff1').maybeSingle();
        if (!data) {
          const hashedBypassStaffPass = await hashPassword(bypassStaffPass);
          await supabase.from('users').insert({
            id: '00000000-0000-0000-0000-000000000001', role: 'STAFF', username: 'staff1', password_hash: hashedBypassStaffPass, full_name: 'Thợ Makeup 1', cccd: '000000000000'
          });
        }
      } catch (e) {
        console.error("Staff1 seeding warning:", e);
      }
      await createSession({ id: '00000000-0000-0000-0000-000000000001', role: 'STAFF', username: 'staff1' });
      redirect('/staff');
    }

    const dest = await doLogin(normUsername, normPassword);
    redirect(dest);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    return { success: false, message: error?.message || 'Hệ thống đang gặp sự cố kết nối, vui lòng thử lại sau.' };
  }
}
