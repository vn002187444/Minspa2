import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { stripHtml } from '@/lib/sanitize';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_type', 'user')
      .eq('recipient_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: (data || []).map(n => ({
        ...n,
        title: stripHtml(n.title || ''),
        content: stripHtml(n.content || ''),
      })),
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
