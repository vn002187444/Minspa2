'use server'

import {
  createClient, getSession, revalidatePath,
  hashPassword, verifyPassword, stripHtml, cachedFetch,
  checkAdminOrManager, redirect,
} from "./_shared";
import { logger } from "@/lib/logger";

export async function getReviews() {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, rating, quick_tags, comment, created_at,
        appointments (
          status, start_time,
          customers (full_name, phone),
          users (full_name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data || [];
  } catch (e) {
    logger.error('[Database] Failed to fetch reviews', e instanceof Error ? e : undefined);
    return [];
  }
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Chưa đăng nhập hoặc phiên làm việc hết hạn' };
  }
  const userId = session.user.id;
  const supabase = await createClient();

  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (fetchErr || !user) {
    return { success: false, error: 'Không tìm thấy tài khoản người dùng trong hệ thống' };
  }

  const isOldPasswordCorrect = await verifyPassword(oldPassword, user.password_hash);
  if (!isOldPasswordCorrect) {
    return { success: false, error: 'Mật khẩu cũ nhập vào không chính xác' };
  }

  const hashedNewPassword = await hashPassword(newPassword);
  const { error: updateErr } = await supabase
    .from('users')
    .update({ password_hash: hashedNewPassword })
    .eq('id', userId);

  if (updateErr) {
    return { success: false, error: 'Lỗi cập nhật mật khẩu mới: ' + updateErr.message };
  }

  return { success: true };
}

export async function getBannerSettings() {
  return cachedFetch('banner-settings', async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('banner_settings').select('is_enabled, content').eq('id', 1).single();
      if (error) throw error;
      if (data) {
        return {
          is_enabled: data.is_enabled,
          content: stripHtml(data.content || ''),
        };
      }
    } catch (e: unknown) {
      logger.error('Failed to fetch banner settings', e instanceof Error ? e : undefined);
    }
    let hotline = '0934 323 878';
    try {
      const supabase = await createClient();
      const { data: seo } = await supabase.from('seo_settings').select('hotline').eq('id', 1).single();
      if (seo?.hotline) hotline = seo.hotline;
      return { is_enabled: false, content: hotline };
    } catch (e) {
      logger.error('[Database] Failed to fetch banner settings', e instanceof Error ? e : undefined);
      return { is_enabled: false, content: hotline };
    }
  });
}

export async function saveBannerSettings(payload: { is_enabled?: boolean; content?: string }) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('banner_settings').upsert({
      id: 1,
      is_enabled: payload.is_enabled,
      content: stripHtml(payload.content || ''),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    logger.error('Failed to save banner settings', e instanceof Error ? e : undefined);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getThemeSettings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('seo_settings').select('theme_override, theme_particles_enabled').eq('id', 1).single();
      return {
        override: data?.theme_override || null,
        particlesEnabled: data?.theme_particles_enabled ?? true,
      };
    } catch (e) {
      logger.error('[Database] Failed to fetch theme settings', e instanceof Error ? e : undefined);
      return { override: null, particlesEnabled: true };
    }
}

export async function saveThemeSettings(payload: { override: string | null; particlesEnabled: boolean }) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_settings').upsert({
      id: 1,
      theme_override: payload.override || null,
      theme_particles_enabled: payload.particlesEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getMascotSettings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('seo_settings').select('mascot_enabled, mascot_character, mascot_sound').eq('id', 1).single();
      return {
        enabled: data?.mascot_enabled ?? true,
        character: data?.mascot_character || 'min',
        soundEnabled: data?.mascot_sound ?? true,
      };
    } catch (e) {
      logger.error('[Database] Failed to fetch mascot settings', e instanceof Error ? e : undefined);
      return { enabled: true, character: 'min', soundEnabled: true };
    }
}

export async function saveMascotSettings(payload: { enabled: boolean; character: string; soundEnabled: boolean }) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_settings').upsert({
      id: 1,
      mascot_enabled: payload.enabled,
      mascot_character: payload.character,
      mascot_sound: payload.soundEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getFaqs() {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function createFaq(payload: {
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();

  const { error } = await supabase
    .from('faqs')
    .insert({
      question: payload.question,
      answer: payload.answer,
      category: payload.category || 'general',
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    });
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function updateFaq(id: string, updates: Partial<{
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}>) {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();

  const { error } = await supabase
    .from('faqs')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function deleteFaq(id: string) {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();

  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin');
}

export async function reorderFaqs(sortedIds: string[]) {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();

  const updates = sortedIds.map((id, idx) => ({ id, sort_order: idx }));
  const { error } = await supabase
    .from('faqs')
    .upsert(updates, { onConflict: 'id' });
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}
