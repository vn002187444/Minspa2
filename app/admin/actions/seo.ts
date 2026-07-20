'use server'

import {
  createClient, getSession, normalizeNFC,
  checkAdminOrManager, SeoInput,
} from "./_shared";
import { logger } from "@/lib/logger";
import { uploadBase64ToStorage } from "./services";

export async function getSeoSettings() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('seo_settings').select('page_title, meta_description, meta_keywords, og_image_url, logo_url, online_discount_enabled, online_discount_percent, default_commission_percent, hotline, facebook_url, zalo_url').eq('id', 1).single();
    if (error) throw error;
    if (data) {
      return {
        page_title: data.page_title,
        meta_description: data.meta_description,
        meta_keywords: data.meta_keywords,
        og_image_url: data.og_image_url,
        logo_url: data.logo_url || '',
        online_discount_enabled: data.online_discount_enabled !== false,
        online_discount_percent: data.online_discount_percent ?? 5,
        default_commission_percent: data.default_commission_percent ?? 15,
        hotline: data.hotline || '0934 323 878',
        facebook_url: data.facebook_url || 'https://facebook.com/minnailhair',
        zalo_url: data.zalo_url || 'https://zalo.me/0934323878',
      };
    }
  } catch (e: unknown) {
    logger.error('Failed to fetch SEO settings', e instanceof Error ? e : undefined);
  }
  return { page_title: '', meta_description: '', meta_keywords: '', og_image_url: '', logo_url: '', online_discount_enabled: true, online_discount_percent: 5, default_commission_percent: 15, hotline: '0934 323 878', facebook_url: 'https://facebook.com/minnailhair', zalo_url: 'https://zalo.me/0934323878' };
}

export async function saveSeoSettings(payload: SeoInput) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_settings').upsert({
      id: 1,
      page_title: payload.page_title,
      meta_description: payload.meta_description,
      meta_keywords: payload.meta_keywords,
      og_image_url: payload.og_image_url,
      logo_url: payload.logo_url || '',
      online_discount_enabled: payload.online_discount_enabled !== false,
      online_discount_percent: payload.online_discount_percent ?? 5,
      default_commission_percent: payload.default_commission_percent ?? 15,
      hotline: payload.hotline || '0934 323 878',
      facebook_url: payload.facebook_url || 'https://facebook.com/minnailhair',
      zalo_url: payload.zalo_url || 'https://zalo.me/0934323878',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    logger.error('Failed to save SEO settings', e instanceof Error ? e : undefined);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getSeoArticles() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_articles')
      .select('id, created_at, topic, keywords, article, image_url, image_alt, status, topic_source, blog_slug, published_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data || []).map((a: {
      id: string; created_at: string; topic: string; keywords: string; article: string;
      image_url: string | null; image_alt: string | null; status: string;
      topic_source: string; blog_slug: string | null; published_at: string | null;
    }) => {
      const n = normalizeNFC(a)
      return {
        id: n.id,
        createdAt: n.created_at,
        topic: n.topic,
        keywords: n.keywords,
        article: n.article,
        imageUrl: n.image_url,
        imageAlt: n.image_alt,
        status: n.status,
        topicSource: n.topic_source,
        blogSlug: n.blog_slug,
        publishedAt: n.published_at,
      }
    });
  } catch (e: unknown) {
    logger.error('Failed to fetch SEO articles', e instanceof Error ? e : undefined);
  }
  return [];
}

export async function getSeoArticleById(id: string) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_articles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return normalizeNFC(data);
  } catch (e: unknown) {
    logger.error('Failed to fetch SEO article by ID', e instanceof Error ? e : undefined);
    return null;
  }
}

