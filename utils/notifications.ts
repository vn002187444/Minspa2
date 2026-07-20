import { createClient } from '@/utils/supabase/server';
import { logger } from "@/lib/logger";

type RecipientType = 'user' | 'customer';

export async function insertNotification(
  recipientType: RecipientType,
  recipientId: string,
  title: string,
  content: string,
  link?: string
): Promise<{ success: boolean; error?: string }> {
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
    logger.error('[Notifications] Failed to insert notification', error instanceof Error ? error : undefined, { recipientType, recipientId, title });
    return { success: false, error: error.message };
  }
  return { success: true };
}
