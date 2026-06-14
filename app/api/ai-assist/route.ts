import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560066984-58dadb2e71c4?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522337360788-6b1dfde2c4fb?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596464716127-f2b0b2f1b7a2?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522337661159-0a0b4a2a4b4f?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560752059-53a9b7c0c6b8?w=800&auto=format&fit=crop',
];

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
  const count = Math.min(4, FALLBACK_IMAGES.length);
  const shuffled = [...FALLBACK_IMAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function fallbackArticle(title: string, keywords?: string): { article: string; extractedTitle: string; extractedSummary: string } {
  const t = title || 'Dịch vụ làm đẹp';
  const kw = keywords ? ` (${keywords})` : '';
  const extractedTitle = t;
  const summary = `Khám phá dịch vụ ${t.toLowerCase()} chất lượng cao tại Min Nail & Hair - Lavita Charm, Thủ Đức. Đặt lịch ngay hôm nay để nhận ưu đãi đặc biệt!`;
  const article = `# ${t}

${summary}

## ${t} là gì?

${t} là một trong những dịch vụ chăm sóc sắc đẹp được yêu thích nhất hiện nay${kw}. Tại [Min Nail & Hair](https://minnailhair.vn), chúng tôi tự hào mang đến cho khách hàng những trải nghiệm làm đẹp đẳng cấp với đội ngũ chuyên viên giàu kinh nghiệm.

### Lợi ích khi sử dụng dịch vụ

- **Tiết kiệm thời gian**: Quy trình nhanh chóng, chuyên nghiệp
- **Chất lượng đảm bảo**: Sử dụng sản phẩm cao cấp, an toàn
- **Không gian thư giãn**: Phong cách sang trọng, thoải mái

## Quy trình thực hiện

### Bước 1: Tư vấn và lựa chọn

Khách hàng sẽ được đội ngũ chuyên viên tư vấn chi tiết về dịch vụ phù hợp nhất.

### Bước 2: Thực hiện dịch vụ

Chúng tôi áp dụng quy trình chuẩn, đảm bảo an toàn và hiệu quả cao nhất.

### Bước 3: Chăm sóc sau dịch vụ

Hướng dẫn khách hàng cách chăm sóc tại nhà để duy trì kết quả lâu dài.

## Tại sao chọn Min Nail & Hair?

- **Vị trí thuận lợi**: Tọa lạc tại Lavita Charm, Thủ Đức
- **Đội ngũ chuyên nghiệp**: Tay nghề cao, tận tâm
- **Giá cả cạnh tranh**: Nhiều ưu đãi hấp dẫn

> "Min Nail & Hair - Nơi vẻ đẹp của bạn được nâng niu và tỏa sáng!"

## Đặt lịch ngay hôm nay

Đừng bỏ lỡ cơ hội trải nghiệm dịch vụ ${t.toLowerCase()} tại Min Nail & Hair. [Đặt lịch ngay](/booking) để nhận ưu đãi đặc biệt dành cho khách hàng mới!`;

  return { article, extractedTitle, extractedSummary: summary };
}

async function callGemini(prompt: string, useSearchGrounding = false): Promise<{ text: string | null; sources?: any[] }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { text: null };
  try {
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    const config: any = {};
    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }
    const res = await ai.models.generateContent({ model: "gemini-2.5-flash-lite", contents: prompt, config: Object.keys(config).length ? config : undefined });
    const sources = res.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri,
    })) || [];
    return { text: res.text?.trim() || null, sources: sources.slice(0, 3) };
  } catch {
    return { text: null };
  }
}

