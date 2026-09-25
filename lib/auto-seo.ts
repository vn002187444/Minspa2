import { createClient } from '@/utils/supabase/server';
import { callGemini } from '@/lib/ai/gemini';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/notify';
import { searchImages } from '@/lib/image-search';
import { ensureGeoAlt, generateBlogImageAlt } from '@/lib/image-alt';

const ARTICLE_SYSTEM = `Bạn là chuyên gia Copywriter SEO hàng đầu trong ngành làm đẹp, Spa, Hair và Nail tại Việt Nam.

QUY TẮC BẮT BUỘC — Bài viết phải đạt chuẩn SEO, GEO, AEO:

1. NGÔN NGỮ & JSON:
- Chỉ viết về chăm sóc sắc đẹp, không tư vấn y tế.
- Luôn trả về JSON đúng schema yêu cầu.
- Tiếng Việt có dấu đầy đủ (NFC), giọng văn thân thiện, chuyên nghiệp, tự nhiên.

2. CẤU TRÚC HEADING (TUYỆT ĐỐI TUÂN THỦ):
- H1 là \`title\` (KHÔNG BAO GIỜ viết H1 trong content, cấm dùng "# ").
- Content CHỈ dùng H2 (## ) và H3 (### ). Cấm H1, H4+.
- Tiêu đề H2/H3 viết THUẦN TEXT, KHÔNG bọc **bold** (ví dụ đúng: "## Lợi ích nổi bật", sai: "## **Lợi ích nổi bật**").
- Mỗi H2 và H3 phải nằm trên DÒNG RIÊNG, TRƯỚC và SAU đều có 1 dòng trống (\\n\\n).
- Tối thiểu 3 H2, mỗi H2 nên có 1-2 H3 con khi phù hợp. Thứ tự H1 -> H2 -> H3, không nhảy cấp.
- Mỗi đoạn (paragraph, heading, list, blockquote) cách nhau 1 dòng trống.

3. BỐ CỤC AEO/GEO:
- Mở đầu bằng sapo 2-3 câu (KHÔNG heading) tóm tắt lợi ích + địa phương Lavita Charm/Thủ Đức (2-3 lần rải tự nhiên).
- 40-60 từ ĐẦU TIÊN của mỗi H2 phải trả lời TRỰC TIẾP câu hỏi người dùng (để Google AI Overviews trích dẫn). Dùng câu khẳng định ngắn gọn.
- Mỗi H2 là một ý lớn (Lợi ích, Quy trình, Chăm sóc sau, FAQ); mỗi H3 là chi tiết con.
- Xen bullet/numbered list, blockquote tip khi liệt kê 3+ mục. Đoạn ngắn 2-3 câu, dễ đọc mobile.
- Độ dài 800-1200 từ.
- Kết bài có CTA đặt lịch: link tới /booking và hotline 0934 323 878.

4. E-E-A-T & REVIEW WEBSITE:
- Đã cung cấp danh sách dịch vụ thật và bài blog gần đây — chỉ tham chiếu đúng tên dịch vụ, giá, thời lượng; không bịa dịch vụ.
- Ưu tiên gắn địa phương "Lavita Charm", "Thủ Đức", "Trường Thọ" tự nhiên.

5. BACKLINK NỘI BỘ (BẮT BUỘC):
- Chèn 2-3 link nội bộ dạng Markdown [anchor text tự nhiên](/dich-vu/slug) hoặc [anchor](/blog/slug) trỏ tới slug ĐÃ CHO.
- Anchor chứa từ khóa tự nhiên (ví dụ: [gội dưỡng sinh thảo dược](/dich-vu/goi-duong-sinh-thao-duoc)).
- Rải đều: 1 link trong nửa đầu bài, 1 link nửa sau. Không dồn cuối bài.
- Không chèn link gãy, không dùng URL tuyệt đối, chỉ dùng slug đã cho.

6. ĐỊNH DẠNG MARKDOWN NGHIÊM NGẶT:
- ĐÚNG: "## Tiêu đề H2" + dòng trống + "Nội dung..."
- SAI: "câu. ## Tiêu đề" (dính liền), "## **Tiêu đề**" (bold trong heading), "# Tiêu đề" (H1 cấm).
- List: "- Mục" mỗi mục 1 dòng, trước list có dòng trống.`;

const ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Tiêu đề H1, tối đa 70 ký tự, chứa từ khóa chính + địa phương Thủ Đức/Lavita Charm nếu hợp lý' },
    metaDescription: { type: 'string', description: 'Thẻ mô tả 140-160 ký tự, chứa từ khóa chính + địa phương + CTA nhẹ' },
    content: { type: 'string', description: 'Markdown NGHIÊM NGẶT: sapo 2-3 câu không heading; >=3 H2 (## Thuần text, không **), mỗi H2 có 1-2 H3 (### Thuần text); mỗi heading/list/paragraph cách nhau 1 dòng trống; cấm # (H1); 2-3 backlink [anchor](/dich-vu/slug) hoặc /blog/slug rải đều; kết CTA /booking + hotline 0934 323 878; 800-1200 từ' },
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

async function getSiteContextForArticle(): Promise<{ services: string; blogs: string }> {
  try {
    const supabase = await createClient();
    const { data: services } = await supabase.from('services').select('name, category, price, duration').eq('is_active', true).order('price', { ascending: true }).limit(12);
    const { data: blogs } = await supabase.from('blogs').select('title, slug').eq('published', true).order('created_at', { ascending: false }).limit(8);
    const svcList = (services || []).map((s: any) => `- ${s.name} (${s.category}, ${Number(s.price).toLocaleString('vi-VN')}đ, ${s.duration}p) -> /dich-vu/${s.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-')}`).join('\n');
    const blogList = (blogs || []).map((b: any) => `- ${b.title} -> /blog/${b.slug}`).join('\n');
    return { services: svcList || 'Không có', blogs: blogList || 'Không có' };
  } catch { return { services: 'Không có', blogs: 'Không có' }; }
}

