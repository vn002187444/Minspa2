import { unstable_cache } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { normalizeNFC } from '@/lib/utils';

/**
 * Wrapper to cache Supabase calls and normalize all text to NFC.
 */
export async function cachedFetch<T>(key: string, fn: () => Promise<T>, revalidate = 3600): Promise<T> {
  return unstable_cache(
    async () => {
      const data = await fn();
      return normalizeNFC(data);
    },
    [key],
    { revalidate }
  )();
}

// --- Specific Caches for Homepage ---

export async function getCachedSeoSettings() {
  return cachedFetch('homepage-seo-settings', async () => {
    const supabase = await createClient();
    const { data } = await supabase.from('seo_settings').select('hotline, facebook_url, zalo_url, logo_url').eq('id', 1).single();
    return data;
  }, 3600);
}

export async function getCachedServices() {
  return cachedFetch('homepage-services', async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('services')
      .select('id, name, category, price, duration, description, image_url, is_active')
      .eq('is_active', true)
      .order('price', { ascending: true });
    return data || [];
  }, 3600);
}

export async function getCachedTreatmentPackages() {
  return cachedFetch('homepage-packages', async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('treatment_packages')
      .select('id, name, buy_count, free_count, price, total_sessions, service_id, services(name, price)')
      .eq('is_active', true)
      .order('price', { ascending: true });
    return data || [];
  }, 3600);
}

export async function getCachedBlogPosts() {
  return cachedFetch('homepage-blog-posts', async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('blogs')
      .select('id, title, slug, summary, image_url, image_alt, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3);
    return data || [];
  }, 3600);
}
