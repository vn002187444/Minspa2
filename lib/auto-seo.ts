import { createClient } from '@/utils/supabase/server';
import { callGemini } from '@/lib/ai/gemini';
import { searchImages } from '@/lib/image-search';
import { normalizeNFC } from '@/lib/utils';

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia Copywriter SEO hàng đầu trong ngành làm đẹp, Spa, Hair và Nail tại Việt Nam.

QUY TẮC:
- Chỉ viết về chăm sóc sắc đẹp, không tư vấn y tế.
- Luôn trả về JSON đúng schema yêu cầu.
- Giọng văn thân thiện, chuyên nghiệp, tự nhiên.
- Tiếng Việt có dấu đầy đủ.
- Tối ưu từ khóa, viết content dạng mở rộng (cluster content).
- Có internal link đến trang đặt lịch.`;

const ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Tiêu đề bài viết, tối đa 70 ký tự, chứa từ khóa chính, gây tò mò' },
    metaDescription: { type: 'string', description: 'Thẻ mô tả ngắn gọn, tối đa 160 ký tự, chứa từ khóa phụ và CTA' },
    keywords: { type: 'string', description: 'Các từ khóa SEO chính và phụ, phân cách bằng dấu phẩy' },
    content: { type: 'string', description: 'Nội dung Markdown gồm: mở bài, 3-4 phần H2 có H3 bên trong, kết luận kèm CTA đặt lịch tại Min Nail & Hair. Tổng 700-1200 từ.' },
  },
  required: ['title', 'metaDescription', 'keywords', 'content'],
};

const KEYWORD_SYSTEM = `Bạn là chuyên gia nghiên cứu từ khóa SEO trong lĩnh vực làm đẹp.

QUY TẮC:
- Chỉ đưa ra từ khóa tiếng Việt có dấu.
- Từ khóa chính và từ khóa phụ (long-tail) xoay quanh chủ đề được yêu cầu.
- Trả về JSON.`;

const KEYWORD_SCHEMA = {
  type: 'object',
  properties: {
    keywords: { type: 'string', description: 'Danh sách 10-15 từ khóa chính và phụ, phân cách bằng dấu phẩy' },
    primary: { type: 'string', description: 'Từ khóa chính nhất' },
    searchVolume: { type: 'string', description: 'Ước lượng lượng tìm kiếm hàng tháng (VD: "500-1000" hoặc "Không có dữ liệu")' },
  },
  required: ['keywords', 'primary'],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateKeywords(topic: string): Promise<{ keywords: string; primary: string }> {
  const prompt = `Phân tích và đưa ra từ khóa SEO cho chủ đề: "${topic}"
Lĩnh vực: làm đẹp, spa, nail, hair tại Việt Nam.
Ưu tiên từ khóa có lượng tìm kiếm cao và long-tail keywords.`;

  const result = await callGemini({
    systemInstruction: KEYWORD_SYSTEM,
    prompt,
    jsonSchema: KEYWORD_SCHEMA,
    useCache: true,
  });

  if (result.text) {
    try {
      const parsed = JSON.parse(result.text);
      return { keywords: parsed.keywords || '', primary: parsed.primary || topic };
    } catch { /* fall through */ }
  }
  return { keywords: topic, primary: topic };
}

async function generateArticle(topic: string, keywords: string, primary: string): Promise<{ title: string; metaDescription: string; content: string } | null> {
  const prompt = `Viết bài SEO chuẩn về chủ đề: "${topic}"
Từ khóa chính: "${primary}"
Từ khóa phụ: "${keywords}"
Địa điểm: Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức.
Thương hiệu: Min Nail & Hair (Min Salon) - chuyên nail, gội đầu dưỡng sinh thảo dược, massage body.
Website: https://minhair.vercel.app
Trang đặt lịch: https://minhair.vercel.app/booking

