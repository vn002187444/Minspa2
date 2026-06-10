import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/app/login/actions';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await loginUser(null, formData);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API LOGIN ERROR]:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'Có lỗi xảy ra trong quá trình xử lý đăng nhập.'
    }, { status: 500 });
  }
}
