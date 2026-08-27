import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rl = await rateLimit(`read-all:${session.user.id}`, 5, 60);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, { status: 429 });
    }

    const supabase = await createClient();

    // Count unread before updating
    const { count: beforeCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_type', 'user')
      .eq('recipient_id', session.user.id)
      .eq('is_read', false);

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_type', 'user')
      .eq('recipient_id', session.user.id)
      .eq('is_read', false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updatedCount: beforeCount || 0 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
