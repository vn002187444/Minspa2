import { createClient } from '@/utils/supabase/server';
import { callGemini } from '@/lib/ai/gemini';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/notify';
import { searchImages } from '@/lib/image-search';

const ARTICLE_SYSTEM = `Bạn là chuyên gia Copywriter SEO hàng đầu trong ngành làm đẹp, Spa, Hair và Nail tại Việt Nam.

QUY TẮC:
- Chỉ viết về chăm sóc sắc đẹp, không tư vấn y tế.
- Luôn trả về JSON đúng schema yêu cầu.
- Giọng văn thân thiện, chuyên nghiệp, tự nhiên.
- Tiếng Việt có dấu đầy đủ.`;

const ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Tiêu đề bài viết, tối đa 70 ký tự, chứa từ khóa chính' },
    metaDescription: { type: 'string', description: 'Thẻ mô tả ngắn gọn, tối đa 160 ký tự' },
    content: { type: 'string', description: 'Nội dung Markdown gồm 3-4 phần H2, kèm CTA đặt lịch' },
  },
  required: ['title', 'metaDescription', 'content'],
};

const RESEARCH_SYSTEM = `Bạn là cố vấn SEO cho chuỗi dịch vụ "Min Nail & Hair" tại TP.HCM. Trả về JSON đúng schema. Tiếng Việt có dấu.`;

const RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    keywords: { type: 'array', items: { type: 'string' }, description: 'Danh sách 5 từ khóa chính & phụ' },
    trends: { type: 'string', description: 'Xu hướng nổi bật của khách hàng' },
    outline: { type: 'string', description: 'Cấu trúc dàn bài SEO đề nghị' },
  },
  required: ['keywords', 'trends', 'outline'],
};

const TOPIC_POOL_SYSTEM = `Bạn là strategist SEO cho Min Nail & Hair (Lavita Charm, Thủ Đức). Chỉ trả về JSON đúng schema.`;
const TOPIC_POOL_SCHEMA = {
  type: 'object',
  properties: {
    topics: { type: 'array', items: { type: 'string' }, description: '10 chủ đề SEO mới, mỗi chủ đề 6-12 từ, gắn địa phương Thủ Đức/Lavita Charm nếu hợp lý' },
  },
  required: ['topics'],
};

const DEFAULT_FALLBACK_TOPICS = [
  'gội đầu dưỡng sinh thảo dược Lavita Charm',
  'massage cổ vai gáy giảm stress Thủ Đức',
  'nail art xu hướng 2026 Thủ Đức',
  'chăm sóc tóc hư tổn tại nhà',
  'móng gel bền màu 3 tuần',
  'massage body thư giãn 90 phút',
  'combo gội + nail tiết kiệm Thủ Đức',
  'chăm sóc da đầu dầu đúng cách',
  'màu nail hot mùa hè 2026',
  'gội dưỡng sinh cho dân văn phòng',
];

