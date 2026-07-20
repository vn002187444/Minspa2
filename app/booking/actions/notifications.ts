'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { stripHtml } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

export async function getCustomerNotifications(customerId: string) {
  const session = await getSession();
  if (!session) {
    return [];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, content, link, is_read, created_at')
    .eq('recipient_type', 'customer')
    .eq('recipient_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    logger.error('[NOTIFICATIONS] Failed to fetch customer notifications:', error instanceof Error ? error : undefined);
    return [];
  }

  return (data || []).map(n => ({
    ...n,
    title: stripHtml(n.title || ''),
    content: stripHtml(n.content || ''),
  }));
}

export async function markCustomerNotificationRead(notificationId: string, customerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('recipient_type', 'customer')
    .eq('recipient_id', customerId);

  if (error) {
    logger.error('[NOTIFICATIONS] Failed to mark customer notification as read:', error instanceof Error ? error : undefined);
  }
}

export async function markAllCustomerNotificationsRead(customerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_type', 'customer')
    .eq('recipient_id', customerId)
    .eq('is_read', false);

  if (error) {
    logger.error('[NOTIFICATIONS] Failed to mark all customer notifications as read:', error instanceof Error ? error : undefined);
  }
}
