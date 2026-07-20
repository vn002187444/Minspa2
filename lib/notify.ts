import { Resend } from 'resend';
import axios from 'axios';
import { logger } from './logger';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const resend = getResend();
    if (!resend) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'system@minnailhair.com',
      to,
      subject,
      html,
    });

    if (error) {
      logger.error(`Email failed to ${to}`, new Error(JSON.stringify(error)));
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err: unknown) {
    logger.error(`Email critical error to ${to}`, err instanceof Error ? err : undefined);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendZalo({ phone, message, templateId, params }: { phone: string; message?: string; templateId?: string; params?: Record<string, any> }) {
  try {
    const accessToken = process.env.ZALO_ACCESS_TOKEN;
    if (!accessToken) throw new Error('ZALO_ACCESS_TOKEN is missing');

    // Zalo requires user_id, not phone. In a real scenario, we map phone -> user_id.
    // For this implementation, we assume the target is a known OA follower.
    const payload = templateId 
      ? { recipient: { user_id: phone }, template: templateId, template_data: params }
      : { recipient: { user_id: phone }, message: { text: message } };

    const res = await axios.post(
      'https://openapi.zalo.me/v2.0/oa/message',
      payload,
      { headers: { 'access_token': accessToken, 'Content-Type': 'application/json' } }
    );

    return { success: true, data: res.data };
  } catch (err: unknown) {
    logger.error(`Zalo failed to ${phone}`, err instanceof Error ? err : undefined);
    return { success: false, error: err instanceof Error ? (err as any).response?.data?.error?.message || err.message : String(err) };
  }
}