async function refillTopicPoolIfNeeded(supabase: any): Promise<void> {
  const { data: config } = await supabase.from('auto_seo_config').select('topic_pool').eq('id', 1).single();
  const pool: string[] = config?.topic_pool || [];
  if (pool.length >= 5) return;

  // avoid duplicates: exclude already published topics (last 100)
  const { data: recent } = await supabase.from('seo_articles').select('topic').eq('topic_source', 'auto_seo').order('created_at', { ascending: false }).limit(100);
  const recentSet = new Set((recent || []).map((r: any) => (r.topic || '').toLowerCase().trim()));

  let newTopics: string[] = [];
  try {
    const result = await callGemini({
      systemInstruction: TOPIC_POOL_SYSTEM,
      prompt: `Tạo 10 chủ đề SEO mới cho spa nail/hair gội dưỡng sinh tại Thủ Đức/Lavita Charm. Tránh trùng với: ${Array.from(recentSet).slice(0, 20).join(' | ') || 'không có'}`,
      jsonSchema: TOPIC_POOL_SCHEMA,
      useCache: false,
    });
    if (result.text) {
      const parsed = JSON.parse(result.text);
      newTopics = (parsed.topics || []).map((t: string) => t.trim()).filter(Boolean);
    }
  } catch (e: any) {
    logger.error('[AutoSEO] refill Gemini failed', e);
  }

  if (newTopics.length < 5) {
    // fallback: use defaults not in recentSet
    const fallback = DEFAULT_FALLBACK_TOPICS.filter(t => !recentSet.has(t.toLowerCase()));
    newTopics = [...newTopics, ...fallback].slice(0, 10);
  }

  // dedup + merge
  const merged = [...pool];
  for (const t of newTopics) {
    const key = t.toLowerCase().trim();
    if (!merged.some(m => m.toLowerCase().trim() === key) && !recentSet.has(key)) merged.push(t);
    if (merged.length >= 15) break;
  }

  if (merged.length !== pool.length) {
    const { error } = await supabase.from('auto_seo_config').update({ topic_pool: merged, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) logger.error('[AutoSEO] refill update failed', error);
    else logger.info('[AutoSEO] refilled pool', { added: merged.length - pool.length, total: merged.length });
  }
}

export async function pickTopic(): Promise<string | null> {
  const supabase = await createClient();
  await refillTopicPoolIfNeeded(supabase);
  const { data: config } = await supabase.from('auto_seo_config').select('topic_pool').eq('id', 1).single();
  if (!config?.topic_pool?.length) return null;
  const pool: string[] = config.topic_pool;
  // prefer topics not used recently
  const { data: recent } = await supabase.from('seo_articles').select('topic').eq('topic_source', 'auto_seo').order('created_at', { ascending: false }).limit(50);
  const recentSet = new Set((recent || []).map((r: any) => (r.topic || '').toLowerCase().trim()));
  const unused = pool.filter(t => !recentSet.has(t.toLowerCase().trim()));
  const candidates = unused.length ? unused : pool;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return picked;
}

export async function researchTopic(topic: string): Promise<{ keywords: string[]; trends: string; outline: string } | null> {
  const prompt = `Nghiên cứu SEO cho chủ đề: "${topic}"`;
  const result = await callGemini({
    systemInstruction: RESEARCH_SYSTEM,
    prompt,
    jsonSchema: RESEARCH_SCHEMA,
    useCache: true,
  });
  if (!result.text) return null;
  try {
    const parsed = JSON.parse(result.text);
    return {
      keywords: parsed.keywords || [],
      trends: parsed.trends || '',
      outline: parsed.outline || '',
    };
  } catch {
    return null;
  }
}

export async function generateArticle(topic: string, keywords: string[]): Promise<{ title: string; content: string; summary: string } | null> {
  const prompt = `Viết bài SEO về chủ đề: "${topic}"
Từ khóa phụ: "${keywords.join(', ') || 'Không có'}"
Địa điểm: Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức.
Thương hiệu: Min Nail & Hair`;

  const result = await callGemini({
    systemInstruction: ARTICLE_SYSTEM,
    prompt,
    jsonSchema: ARTICLE_SCHEMA,
    useCache: true,
  });

  if (!result.text) return null;
  try {
    const parsed = JSON.parse(result.text);
    return {
      title: parsed.title || topic,
      content: parsed.content || '',
      summary: parsed.metaDescription || '',
    };
  } catch {
    return null;
  }
}

export async function publishToBlog(
  supabase: any,
  title: string,
  content: string,
  summary: string,
  opts?: { imageUrl?: string; imageAlt?: string; topic?: string }
): Promise<{ slug: string } | null> {
  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200) || 'bai-viet-seo-' + Date.now();

  const now = new Date().toISOString();

  // Resolve image: explicit opts > topic-based search > fallback
  let imageUrl = opts?.imageUrl;
  let imageAlt = opts?.imageAlt;
  if (!imageUrl && opts?.topic) {
    try {
      const result = await searchImages(opts.topic, 1);
      if (result?.images?.[0]) {
        imageUrl = result.images[0];
        imageAlt = result.imageAlts?.[0] || opts.topic.substring(0, 100);
      }
    } catch (e) {
      logger.warn('[AutoSEO] searchImages failed, fallback', e as Error);
    }
  }
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop';
  }
  if (!imageAlt) {
    imageAlt = title.substring(0, 100);
  }

  const { data: existing } = await supabase
    .from('blogs')
    .select('id, published, published_at')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, unknown> = { title, summary, content, image_url: imageUrl, image_alt: imageAlt, updated_at: now };
    // Ensure re-publish: if previously draft, mark as published
    if (!existing.published) {
      updates.published = true;
      updates.published_at = now;
    } else if (!existing.published_at) {
      updates.published_at = now;
    }
    const { error } = await supabase
      .from('blogs')
      .update(updates)
      .eq('id', existing.id);
    if (error) { logger.error('AutoSEO update blog failed', error); return null; }
    return { slug };
  }

  const { error } = await supabase.from('blogs').insert({
    title,
    slug,
    summary,
    content,
    image_url: imageUrl,
    image_alt: imageAlt,
    published: true,
    published_at: now,
    updated_at: now,
    created_at: now,
  });

  if (error) { logger.error('AutoSEO publish blog failed', error); return null; }
  return { slug };
}

