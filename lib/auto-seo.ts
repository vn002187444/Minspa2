import { createClient } from '@/utils/supabase/server';
import { callGemini } from '@/lib/ai/gemini';
import { searchImages } from '@/lib/image-search';
import { normalizeNFC } from '@/lib/utils';

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia Copywriter SEO hàng đầu trong ngành làm đẹp, Spa, Hair và Nail tại Việt Nam. Bạn viết cho thương hiệu Min Nail & Hair — một salon cao cấp tại Thủ Đức, TP.HCM, chuyên gội đầu dưỡng sinh thảo dược, nail và massage body.

PHONG CÁCH VIẾT:
- Giọng văn ấm áp, thân thiện nhưng chuyên nghiệp — như một người bạn am hiểu đang chia sẻ bí quyết.
- Không viết như bài báo hay giáo trình. Viết như người thật trải nghiệm thật.
- Mỗi đoạn văn TỐI ĐA 3-4 câu. Luôn xuống dòng sau mỗi ý.
- Bắt đầu bài viết bằng 1 câu hỏi hoặc 1 tình huống gần gũi để giữ chân người đọc.
- Luôn trả về JSON đúng schema yêu cầu.
- Tiếng Việt có dấu đầy đủ, không dùng từ nước ngoài khi có từ Việt tương đương.