function ensureHeadingStructureAndBacklinks(content: string, title: string, siteLinks: string[]): string {
  let out = content.replace(/\r/g, '').trim().normalize('NFC');

  // 1. Tách heading dính liền đoạn văn: "câu. ## Tiêu đề" -> "câu.\n\n## Tiêu đề"
  out = out.replace(/([^\n])\s*##\s+/g, '$1\n\n## ');
  out = out.replace(/([^\n])\s*###\s+/g, '$1\n\n### ');
  // 2. Chuẩn hoá H1 -> H2 (title đã là H1, cấm H1 trong content)
  out = out.replace(/^#\s+(.*)$/gm, '## $1');
  // 3. Bỏ ** bold bọc ngoài heading (heading đã bold via prose-h2/h3)
  out = out.replace(/^##\s*\*\*(.*?)\*\*\s*$/gm, '## $1');
  out = out.replace(/^###\s*\*\*(.*?)\*\*\s*$/gm, '### $1');
  out = out.replace(/^##\s*\*\*(.*?)\*\*:?\s*$/gm, '## $1');
  out = out.replace(/^###\s*\*\*(.*?)\*\*:?\s*$/gm, '### $1');
  // 4. Đảm bảo mỗi heading/list/paragraph có dòng trống ngăn cách (đã tách ở bước 1, cộng thêm chuẩn hoá list)
  out = out.replace(/([^\n])\n([-*]\s)/g, '$1\n\n$2');
  out = out.replace(/([^\n])\n(\d+\.\s)/g, '$1\n\n$2');
  out = out.replace(/([^\n])\n(>\s)/g, '$1\n\n$2');

  // 5. Đảm bảo >=3 H2, hierarchically correct (không H3 trước H2)
  const h2Count = (out.match(/^##\s+/gm) || []).length;
  const hasH3BeforeH2 = /^###\s/m.test(out) && !/^##\s/m.test(out.split(/^###\s/m)[0]);
  if (hasH3BeforeH2) {
    out = out.replace(/^###\s+/m, '## ');
  }
  if (h2Count < 3) {
    const needed = 3 - h2Count;
    const fallbacks = [
      '## Mẹo chăm sóc sau dịch vụ tại Lavita Charm',
      '## Câu hỏi thường gặp',
      '## Tại sao chọn Min Nail & Hair Thủ Đức',
    ];
    for (let i = 0; i < needed; i++) {
      out += `\n\n${fallbacks[i % fallbacks.length]}\nTrải nghiệm tại Min Nail & Hair Lavita Charm Thủ Đức giúp duy trì hiệu quả lâu dài. Đặt lịch tại [đặt lịch ngay](/booking) để được tư vấn chi tiết.\n`;
    }
  }
  // 6. GEO: đảm bảo có 2-3 lần nhắc Lavita Charm/Thủ Đức
  const geoCount = (out.match(/Lavita Charm|Thủ Đức|Trường Thọ/g) || []).length;
  if (geoCount < 2) {
    out += '\n\n> Tip: Dịch vụ có tại Min Nail & Hair — Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức. Hotline 0934 323 878.\n';
  }
  // 7. Backlink: đếm cả /dich-vu/, /blog/, /booking (CTA cũng tính nhưng ưu tiên dịch vụ/blog)
  const allLinks = out.match(/\[.*?\]\(.*?\)/g) || [];
  const internalCount = allLinks.filter(m => m.includes('/dich-vu/') || m.includes('/blog/')).length;
  if (internalCount < 2 && siteLinks.length) {
    const picks = siteLinks.slice(0, 2 - internalCount);
    // Rải đều: chèn sau H2 đầu tiên và cuối bài thay vì dồn cuối
    const firstH2Idx = out.indexOf('\n## ');
    if (firstH2Idx !== -1 && picks.length) {
      const before = out.slice(0, firstH2Idx);
      const after = out.slice(firstH2Idx);
      // chèn 1 link sau đoạn sapo/first H2 block
      const nextBlockEnd = after.indexOf('\n\n');
      if (nextBlockEnd !== -1) {
        out = before + after.slice(0, nextBlockEnd) + `\n\n> Gợi ý: Xem thêm [dịch vụ liên quan](${picks[0]}) tại Min Nail & Hair.` + after.slice(nextBlockEnd);
        if (picks[1]) out += `\n\n> Gợi ý: Khám phá thêm [bài viết liên quan](${picks[1]}) để hiểu rõ hơn.`;
      } else {
        out += '\n\n' + picks.map(l => `> Gợi ý: Xem thêm [dịch vụ liên quan](${l}) tại Min Nail & Hair.`).join('\n');
      }
    } else {
      out += '\n\n' + picks.map(l => `> Gợi ý: Xem thêm [dịch vụ liên quan](${l}) tại Min Nail & Hair.`).join('\n');
    }
  }
  // 8. Đảm bảo kết bài có CTA /booking
  if (!out.includes('/booking')) {
    out += '\n\n## Đặt lịch ngay hôm nay\nĐừng bỏ lỡ ưu đãi — [đặt lịch ngay](/booking) hoặc gọi hotline 0934 323 878 để giữ chỗ tại Min Nail & Hair Lavita Charm Thủ Đức.';
  }
  return out.normalize('NFC').trim();
}

export async function generateArticle(topic: string, keywords: string[]): Promise<{ title: string; content: string; summary: string } | null> {
  const site = await getSiteContextForArticle();
  const prompt = `Viết bài SEO về chủ đề: "${topic}"
Từ khóa chính: "${topic}"
Từ khóa phụ: "${keywords.join(', ') || 'Không có'}"
Địa điểm: Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức.
Thương hiệu: Min Nail & Hair — Hotline 0934 323 878 — /booking
---
REVIEW WEBSITE — Dịch vụ thật đang có (BẮT BUỘC dùng slug chính xác để tạo backlink, không bịa):
${site.services}
---
Bài blog gần đây (dùng để backlink nội bộ nếu liên quan, chỉ dùng slug đã cho):
${site.blogs}
---
YÊU CẦU OUTPUT (TUÂN THỦ NGHIÊM NGẶT):
- title: H1, <=70 ký tự, chứa từ khóa chính.
- metaDescription: 140-160 ký tự, chứa từ khóa + địa phương + CTA.
- content: Markdown CHUẨN:
  • Dòng 1-3: sapo 2-3 câu (KHÔNG heading), tóm tắt lợi ích + Lavita Charm/Thủ Đức.
  • Sau sapo là dòng trống, rồi "## H2 thuần text" (không **), dòng trống, 40-60 từ trả lời trực tiếp câu hỏi H2, rồi nội dung.
  • Mỗi H2 (tối thiểu 3) có 1-2 H3 con (### thuần text). Mỗi heading/list/paragraph đều cách nhau 1 dòng trống.
  • CẤM "# " (H1) trong content, CẤM "**" bọc heading.
  • Rải 2-3 backlink [anchor tự nhiên](/dich-vu/slug) hoặc /blog/slug đã cho (1 link nửa đầu, 1 link nửa sau).
  • Kết bài: CTA [đặt lịch ngay](/booking) + hotline.
  • Ví dụ cấu trúc đúng:
    Sapo đoạn mở...

    ## Lợi ích nổi bật
    Câu trả lời trực tiếp 40-60 từ...

    ### Chi tiết 1
    Nội dung...
`;

  const result = await callGemini({
    systemInstruction: ARTICLE_SYSTEM,
    prompt,
    jsonSchema: ARTICLE_SCHEMA,
    useCache: true,
  });

  if (!result.text) return null;
  try {
    const parsed = JSON.parse(result.text);
    let content = parsed.content || '';
    // Post-process: đảm bảo H1/H2/H3 + backlink nội bộ
    const siteLinkSlugs = (site.services.match(/\/dich-vu\/[a-z0-9-]+/g) || []).slice(0, 4).concat(site.blogs.match(/\/blog\/[a-z0-9-]+/g) || []);
    content = ensureHeadingStructureAndBacklinks(content, parsed.title || topic, siteLinkSlugs);
    return {
      title: (parsed.title || topic).normalize('NFC').slice(0, 70),
      content,
      summary: (parsed.metaDescription || '').normalize('NFC').slice(0, 160),
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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200) || 'bai-viet-seo-' + Date.now();

  const now = new Date().toISOString();

  // Resolve image: explicit opts > topic-based search > fallback — enforce GEO alt
  let imageUrl = opts?.imageUrl;
  let imageAlt = opts?.imageAlt ? ensureGeoAlt(opts.imageAlt, opts.topic || title) : undefined;
  if (!imageUrl && opts?.topic) {
    try {
      const result = await searchImages(opts.topic, 1);
      if (result?.images?.[0]) {
        imageUrl = result.images[0];
        imageAlt = ensureGeoAlt(result.imageAlts?.[0] || opts.topic.substring(0, 100), opts.topic);
      }
    } catch (e) {
      logger.warn('[AutoSEO] searchImages failed, fallback', { error: e instanceof Error ? e.message : String(e) });
    }
  }
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop';
  }
  if (!imageAlt) {
    imageAlt = ensureGeoAlt(generateBlogImageAlt(title), title);
  } else {
    imageAlt = ensureGeoAlt(imageAlt, title).normalize('NFC');
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
  const url = `https://minhair.vercel.app/blog/${article.slug}`;
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
