import webpush from 'web-push';

// Configuration
webpush.setVapidDetails(
  process.env.WEB_PUSH_EMAIL || 'mailto:hang.ntt0903@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function sendPushNotification(subscriptionJson: any, title: string, body: string, url: string = '/') {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification.');
    return { success: false, error: 'VAPID keys not configured' };
  }

  const payload = JSON.stringify({
    title,
    body,
    data: { url }
  });

  try {
    const response = await webpush.sendNotification(subscriptionJson, payload);
    return { success: true, response };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    // You might want to handle 410 Gone (subscription unsubscribed)
    return { success: false, error: error.message, statusCode: error.statusCode };
  }
}