ĐỊNH DẠNG MARKDOWN BẮT BUỘC (hệ thống chỉ render được ## và ###):

1. CẤU TRÚC BÀI VIẾT:
   - Mở bài: 2-3 đoạn ngắn (không có heading), bắt đầu bằng câu hỏi hoặc tình huống.
   - 3-4 phần ## (section chính), mỗi phần có 2-3 ### (sub-section).
   - Kết bài: 1-2 đoạn ngắn + CTA.

2. QUY TẮC HEADING:
   - Dùng ## cho tiêu đề phần (section chính).
   - Dùng ### cho tiêu đề con (sub-section).
   - KHÔNG BAO GIỜ dùng # (H1) — hệ thống không hỗ lý, sẽ render thành text thô.
   - Mỗi heading PHẢI có 1 dòng trống TRƯỚC và SAU nó.
   - Tiêu đề con ### phải cụ thể, mô tả nội dung bên trong — KHÔNG viết chung chung.

3. QUY TẮC ĐOẠN VĂN:
   - Mỗi đoạn văn tối đa 3-4 câu.
   - Mỗi đoạn cách nhau 1 dòng trống.
   - KHÔNG viết liền 2 đoạn thành 1 block.
   - Từ khóa chính xuất hiện trong 1-2 câu đầu tiên của bài viết.

4. QUY TẮC IN ĐẬM:
   - In đậm thuật ngữ quan trọng bằng **thuật ngữ** khi mới giới thiệu lần đầu.
   - Tiêu đề con ### kết thúc bằng dấu hai chấm và in đậm: ### **Tiêu đề con:**
   - KHÔNG in đậm cả câu, chỉ in đậm từ/cụm từ quan trọng.

5. QUY TẮC LIST:
   - Khi liệt kê 3+ mục, dùng markdown list (- hoặc 1.) thay vì viết liền dòng.
   - Mỗi item list trên 1 dòng riêng.

6. INTERNAL LINK:
   - Dùng markdown link: [đặt lịch ngay](https://minhair.vercel.app/booking)
   - KHÔNG bao giờ dùng URL trần.
   - Anchor text phải tự nhiên: "đặt lịch", "đặt lịch ngay", "đặt lịch hẹn", "tư vấn miễn phí".

7. CTA KẾT BÀI:
   - Luôn có 1 đoạn CTA cuối bài, ngắn gọn, mạnh mẽ.
   - Gợi ý hành động cụ thể: đặt lịch, gọi điện, ghé salon.`;

const ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Tiêu đề SEO, tối đa 70 ký tự, chứa từ khóa chính, gây tò mò, không dùng ký tự đặc biệt' },
    metaDescription: { type: 'string', description: 'Thẻ mô tả SEO, tối đa 160 ký tự, tóm tắt nội dung + CTA, chứa từ khóa phụ' },
    keywords: { type: 'string', description: 'Các từ khóa SEO chính và phụ, phân cách bằng dấu phẩy' },
    imageAlt: { type: 'string', description: 'Mô tả ảnh Alt text chuẩn SEO, chứa từ khóa chính, mô tả hình ảnh liên quan' },
    content: { type: 'string', description: 'Nội dung Markdown. Cấu trúc: mở bài 2-3 đoạn ngắn không heading, 3-4 phần ## có 2-3 ### bên trong, kết bài 1-2 đoạn + CTA. Tối đa 1200 từ. KHÔNG dùng # (H1). Mỗi ### in đậm tiêu đề con bằng ### **Tiêu đề:**.' },
  },
  required: ['title', 'metaDescription', 'keywords', 'imageAlt', 'content'],
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

async function generateArticle(topic: string, keywords: string, primary: string): Promise<{ title: string; metaDescription: string; imageAlt: string; content: string } | null> {
  const prompt = `Viết bài SEO chuẩn về chủ đề: "${topic}"
Từ khóa chính: "${primary}"
Từ khóa phụ: "${keywords}"

THÔNG TIN THƯƠNG HIỆU:
- Tên: Min Nail & Hair (Min Salon)
- Địa chỉ: Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức, TP.HCM
- Dịch vụ chính: gội đầu dưỡng sinh thảo dược Tây Bắc, nail nghệ thuật, massage body chuyên sâu
- Website: https://minhair.vercel.app
- Trang đặt lịch: https://minhair.vercel.app/booking

CẤU TRÚC BÀI VIẾT:

1. MỞ BÀI (không có heading):
   - Bắt đầu bằng 1 câu hỏi hoặc 1 tình huống gần gũi (VD: "Bạn có bao giờ...?")
   - 2-3 đoạn ngắn, mỗi đoạn 2-3 câu.
   - Lồng từ khóa chính vào 1-2 câu đầu.
   - Cuối mở bài, gợi ý rằng bài viết sẽ giải quyết vấn đề.

2. THÂN BÀI (3-4 phần ##):
   - Mỗi phần ## có tên tiêu đề cụ thể, mô tả nội dung bên trong.
   - Mỗi phần có 2-3 ### con.
   - Mỗi ### in đậm tiêu đề con: ### **Tiêu đề con:**
   - Mỗi ### có 2-3 đoạn ngắn (tối đa 3-4 câu/đoạn).
   - Khi liệt kê 3+ mục → dùng markdown list (- item).
   - In đậm thuật ngữ quan trọng khi mới giới thiệu: **thuật ngữ**.
   - Lồng từ khóa phụ tự nhiên, KHÔNG nhồi nhét.
   - Có 1 internal link markdown [đặt lịch ngay](https://minhair.vercel.app/booking) trong bài.

3. KẾT BÀI (không có heading):
   - 1-2 đoạn tóm tắt ngắn gọn.
   - 1 đoạn CTA mạnh mẽ: gợi ý hành động cụ thể (đặt lịch, gọi điện, ghé salon).
   - Anchor text link phải tự nhiên, KHÔNG dùng URL trần.

QUY TẮC MARKDOWN (BẮT BUỘC):
- ## cho section chính, ### cho sub-section.
- KHÔNG BAO GIỜ dùng # (H1).
- Mỗi ### dạng: ### **Tiêu đề con:**
- Mỗi block cách nhau 1 dòng trống.
- Đoạn văn tối đa 3-4 câu, xuống dòng sau mỗi ý.
- Dùng list (- item) khi liệt kê 3+ mục.
- Internal link dạng markdown: [anchor text](url).`;

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
        imageAlt: parsed.imageAlt || topic,
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
  const firstParagraph = content.replace(/^##\s+.+\n*/gm, '').match(/^(.+?)(?:\n\n|$)/m);
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
      title: normalizeNFC(article.title).substring(0, 255),
      slug: finalSlug.substring(0, 255),
      summary: normalizeNFC(article.metaDescription || extractSummary(article.content, article.title)).substring(0, 500),
      content: normalizeNFC(article.content),
      image_url: (imageUrl || '').substring(0, 255),
      image_alt: normalizeNFC(article.imageAlt || topic.substring(0, 100)).substring(0, 255),
      published: true,
      published_at: now.toISOString(),
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
      image_url: (imageUrl || '').substring(0, 255),
      image_alt: normalizeNFC(article.imageAlt || topic.substring(0, 100)).substring(0, 255),
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

    // 12. Remove used topic from pool & auto-refresh if running low
    const updatedPool = pool.filter(t => t !== topic);
    const needsRefresh = updatedPool.length < 5;

    await supabase.from('auto_seo_config').upsert({
      id: 1,
      topic_pool: updatedPool,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (needsRefresh) {
      runKeywordResearch().catch(e =>
        console.warn('[AUTO-SEO] Keyword research failed:', e)
      );
    }

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

    // Fetch already-published topics to avoid duplicates
    const supabase = await createClient();
    const { data: published } = await supabase
      .from('seo_articles')
      .select('topic')
      .neq('status', 'draft');

    const publishedTopics = new Set(
      (published || []).map(r => r.topic?.normalize('NFC').toLowerCase().trim()).filter(Boolean)
    );

    const freshTopics = topicList.filter(t =>
      !publishedTopics.has(t.normalize('NFC').toLowerCase().trim())
    );

    if (freshTopics.length === 0) {
      return { success: false, message: 'All generated topics have been published before' };
    }

    // Update auto_seo_config topic_pool with new topics
    const { data: config } = await supabase
      .from('auto_seo_config')
      .select('topic_pool')
      .eq('id', 1)
      .single();

    const existingPool: string[] = config?.topic_pool || [];
    const merged = [...new Set([...freshTopics, ...existingPool])];

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