YÊU CẦU NỘI DUNG:
- Mở bài: Giới thiệu vấn đề, gợi mở nhu cầu.
- Thân bài: 3-4 phần H2, mỗi phần có 2-3 H3 giải thích chi tiết. Lồng ghép từ khóa chính và phụ tự nhiên.
- Internal link: https://minhair.vercel.app/booking với anchor text "đặt lịch hẹn" hoặc "đặt lịch ngay".
- Kết bài: Tổng kết + CTA mạnh mẽ kêu gọi hành động đặt lịch.
- Độ dài: 700-1200 từ.
- Tiếng Việt có dấu đầy đủ, văn phong tự nhiên, chuyên nghiệp.`;

  const result = await callGemini({
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt,
    jsonSchema: ARTICLE_SCHEMA,
    useCache: false,
  });

  if (result.text) {
    try {
      const parsed = JSON.parse(result.text);
      return {
        title: parsed.title || topic,
        metaDescription: parsed.metaDescription || '',
        content: parsed.content || '',
      };
    } catch { /* fall through */ }
  }
  return null;
}

async function selectImage(topic: string): Promise<string> {
  const result = await searchImages(topic, 1)
  return result.images[0] || ''
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200) || 'bai-viet-seo-' + Date.now();
}

function extractSummary(content: string, title: string): string {
  const firstParagraph = content.replace(/^#\s+.+\n*/m, '').match(/^(.+?)(?:\n\n|$)/m);
  return firstParagraph
    ? firstParagraph[1].replace(/\*\*/g, '').trim().substring(0, 300)
    : title;
}

export async function runAutoSeo(force = false): Promise<{
  success: boolean;
  message: string;
  slug?: string;
  title?: string;
}> {
  const startTime = Date.now();

  try {
    // 1. Check config
    const supabase = await createClient();
    const { data: config } = await supabase
      .from('auto_seo_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (!config || !config.enabled) {
      return { success: false, message: 'Auto SEO is disabled' };
    }

    // 2. Check schedule (day of week + hour)
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = days[now.getUTCDay()];
    const currentHour = now.getUTCHours();

    // Compare in UTC — schedule_days/schedule_hour are stored in Vietnam time (UTC+7)
    const vnHour = (currentHour + 7) % 24;
    const scheduleDays: string[] = config.schedule_days || [config.schedule_day].filter(Boolean);
    
    const isScheduled = scheduleDays.includes(currentDay) && config.schedule_hour === vnHour;
    
    if (!force && !isScheduled) {
      return { success: false, message: `Schedule mismatch: current ${currentDay} ${vnHour}h, config [${scheduleDays.join(',')}] ${config.schedule_hour}h` };
    }

    // 3. Pick a topic from pool
    const pool: string[] = config.topic_pool || [];
    if (pool.length === 0) {
      return { success: false, message: 'Topic pool is empty. Add topics in Auto SEO config.' };
    }

    const topic = pickRandom(pool);

    // 4. Generate keywords
    const kwResult = await generateKeywords(topic);
    const keywords = kwResult.keywords;
    const primary = kwResult.primary;

    // 5. Generate article
    const article = await generateArticle(topic, keywords, primary);
    if (!article) {
      return { success: false, message: 'Failed to generate article from Gemini' };
    }

    // 6. Select image
    const imageUrl = await selectImage(topic);

    // 7. Check duplicate slug
    const slug = slugify(article.title);
    const { data: existing } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', slug)
      .single();

    const finalSlug = existing ? slug + '-' + Date.now() : slug;

    // 8. Insert into blogs
    const { error: blogError } = await supabase.from('blogs').insert({
      title: normalizeNFC(article.title),
      slug: finalSlug,
      summary: normalizeNFC(article.metaDescription || extractSummary(article.content, article.title)),
      content: normalizeNFC(article.content),
      image_url: imageUrl,
      image_alt: normalizeNFC(topic.substring(0, 100)),
      created_at: now.toISOString(),
    });

    if (blogError) {
      return { success: false, message: `Failed to publish blog: ${blogError.message}` };
    }

    // 9. Log to seo_articles
    const articleId = 'auto-' + Date.now();
    await supabase.from('seo_articles').upsert({
      id: articleId,
      topic: normalizeNFC(topic),
      keywords: normalizeNFC(keywords),
      article: normalizeNFC(article.content),
      image_url: imageUrl,
      status: 'published',
      topic_source: 'auto_seo',
      blog_slug: finalSlug,
      published_at: now.toISOString(),
    }, { onConflict: 'id' });

    // 10. Log cron job
    await supabase.from('cron_job_logs').insert({
      job_name: 'seo-publish',
      started_at: new Date(startTime).toISOString(),
      finished_at: new Date().toISOString(),
      success: true,
      error: null,
    });

    // 11. Revalidate paths
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/blog');
      revalidatePath(`/blog/${finalSlug}`);
    } catch { /* silent */ }

    return {
      success: true,
      message: `Published: "${article.title}"`,
      slug: finalSlug,
      title: article.title,
    };
  } catch (error: unknown) {
    const elapsed = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    try {
      const supabase = await createClient();
      await supabase.from('cron_job_logs').insert({
        job_name: 'seo-publish',
        started_at: new Date(startTime).toISOString(),
        finished_at: new Date().toISOString(),
        success: false,
        error: errorMsg,
      });
    } catch { /* silent */ }

    return { success: false, message: `Error after ${elapsed}ms: ${errorMsg}` };
  }
}

const KEYWORD_RESEARCH_SYSTEM = `Bạn là chuyên gia SEO và trend research trong ngành làm đẹp Việt Nam.

