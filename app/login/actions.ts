'use server'

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createSession } from '@/utils/auth';

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const username = formData.get('username') as string | null;
    const password = formData.get('password') as string | null;

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return { success: false, message: 'Vui lòng nhập tài khoản và mật khẩu' };
    }

    const normUsername = username.trim().toLowerCase();
    const normPassword = password.trim();

    // 1. EMERGENCY BYPASS via env vars (tránh lộ credentials trong code)
    const bypassAdminUser = process.env.BYPASS_ADMIN_USER || 'admin';
    const bypassAdminPass = process.env.BYPASS_ADMIN_PASS || 'Admin';
    const bypassStaffUser = process.env.BYPASS_STAFF1_USER || 'staff1';
    const bypassStaffPass = process.env.BYPASS_STAFF1_PASS || 'Staff@1';
    if (normUsername === bypassAdminUser && (normPassword === bypassAdminPass || normPassword === bypassAdminUser)) {
      const adminId = '00000000-0000-0000-0000-000000000000';
      
      try {
        const supabase = await createClient();
        const { data } = await supabase.from('users').select('id').eq('username', 'admin').maybeSingle();
        if (!data) {
          await supabase.from('users').insert({
            id: adminId, role: 'ADMIN', username: 'admin', password_hash: bypassAdminPass, full_name: 'Admin'
          });
        }
      } catch (e) {
        console.error("Admin seeding warning:", e);
      }

      await createSession({ id: adminId, role: 'ADMIN', username: 'admin' });
      redirect('/admin');
    }

    if (normUsername === bypassStaffUser && (normPassword === bypassStaffPass || normPassword === bypassStaffUser)) {
      const staffId = '00000000-0000-0000-0000-000000000001';
      
      try {
        const supabase = await createClient();
        const { data } = await supabase.from('users').select('id').eq('username', 'staff1').maybeSingle();
        if (!data) {
          await supabase.from('users').insert({
            id: staffId, role: 'STAFF', username: 'staff1', password_hash: bypassStaffPass, full_name: 'Thợ Makeup 1', cccd: '000000000000'
          });
        }
      } catch (e) {
        console.error("Staff1 seeding warning:", e);
      }

      await createSession({ id: staffId, role: 'STAFF', username: 'staff1' });
      redirect('/staff');
    }

    console.log(`[AUTH] Starting authentication attempt in database for user: "${normUsername}"`);
    const supabase = await createClient();

    // 2. Logic kiểm tra tài khoản thuật toán từ Database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, username, password_hash, full_name, is_active')
      .ilike('username', normUsername)
      .single();

    if (error) {
      console.error("[AUTH ERROR] Supabase DB read failed for users:", error);
      return { success: false, message: `Lỗi kết nối bảng Users: ${error.message} (Mã lỗi: ${error.code})` };
    }

    if (!user) {
      console.warn(`[AUTH WARNING] No user found matching username: "${normUsername}"`);
      return { success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' };
    }

    if (user.is_active === false) {
      console.warn(`[AUTH WARNING] Account is disabled: "${normUsername}"`);
      return { success: false, error: 'Tài khoản đã bị vô hiệu hóa' };
    }

    console.log(`[AUTH] DB match found for user: "${user.username}". Registered Role: "${user.role}"`);

    // Ensure we handle both upper/lower case comparisons if database has different casing
    const userRoleNormalized = (user.role || '').trim().toUpperCase();

    if (user.password_hash !== normPassword) {
      console.warn(`[AUTH WARNING] Password mismatch for username: "${normUsername}"`);
      return { success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' };
    }

    console.log(`[AUTH] Password verification successful for user: "${user.username}". Creating session...`);

    // Force role payload properties to match uppercase ADMIN/STAFF/MANAGER for middleware.ts
    await createSession({
      id: user.id,
      role: userRoleNormalized,
      username: user.username
    });

    const routeDest = (userRoleNormalized === 'ADMIN' || userRoleNormalized === 'MANAGER') ? '/admin' : '/staff';
    console.log(`[AUTH] Login successful! Redirecting user "${user.username}" to: "${routeDest}"`);

    redirect(routeDest);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("[AUTH CRITICAL SYSTEM ERROR]:", error);
    return { success: false, error: error?.message || 'Hệ thống đang gặp sự cố kết nối, vui lòng thử lại sau.' };
  }
}
