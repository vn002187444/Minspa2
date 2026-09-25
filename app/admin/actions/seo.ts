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

function normalizeSeoContentForPublish(raw: string): string {
  let out = raw.replace(/\r/g, '').trim().normalize('NFC');
  out = out.replace(/([^\n])\s*##\s+/g, '$1\n\n## ');
  out = out.replace(/([^\n])\s*###\s+/g, '$1\n\n### ');
  out = out.replace(/^#\s+(.*)$/gm, '## $1');
  out = out.replace(/^##\s*\*\*(.*?)\*\*\s*$/gm, '## $1');
  out = out.replace(/^###\s*\*\*(.*?)\*\*\s*$/gm, '### $1');
  out = out.replace(/^##\s*\*\*(.*?)\*\*:?\s*$/gm, '## $1');
  out = out.replace(/^###\s*\*\*(.*?)\*\*:?\s*$/gm, '### $1');
  // đảm bảo >=3 H2, không H3 trước H2
  const h2Count = (out.match(/^##\s+/gm) || []).length;
  if (/^###\s/m.test(out) && !/^##\s/m.test(out.split(/^###\s/m)[0])) {
    out = out.replace(/^###\s+/m, '## ');
  }
  if (h2Count < 3) {
    const need = 3 - h2Count;
    const fb = ['## Mẹo chăm sóc sau dịch vụ tại Lavita Charm','## Câu hỏi thường gặp','## Tại sao chọn Min Nail & Hair Thủ Đức'];
    for (let i=0;i<need;i++) out += `\n\n${fb[i%fb.length]}\nTrải nghiệm tại Min Nail & Hair Lavita Charm Thủ Đức giúp duy trì hiệu quả lâu dài. Đặt lịch tại [đặt lịch ngay](/booking) để được tư vấn.\n`;
  }
  if ((out.match(/Lavita Charm|Thủ Đức|Trường Thọ/g)||[]).length < 2) {
    out += '\n\n> Tip: Dịch vụ có tại Min Nail & Hair — Chung cư Lavita Charm, Trường Thọ, Thủ Đức. Hotline 0934 323 878.\n';
  }
  if (!out.includes('/booking')) out += '\n\n## Đặt lịch ngay hôm nay\nĐừng bỏ lỡ ưu đãi — [đặt lịch ngay](/booking) hoặc gọi 0934 323 878.';
  return out.normalize('NFC').trim();
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

  // Chuẩn hoá content trước khi trích title/summary/slug (đồng bộ Auto SEO)
  const normalizedArticle = normalizeSeoContentForPublish(articleText);

  const title = options?.title
    || normalizedArticle.split('\n').find(l => l.trim().startsWith('## '))?.replace(/^##\s+/, '').replace(/\*\*/g,'').trim()
    || normalizedArticle.split('\n')[0].replace(/^#+\s*/, '').replace(/\*\*/g,'').trim().substring(0, 100)
    || 'Bài viết SEO';

  const firstParagraph = normalizedArticle.replace(/^##\s+.+\n*/m, '').match(/^(.+?)(?:\n\n|$)/m);
  const summary = firstParagraph ? firstParagraph[1].replace(/\*\*/g, '').trim().substring(0, 160) : title.slice(0,160);

  const slugify = (text: string) => text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
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
  const ncContent = normalizeNFC(normalizedArticle);
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

export async function getAutoDanceConfig() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('auto_seo_dance_config').select('*').eq('id', 1).single();
    return data || { enabled: true, schedule_days: ['MON','TUE','WED','THU','FRI','SAT','SUN'], schedule_hour: 12, topic_pool: [] };
  } catch (e) {
    logger.error('[Database] Failed to fetch auto dance config', e instanceof Error ? e : undefined);
    return { enabled: true, schedule_days: ['MON','TUE','WED','THU','FRI','SAT','SUN'], schedule_hour: 12, topic_pool: [] };
  }
}

export async function saveAutoDanceConfig(payload: {
  enabled: boolean; schedule_days: string[]; schedule_hour: number; topic_pool: string[];
}) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('auto_seo_dance_config').upsert({
      id: 1, ...payload, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getAutoDanceHistory() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_articles')
      .select('id, created_at, topic, keywords, status, topic_source, blog_slug, published_at')
      .eq('topic_source', 'auto_dance')
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
    logger.error('[Database] Failed to fetch auto dance history', e instanceof Error ? e : undefined);
    return [];
  }
}
