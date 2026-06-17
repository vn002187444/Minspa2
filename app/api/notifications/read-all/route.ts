import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
