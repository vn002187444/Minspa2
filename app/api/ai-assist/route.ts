import { z } from 'zod';
import { callGemini } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { FALLBACK_IMAGES } from "@/lib/fallback-images";
import { getSuggestedImages } from "@/lib/image-suggestions";
import { searchImages } from "@/lib/image-search";
import { getBaseUrl } from '@/lib/env';
import { getSeoSettings } from '@/lib/seo';

const assistSchema = z.object({
  action: z.enum(['summarize', 'suggestImages', 'writeArticle']),
  content: z.string().max(10000).optional().default(''),
  title: z.string().max(500).optional().default(''),
  keywords: z.string().max(500).optional().default(''),
});

const SYSTEM_SUMMARIZE = `Bạn là chuyên gia SEO. Tóm tắt văn bản thành 1-2 câu (tối đa 160 ký tự), giữ từ khóa chính. Tiếng Việt có dấu. Trả về JSON: { "summary": "..." }.`;

const SYSTEM_WRITER = `Bạn là chuyên gia Copywriter SEO trong ngành làm đẹp, Spa, Hair và Nail tại Việt Nam.

PHONG CÁCH VIẾT:
- Giọng văn ấm áp, lôi cuốn, chuyên nghiệp — như người bạn am hiểu chia sẻ bí quyết.
- Mỗi đoạn văn tối đa 3-4 câu, xuống dòng sau mỗi ý.
- Tiếng Việt chuẩn, có dấu đầy đủ.
- Chèn backlink nội bộ tự nhiên theo hướng dẫn.
- Trả về JSON đúng schema.

ĐỊNH DẠNG MARKDOWN (hệ thống chỉ render được ## và ###):
- ## cho section chính, ### cho sub-section.
- KHÔNG BAO GIỜ dùng # (H1).
- ### dạng: ### **Tiêu đề con:**
- Mỗi heading có 1 dòng trống trước và sau.
- Mỗi đoạn văn cách nhau 1 dòng trống.
- Dùng list (- item) khi liệt kê 3+ mục.
- Internal link dạng markdown: [anchor](url), KHÔNG dùng URL trần.`;

const ARTICLE_WRITER_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Tiêu đề SEO, tối đa 70 ký tự, chứa từ khóa chính" },
    summary: { type: "string", description: "Meta description, tối đa 160 ký tự, tóm tắt + CTA" },
    content: { type: "string", description: "Markdown: mở bài không heading, 3-4 phần ## có ### bên trong, kết bài CTA. KHÔNG dùng # (H1). ### dạng ### **Tiêu đề:**. Tối đa 800 từ." },
    image_alt: { type: "string", description: "Mô tả alt text cho ảnh, 5-10 từ, chứa từ khóa chính" },
  },
  required: ["title", "summary", "content"],
};

const BRAND_INFO = {
  name: 'Min Nail & Hair',
  location: 'Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức, TP.HCM',
  phone: '0934 323 878',
  bookingUrl: '/booking',
  blogUrl: '/blog',
};

const BACKLINK_RULES = [
  { keyword: 'đặt lịch', url: '/booking', text: 'Đặt lịch ngay' },
  { keyword: 'booking', url: '/booking', text: 'Booking' },
  { keyword: 'liên hệ', url: '/booking', text: 'liên hệ đặt hẹn' },
  { keyword: 'trải nghiệm', url: '/booking', text: 'trải nghiệm dịch vụ' },
  { keyword: 'ưu đãi', url: '/booking', text: 'nhận ưu đãi' },
  { keyword: 'blog', url: '/blog', text: 'blog làm đẹp' },
  { keyword: 'Min Nail & Hair', url: '/', text: 'Min Nail & Hair' },
];

