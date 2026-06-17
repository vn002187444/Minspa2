import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: existing, error: findErr } = await supabase
      .from('notifications')
      .select('id, recipient_id, recipient_type')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (existing.recipient_type !== 'user' || existing.recipient_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: updateErr } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
