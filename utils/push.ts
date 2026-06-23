import webpush from 'web-push';
import { createClient } from "@/utils/supabase/server";

export async function sendPushNotification(recipientId: string, title: string, body: string, url: string = '/') {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.WEB_PUSH_EMAIL || 'mailto:hang.ntt0903@gmail.com';

  if (!publicKey || !privateKey) {
    console.warn(`[PUSH] VAPID keys are missing from environment variables.`);
    return { success: false, error: 'VAPID keys not configured' };
  }

  webpush.setVapidDetails(
    email,
    publicKey,
    privateKey
  );

  const supabase = await createClient();

  // Try finding token in `users`
  let { data: user } = await supabase
    .from('users')
    .select('notification_token')
    .eq('id', recipientId)
    .single();

  let token = user?.notification_token;

  // Try finding token in `customers` if not found in `users`
  if (!token) {
    let { data: customer } = await supabase
      .from('customers')
      .select('notification_token')
      .eq('id', recipientId)
      .single();
    token = customer?.notification_token;
  }

  if (!token) {
    console.warn(`[PUSH] No notification token registered for recipient: ${recipientId}`);
    return { success: false, error: 'Recipient has no push subscription' };
  }

  try {
    const subscription = typeof token === 'string' ? JSON.parse(token) : token;
    const payload = JSON.stringify({
      title,
      body,
      data: { url }
    });

    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error: any) {
    // Clean up invalid/expired token
    if (error.statusCode === 410 || error.statusCode === 404) {
      await supabase.from('users').update({ notification_token: null }).eq('id', recipientId);
      await supabase.from('customers').update({ notification_token: null }).eq('id', recipientId);
    }
    return { success: false, error: error.message };
  }
}