function fallbackSummary(content: string): string {
  const clean = content.replace(/[*#[\]()>`\n-]/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.substring(0, 160).replace(/[,.;:]+$/, '') || 'Bài viết về dịch vụ làm đẹp tại Min Nail & Hair.';
}

function fallbackImages(title?: string): string[] {
  if (title?.trim()) {
    const result = getSuggestedImages(title)
    return result.images
  }
  const count = Math.min(4, FALLBACK_IMAGES.length);
  const shuffled = [...FALLBACK_IMAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function fallbackImageAlts(title?: string): string[] {
  if (title?.trim()) {
    const result = getSuggestedImages(title)
    return result.imageAlts
  }
  return []
}

function fallbackArticle(title: string): { article: string; extractedTitle: string; extractedSummary: string } {
  const t = title || 'Dịch vụ làm đẹp';
  const extractedTitle = t;
  const summary = `Khám phá dịch vụ ${t.toLowerCase()} chất lượng cao tại Min Nail & Hair - Lavita Charm, Thủ Đức. Đặt lịch ngay hôm nay để nhận ưu đãi đặc biệt!`;
  const article = `Bạn có bao giờ muốn tìm một không gian thư giãn thật sự sau những ngày bận rộn? ${t} tại Min Nail & Hair chính là lựa chọn hoàn hảo dành cho bạn.

Tại [Min Nail & Hair](${getBaseUrl()}), chúng tôi tự hào mang đến cho khách hàng trải nghiệm làm đẹp đẳng cấp với đội ngũ chuyên viên giàu kinh nghiệm.

### **Lợi ích khi sử dụng dịch vụ:**

- **Tiết kiệm thời gian**: Quy trình nhanh chóng, chuyên nghiệp
- **Chất lượng đảm bảo**: Sử dụng sản phẩm cao cấp, an toàn
- **Không gian thư giãn**: Phong cách sang trọng, thoải mái

## **Quy trình thực hiện tại Min Salon:**

### **Bước 1: Tư vấn và lựa chọn:**

Khách hàng sẽ được đội ngũ chuyên viên tư vấn chi tiết về dịch vụ phù hợp nhất.

### **Bước 2: Thực hiện dịch vụ:**

Chúng tôi áp dụng quy trình chuẩn, đảm bảo an toàn và hiệu quả cao nhất.

### **Bước 3: Chăm sóc sau dịch vụ:**

Hướng dẫn khách hàng cách chăm sóc tại nhà để duy trì kết quả lâu dài.

## **Tại sao chọn Min Nail & Hair?:**

- **Vị trí thuận lợi**: Tọa lạc tại Lavita Charm, Thủ Đức
- **Đội ngũ chuyên nghiệp**: Tay nghề cao, tận tâm
- **Giá cả cạnh tranh**: Nhiều ưu đãi hấp dẫn

> "Min Nail & Hair - Nơi vẻ đẹp của bạn được nâng niu và tỏa sáng!"

## **Đặt lịch ngay hôm nay:**

Đừng bỏ lỡ cơ hội trải nghiệm dịch vụ ${t.toLowerCase()} tại Min Nail & Hair. [Đặt lịch ngay](/booking) để nhận ưu đãi đặc biệt dành cho khách hàng mới!`;

  return { article, extractedTitle, extractedSummary: summary };
}

async function fetchSiteContext(): Promise<string> {
  try {
    const supabase = await createClient();
    const sections: string[] = [];

    const seo = await getSeoSettings();
    const phone = seo?.hotline || BRAND_INFO.phone;
    if (seo) {
      sections.push(`=== THÔNG TIN THƯƠNG HIỆU ===\nTên: ${BRAND_INFO.name}\nĐịa chỉ: ${BRAND_INFO.location}\nSĐT: ${phone}\nTrang chủ: ${seo.page_title || 'Min Nail & Hair - Lavita Charm Thủ Đức'}\nMô tả: ${seo.meta_description || ''}\nTừ khóa: ${seo.meta_keywords || ''}`);
    }

    const { data: services } = await supabase.from('services').select('name, category, description').order('category');
    if (services?.length) {
      const serviceList = services.map(s => `- ${s.category}: ${s.name}${s.description ? ` (${s.description})` : ''}`).join('\n');
      sections.push(`=== DANH SÁCH DỊCH VỤ ===\n${serviceList}`);
    }

    const { data: banner } = await supabase.from('banner_settings').select('content').eq('id', 1).single();
    if (banner?.content) {
      sections.push(`=== KHUYẾN MÃI ===\n${banner.content}`);
    }

    const { data: blogs } = await supabase.from('blogs').select('title, slug').order('created_at', { ascending: false }).limit(5);
    if (blogs?.length) {
      const blogList = blogs.map(b => `- ${b.title}: /blog/${b.slug}`).join('\n');
      sections.push(`=== BÀI VIẾT GẦN ĐÂY ===\n${blogList}`);
    }

    return sections.join('\n\n');
  } catch {
    return `Thương hiệu: ${BRAND_INFO.name}\nĐịa chỉ: ${BRAND_INFO.location}\nSĐT: ${BRAND_INFO.phone}`;
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = assistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.issues }, { status: 400 });
    }
    const { action, content, title, keywords } = parsed.data;

    if (action === 'summarize') {
      const text = content?.trim();
      if (!text) return NextResponse.json({ summary: '' });
      const geminiResult = await callGemini({
        systemInstruction: SYSTEM_SUMMARIZE,
        prompt: `Tóm tắt:\n\n${text}`,
        jsonSchema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] },
        useCache: true,
      });
      if (geminiResult.text) {
        const parsed = JSON.parse(geminiResult.text);
        return NextResponse.json({ summary: parsed.summary, fromCache: geminiResult.fromCache });
      }
      return NextResponse.json({ summary: fallbackSummary(text) });
    }

    if (action === 'suggestImages') {
      const topic = content || title;
      if (topic) {
        const result = await searchImages(topic);
        if (result.images.length > 0) {
          return NextResponse.json({ images: result.images, imageAlts: result.imageAlts, fromCache: false });
        }
      }
      return NextResponse.json({ images: fallbackImages(title), imageAlts: fallbackImageAlts(title) });
    }

    if (action === 'writeArticle') {
      if (!title?.trim()) return NextResponse.json({ error: "Thiếu chủ đề bài viết" }, { status: 400 });

      const siteContext = await fetchSiteContext();
      const backlinkRulesStr = BACKLINK_RULES.map(r => `- Nếu có từ "${r.keyword}" → chèn link [${r.text}](${r.url})`).join('\n');

      const researchResult = await callGemini({
        systemInstruction: `Bạn là cố vấn SEO cho ${BRAND_INFO.name} tại ${BRAND_INFO.location}. Sử dụng Google Search để tra cứu.`,
        prompt: `Nghiên cứu chủ đề: "${title}". Từ khóa bổ sung: "${keywords || 'Không có'}"`,
        config: { tools: [{ googleSearch: {} }] },
        timeout: 25000,
        useCache: true,
      });
      const researchText = researchResult.text || '';

      const prompt = `Viết bài SEO chất lượng cao về chủ đề: "${title}"

=== THÔNG TIN DOANH NGHIỆP ===
${siteContext}

=== NGHIÊN CỨU TỪ KHÓA ===
${researchText}

=== YÊU CẦU ===
- Mở bài 2-3 đoạn ngắn (không heading), bắt đầu bằng câu hỏi gần gũi.
- 3-4 phần ##, mỗi phần có 2-3 ### con.
- ### dạng ### **Tiêu đề con:**, mỗi ### có 2-3 đoạn ngắn.
- KHÔNG dùng # (H1).
- Chèn backlink nội bộ tự nhiên:
${backlinkRulesStr}
- Kêu gọi đặt lịch (CTA) ở cuối bài.
- Từ khóa địa phương: Thủ Đức, Lavita Charm, Trường Thọ, TP.HCM.
- Dài 500-800 từ.
- Mỗi block (heading, paragraph) cách nhau 1 dòng trống.
- Trả về JSON theo schema.`;

      const geminiResult = await callGemini({
        systemInstruction: SYSTEM_WRITER,
        prompt,
        jsonSchema: ARTICLE_WRITER_SCHEMA,
        useCache: true,
      });

      if (geminiResult.text) {
        const parsed = JSON.parse(geminiResult.text);
        return NextResponse.json({
          article: parsed.content || geminiResult.text,
          title: parsed.title || title,
          summary: parsed.summary || '',
          image_alt: parsed.image_alt || '',
          research: researchText,
          fromCache: geminiResult.fromCache,
        });
      }

      const { article, extractedTitle, extractedSummary } = fallbackArticle(title);
      return NextResponse.json({ article, title: extractedTitle, summary: extractedSummary });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("[AI-ASSIST ERROR]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
