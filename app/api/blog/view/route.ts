import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

    const supabase = await createClient();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = createHash('sha256').update(ip + 'min-salt').digest('hex');
    const userAgent = req.headers.get('user-agent') || '';

    await Promise.all([
      supabase.from('blog_views').insert({ post_id: postId, ip_hash: ipHash, user_agent: userAgent }),
      supabase.from('blog_stats').upsert(
        { post_id: postId, date: new Date().toISOString().split('T')[0] },
        { onConflict: 'post_id,date', ignoreDuplicates: false }
      ).then(() =>
        supabase.rpc('increment_blog_view', { p_post_id: postId })
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