export async function saveSeoArticle(article: Record<string, unknown>) {
  await checkAdminOrManager();
  try {
    const imageUrl = await uploadBase64ToStorage(String(article.image_url || article.imageUrl || ''));
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('seo_articles')
      .select('id')
      .eq('id', article.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('seo_articles')
        .update({
          topic: normalizeNFC(article.topic),
          keywords: normalizeNFC(article.keywords),
          article: normalizeNFC(article.article),
          image_url: imageUrl,
          image_alt: normalizeNFC(article.image_alt || article.imageAlt || null),
          status: article.status || 'draft',
        })
        .eq('id', article.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('seo_articles')
        .insert({
          id: article.id || 'art_' + Math.random().toString(36).substring(2, 11),
          topic: normalizeNFC(article.topic),
          keywords: normalizeNFC(article.keywords),
          article: normalizeNFC(article.article),
          image_url: imageUrl,
          image_alt: normalizeNFC(article.image_alt || article.imageAlt || null),
          status: article.status || 'draft',
          created_at: article.createdAt || new Date().toISOString(),
        });
      if (error) throw error;
    }
    return { success: true };
  } catch (e: unknown) {
    logger.error('Failed to save SEO article', e instanceof Error ? e : undefined);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteSeoArticle(id: string) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_articles').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    logger.error('Failed to delete SEO article', e instanceof Error ? e : undefined);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function publishSeoArticleToBlog(
  articleText: string,
  imageUrl: string,
  options?: { title?: string; slug?: string; keywords?: string; image_alt?: string }
) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }

  const title = options?.title
    || (articleText.match(/^#\s+(.+)/m)?.[1]?.trim())
    || articleText.split('\n').find(l => l.trim().startsWith('## '))?.replace(/^##\s+/, '').trim()
    || articleText.split('\n')[0].replace(/^#+\s*/, '').trim().substring(0, 100)
    || 'Bài viết SEO';

  const firstParagraph = articleText.replace(/^#\s+.+\n*/m, '').match(/^(.+?)(?:\n\n|$)/m);
  const summary = firstParagraph ? firstParagraph[1].replace(/\*\*/g, '').trim().substring(0, 300) : title;

  const slugify = (text: string) => text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200) || 'bai-viet-seo';

  let baseSlug = options?.slug || slugify(title);

  const finalImageUrl = await uploadBase64ToStorage(imageUrl || '');
  const supabase = await createClient();

  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const { data: existing } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const now = new Date().toISOString();
  const ncTitle = normalizeNFC(title);
  const ncSummary = normalizeNFC(summary);
  const ncContent = normalizeNFC(articleText);
  const ncKeywords = normalizeNFC(options?.keywords || '');
  const ncImageAlt = normalizeNFC(options?.image_alt || ncTitle.substring(0, 100));
  const { error } = await supabase.from('blogs').insert({
    title: ncTitle,
    slug,
    summary: ncSummary,
    content: ncContent,
    image_url: finalImageUrl || 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop',
    image_alt: ncImageAlt,
    keywords: ncKeywords,
    published: true,
    published_at: now,
    created_at: now,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/blog');

  return { success: true, slug };
}

export async function getAutoSeoConfig() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('auto_seo_config').select('*').eq('id', 1).single();
    return data || { enabled: false, schedule_days: ['THU'], schedule_hour: 20, topic_pool: [] };
  } catch (e) {
    logger.error('[Database] Failed to fetch auto SEO config', e instanceof Error ? e : undefined);
    return { enabled: false, schedule_days: ['THU'], schedule_hour: 20, topic_pool: [] };
  }
}

export async function saveAutoSeoConfig(payload: {
  enabled: boolean; schedule_days: string[]; schedule_hour: number; topic_pool: string[];
}) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('auto_seo_config').upsert({
      id: 1, ...payload, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getAutoSeoHistory() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_articles')
      .select('id, created_at, topic, keywords, status, topic_source, blog_slug, published_at')
      .eq('topic_source', 'auto_seo')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id,
      createdAt: a.created_at,
      topic: a.topic,
      keywords: a.keywords,
      status: a.status,
      topicSource: a.topic_source,
      blogSlug: a.blog_slug,
      publishedAt: a.published_at,
    }));
  } catch (e) {
    logger.error('[Database] Failed to fetch auto SEO history', e instanceof Error ? e : undefined);
    return [];
  }
}