NHIỆM VỤ:
- Đưa ra 10 chủ đề hot nhất hiện tại về nail, tóc, gội dưỡng sinh, spa, massage tại Việt Nam.
- Mỗi chủ đề kèm từ khóa chính và ước lượng search volume.
- Trả về JSON.`;

const KEYWORD_RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Chủ đề' },
          primary: { type: 'string', description: 'Từ khóa chính' },
          volume: { type: 'string', description: 'Ước lượng tìm kiếm/tháng' },
        },
        required: ['topic', 'primary'],
      },
    },
  },
  required: ['topics'],
};

export async function runKeywordResearch(): Promise<{
  success: boolean;
  message: string;
  topics?: string[];
}> {
  try {
    const prompt = `Research xu hướng làm đẹp mới nhất tại Việt Nam năm 2026-2027.
Tập trung vào: nail art, gội đầu dưỡng sinh thảo dược, massage body, chăm sóc tóc, spa tại nhà.
Đưa ra 10 chủ đề có lượng tìm kiếm cao và tiềm năng SEO tốt nhất cho spa tại Thủ Đức, TP.HCM.`;

    const result = await callGemini({
      systemInstruction: KEYWORD_RESEARCH_SYSTEM,
      prompt,
      jsonSchema: KEYWORD_RESEARCH_SCHEMA,
      useCache: false,
    });

    if (!result.text) {
      return { success: false, message: 'Gemini returned empty' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      return { success: false, message: 'Gemini returned invalid JSON in keyword research' };
    }
    const topics: { topic: string; primary: string }[] = parsed.topics || [];

    if (topics.length === 0) {
      return { success: false, message: 'No topics generated' };
    }

    const topicList = topics.map((t) => t.topic);

    // Update auto_seo_config topic_pool with new topics
    const supabase = await createClient();
    const { data: config } = await supabase
      .from('auto_seo_config')
      .select('topic_pool')
      .eq('id', 1)
      .single();

    const existingPool: string[] = config?.topic_pool || [];
    const merged = [...new Set([...topicList, ...existingPool])];

    await supabase.from('auto_seo_config').upsert({
      id: 1,
      topic_pool: merged,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return {
      success: true,
      message: `Đã cập nhật ${topicList.length} chủ đề mới vào Topic Pool`,
      topics: topicList,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Research error: ${errorMsg}` };
  }
}
