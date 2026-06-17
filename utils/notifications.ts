import { createClient } from '@/utils/supabase/server';

type RecipientType = 'user' | 'customer';

export async function insertNotification(
  recipientType: RecipientType,
  recipientId: string,
  title: string,
  content: string,
  link?: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from('notifications').insert({
    recipient_type: recipientType,
    recipient_id: recipientId,
    title,
    content,
    link: link || null,
    is_read: false,
  });
  if (error) {
    console.error('[NOTIFICATION] Insert error:', error);
  }
}