async function fetchSiteContext(): Promise<string> {
  try {
    const supabase = await createClient();
    const sections: string[] = [];

    const { data: seo } = await supabase.from('seo_settings').select('*').eq('id', 1).single();
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
  try {
    const { action, content, title, keywords } = await req.json();

    if (action === 'summarize') {
      const text = content?.trim();
      if (!text) return NextResponse.json({ summary: '' });
      const geminiResult = await callGemini(
        `Bạn là chuyên gia SEO. Hãy tóm tắt đoạn văn sau thành 1-2 câu ngắn gọn (tối đa 160 ký tự) để làm thẻ meta description, giữ từ khóa chính:\n\n${text}`
      );
      return NextResponse.json({ summary: geminiResult.text || fallbackSummary(text) });
    }

    if (action === 'suggestImages') {
      const topic = content || title;
      if (topic) {
        const geminiResult = await callGemini(
          `Bạn là chuyên gia hình ảnh cho spa và salon làm đẹp. Dựa vào nội dung sau, hãy đưa ra 4 từ khóa tìm kiếm ảnh trên Unsplash phù hợp nhất để minh họa cho bài viết. Mỗi từ khóa trên một dòng, bằng tiếng Anh. Không giải thích.\n\nNội dung:\n${topic.substring(0, 3000)}`
        );
        if (geminiResult.text) {
          const terms = geminiResult.text.split('\n').map(t => t.trim()).filter(t => t.length > 0).slice(0, 4);
          const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
          const images: string[] = [];
          for (const term of terms) {
            if (UNSPLASH_ACCESS_KEY) {
              try {
                const resp = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=1&orientation=landscape`, { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
                const data = await resp.json();
                if (data.results?.[0]) { images.push(data.results[0].urls.regular + '?w=800&auto=format&fit=crop'); continue; }
              } catch { }
            }
            images.push(FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]);
          }
          if (images.length > 0) return NextResponse.json({ images });
        }
      }
      return NextResponse.json({ images: fallbackImages(title) });
    }

    if (action === 'writeArticle') {
      if (!title?.trim()) return NextResponse.json({ error: "Thiếu chủ đề bài viết" }, { status: 400 });

      const siteContext = await fetchSiteContext();
      const backlinkRulesStr = BACKLINK_RULES.map(r => `- Nếu có từ "${r.keyword}" → chèn link [${r.text}](${r.url})`).join('\n');

      const researchResult = await callGemini(
        `Bạn là cố vấn SEO cho ${BRAND_INFO.name} tại ${BRAND_INFO.location}. Hãy nghiên cứu về chủ đề sau và cung cấp:
1. 3 từ khóa chính (tiếng Việt, có yếu tố địa phương như Thủ Đức, Lavita Charm)
2. 3 từ khóa phụ dạng long-tail
3. Gợi ý cấu trúc dàn bài
4. Xu hướng tìm kiếm gần đây

Chủ đề: "${title}"
Từ khóa bổ sung: "${keywords || 'Không có'}"

Trả về ngắn gọn dạng Markdown.`,
        true
      );
      const researchText = researchResult.text || '';

      const prompt = `Bạn là chuyên gia Copywriter SEO trong ngành làm đẹp, Spa, Hair và Nail.

=== THÔNG TIN DOANH NGHIỆP ===
${siteContext}

=== NGHIÊN CỨU TỪ KHÓA ===
${researchText}

=== YÊU CẦU BÀI VIẾT ===
Viết bài SEO chất lượng cao về chủ đề: "${title}"
Từ khóa phụ: "${keywords || 'Không có'}"

HƯỚNG DẪN CHI TIẾT:
1. BẮT ĐẦU bằng "# Tiêu đề bài viết" (chứa từ khóa chính, hấp dẫn)
2. SAU TIÊU ĐỀ là 1 đoạn summary ngắn (thẻ meta description, tối đa 160 ký tự)
3. NỘI DUNG CHI TIẾT 3-4 phần có tiêu đề H2 (##), xen kẽ H3 (###)
4. SỬ DỤNG từ khóa địa phương: Thủ Đức, Lavita Charm, Trường Thọ, TP.HCM một cách tự nhiên
5. CHÈN BACKLINK nội bộ tự nhiên vào bài viết:
${backlinkRulesStr}
   - Thêm ít nhất 2-3 backlink trong bài
6. KÊU GỌI ĐẶT LỊCH (Call to Action) ở cuối, chèn link [Đặt lịch ngay](/booking)

PHONG CÁCH VIẾT:
- Giọng văn tự nhiên, lôi cuốn, thân thiện
- Tiếng Việt chuẩn, có dấu đầy đủ
- Đề cao thương hiệu ${BRAND_INFO.name} (${BRAND_INFO.location})
- Thể hiện sự chuyên nghiệp, uy tín, gần gũi
- Dài 500-800 từ, đủ ý, không lan man
- Trả về định dạng Markdown`;

      const geminiResult = await callGemini(prompt);

      if (geminiResult.text) {
        let article = geminiResult.text;
        const titleMatch = article.match(/^#\s+(.+)/m);
        const extractedTitle = titleMatch ? titleMatch[1].trim() : title;
        const summaryMatch = article.replace(/^#\s+.+\n*/m, '').match(/^(.+?)(?:\n\n|$)/m);
        const extractedSummary = summaryMatch ? summaryMatch[1].replace(/\*\*/g, '').trim().substring(0, 200) : '';
        return NextResponse.json({ article, title: extractedTitle, summary: extractedSummary, research: researchText });
      }

      const { article, extractedTitle, extractedSummary } = fallbackArticle(title, keywords);
      return NextResponse.json({ article, title: extractedTitle, summary: extractedSummary });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[AI-ASSIST ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
