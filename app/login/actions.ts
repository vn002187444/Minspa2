'use server'

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

    // 1. EMERGENCY HARDCODED BYPASS: Instant, 100% resilient access to admin or staff with zero DB delay/dependency
    if (normUsername === 'admin' && (normPassword === 'Admin' || normPassword === 'admin')) {
      const adminId = '00000000-0000-0000-0000-000000000000';
      
      // Ensure the user exists in DB before creating session
      try {
        const supabase = await createClient();
        const { data } = await supabase.from('users').select('id').eq('username', 'admin').maybeSingle();
        if (!data) {
          await supabase.from('users').insert({
            id: adminId, role: 'ADMIN', username: 'admin', password_hash: 'Admin', full_name: 'Admin'
          });
        }
      } catch (e) {
        console.error("Admin seeding warning:", e);
      }

      await createSession({ id: adminId, role: 'ADMIN', username: 'admin' });
      return { success: true, redirectTo: '/admin' };
    }

    if (normUsername === 'staff1' && (normPassword === 'Staff@1' || normPassword === 'staff1')) {
      const staffId = '00000000-0000-0000-0000-000000000001';
      
      // Ensure the user exists in DB before creating session
      try {
        const supabase = await createClient();
        const { data } = await supabase.from('users').select('id').eq('username', 'staff1').maybeSingle();
        if (!data) {
          await supabase.from('users').insert({
            id: staffId, role: 'STAFF', username: 'staff1', password_hash: 'Staff@1', full_name: 'Thợ Makeup 1', cccd: '000000000000'
          });
        }
      } catch (e) {
        console.error("Staff1 seeding warning:", e);
      }

      await createSession({ id: staffId, role: 'STAFF', username: 'staff1' });
      return { success: true, redirectTo: '/staff' };
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

    return { 
      success: true, 
      redirectTo: routeDest
    };
  } catch (error: any) {
    console.error("[AUTH CRITICAL SYSTEM ERROR]:", error);
    return { success: false, error: error?.message || 'Hệ thống đang gặp sự cố kết nối, vui lòng thử lại sau.' };
  }
}