export async function saveArticleRecord(supabase: any, article: {
  topic: string; keywords: string; article: string; status: string;
  scheduled_at?: string; topic_source?: string; blog_slug?: string;
}) {
  const id = 'art_' + Math.random().toString(36).substring(2, 11);
  const { error } = await supabase.from('seo_articles').insert({
    id, ...article, created_at: new Date().toISOString(),
  });
  if (error) { logger.error('AutoSEO save article failed', error); return null; }
  return id;
}

export async function notifyAdmin(article: { title: string; slug: string }) {
  const url = `https://minnailhair.vn/blog/${article.slug}`;
  await Promise.allSettled([
    sendEmail({
      to: process.env.ADMIN_EMAIL || 'minnailhair@gmail.com',
      subject: `📝 [Auto SEO] Bài viết mới: ${article.title}`,
      html: `<p>Bài viết <b>${article.title}</b> đã được đăng tự động.</p><p>URL: <a href="${url}">${url}</a></p>`,
    }).catch(e => logger.error('AutoSEO notify email failed', e)),
  ]);
}

export async function runAutoSeo(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  try {
    const { data: config } = await supabase.from('auto_seo_config').select('*').eq('id', 1).single();
    if (!config?.enabled) return { success: false, message: 'Auto SEO is disabled' };

    // ensure pool is refilled before picking (weekly safeguard + handles "hết tiêu đề" incident)
    await refillTopicPoolIfNeeded(supabase);

    const topic = await pickTopic();
    if (!topic) return { success: false, message: 'No topic in pool (refill failed)' };

    const research = await researchTopic(topic);
    const keywords = research?.keywords || [];

    const article = await generateArticle(topic, keywords);
    if (!article) return { success: false, message: 'Article generation returned empty' };

    const published = await publishToBlog(supabase, article.title, article.content, article.summary, { topic });
    if (!published) return { success: false, message: 'Publish to blog failed' };

    // Revalidate public pages so new post appears immediately (ISR 60s + cache 3600s)
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/blog');
      revalidatePath(`/blog/${published.slug}`);
      revalidatePath('/sitemap.xml');
      revalidatePath('/');
    } catch {}

    await saveArticleRecord(supabase, {
      topic,
      keywords: keywords.join(', '),
      article: article.content,
      status: 'published',
      topic_source: 'auto_seo',
      blog_slug: published.slug,
    });

    // consume topic from pool to avoid immediate repeat; refill will replenish when <5
    try {
      const { data: cfg2 } = await supabase.from('auto_seo_config').select('topic_pool').eq('id', 1).single();
      const pool2: string[] = cfg2?.topic_pool || [];
      const idx = pool2.findIndex((t: string) => t.toLowerCase().trim() === topic.toLowerCase().trim());
      if (idx !== -1) {
        pool2.splice(idx, 1);
        await supabase.from('auto_seo_config').update({ topic_pool: pool2, updated_at: new Date().toISOString() }).eq('id', 1);
      }
    } catch {}

    await notifyAdmin({ title: article.title, slug: published.slug });

    logger.info('[AutoSEO] Published', { topic, slug: published.slug });
    return { success: true, message: `Published "${article.title}"` };
  } catch (err: any) {
    logger.error('[AutoSEO] Failed', err);
    return { success: false, message: err.message };
  }
}
