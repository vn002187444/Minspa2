import { createClient } from '@/utils/supabase/server';
import { callGemini } from '@/lib/ai/gemini';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/notify';

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

export async function pickTopic(): Promise<string | null> {
  const supabase = await createClient();
  const { data: config } = await supabase.from('auto_seo_config').select('topic_pool').eq('id', 1).single();
  if (!config?.topic_pool?.length) return null;
  const pool: string[] = config.topic_pool;
  const picked = pool[Math.floor(Math.random() * pool.length)];
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

export async function publishToBlog(supabase: any, title: string, content: string, summary: string): Promise<{ slug: string } | null> {
  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200) || 'bai-viet-seo-' + Date.now();

  const { data: existing } = await supabase
    .from('blogs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('blogs')
      .update({ title, summary, content })
      .eq('id', existing.id);
    if (error) { logger.error('AutoSEO update blog failed', error); return null; }
    return { slug };
  }

  const { error } = await supabase.from('blogs').insert({
    title,
    slug,
    summary,
    content,
    image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop',
    created_at: new Date().toISOString(),
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

    const topic = await pickTopic();
    if (!topic) return { success: false, message: 'No topic in pool' };

    const research = await researchTopic(topic);
    const keywords = research?.keywords || [];

    const article = await generateArticle(topic, keywords);
    if (!article) return { success: false, message: 'Article generation returned empty' };

    const published = await publishToBlog(supabase, article.title, article.content, article.summary);
    if (!published) return { success: false, message: 'Publish to blog failed' };

    await saveArticleRecord(supabase, {
      topic,
      keywords: keywords.join(', '),
      article: article.content,
      status: 'published',
      topic_source: 'auto_seo',
      blog_slug: published.slug,
    });

    await notifyAdmin({ title: article.title, slug: published.slug });

    logger.info('[AutoSEO] Published', { topic, slug: published.slug });
    return { success: true, message: `Published "${article.title}"` };
  } catch (err: any) {
    logger.error('[AutoSEO] Failed', err);
    return { success: false, message: err.message };
  }
}
