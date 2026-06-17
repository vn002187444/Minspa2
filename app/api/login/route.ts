import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { encrypt } from '@/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const username = formData.get('username') as string | null;
    const password = formData.get('password') as string | null;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu' }, { status: 400 });
    }

    const normUsername = username.trim().toLowerCase();
    const normPassword = password.trim();

    let userPayload: { id: string; role: string; username: string } | null = null;
    let routeDest = '';

    // Emergency bypass
    if (normUsername === 'admin' && (normPassword === 'Admin' || normPassword === 'admin')) {
      userPayload = { id: '00000000-0000-0000-0000-000000000000', role: 'ADMIN', username: 'admin' };
      routeDest = '/admin';
    } else if (normUsername === 'staff1' && (normPassword === 'Staff@1' || normPassword === 'staff1')) {
      userPayload = { id: '00000000-0000-0000-0000-000000000001', role: 'STAFF', username: 'staff1' };
      routeDest = '/staff';
    } else {
      const supabase = await createClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('id, role, username, password_hash')
        .ilike('username', normUsername)
        .single();

      if (error || !user) {
        return NextResponse.json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
      }

      if (user.password_hash !== normPassword) {
        return NextResponse.json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
      }

      const roleNormalized = (user.role || '').trim().toUpperCase();
      userPayload = { id: user.id, role: roleNormalized, username: user.username };
      routeDest = (roleNormalized === 'ADMIN' || roleNormalized === 'MANAGER') ? '/admin' : '/staff';
    }

    // Set session cookie directly on response
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ user: userPayload, expires });

    const response = NextResponse.json({ success: true, redirectTo: routeDest });
    response.cookies.set('session', session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[API LOGIN ERROR]:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'Có lỗi xảy ra trong quá trình xử lý đăng nhập.'
    }, { status: 500 });
  }
}
