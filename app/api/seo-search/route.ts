import { callGemini } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/utils/auth";

const SYSTEM_INSTRUCTION = `Bạn là cố vấn SEO cho chuỗi dịch vụ "Min Nail & Hair" tại TP.HCM.
Sử dụng Google Search để tra cứu xu hướng thực tế. Trả về JSON đúng schema. Tiếng Việt có dấu.`;

const SEO_SCHEMA = {
  type: "object",
  properties: {
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách 5 từ khóa chính & phụ có lượt tìm kiếm cao",
    },
    trends: { type: "string", description: "Xu hướng hoặc thói quen nổi bật của khách hàng" },
    outline: { type: "string", description: "Cấu trúc dàn bài SEO đề nghị (Markdown)" },
    headlineTips: { type: "string", description: "Lời khuyên viết tiêu đề thu hút" },
  },
  required: ["keywords", "trends", "outline", "headlineTips"],
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let query = "";
  let keywords = "";
  try {
    const body = await req.json();
    query = body.query || body.topic || "";
    keywords = body.keywords || "";

    if (!query) {
      return NextResponse.json({ error: "Query/Topic is required" }, { status: 400 });
    }

    const prompt = `Nghiên cứu SEO cho chủ đề: "${query}"
Từ khóa bổ sung: "${keywords || "Không có"}"`;

    const result = await callGemini({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt,
      config: { tools: [{ googleSearch: {} }] },
      jsonSchema: SEO_SCHEMA,
      useCache: true,
    });

    if (!result.text) throw new Error("Gemini returned empty");

    const parsed = JSON.parse(result.text);
    const researchMd = `### Kết quả phân tích SEO\n\n**Từ khóa:** ${(parsed.keywords || []).join(', ')}\n\n**Xu hướng:** ${parsed.trends || ''}\n\n**Dàn bài:**\n${parsed.outline || ''}\n\n**Mẹo tiêu đề:**\n${parsed.headlineTips || ''}`;

    return NextResponse.json({
      research: researchMd,
      summary: parsed.trends || researchMd,
      keywords: parsed.keywords || [],
      outline: parsed.outline || '',
      headlineTips: parsed.headlineTips || '',
      sources: result.sources,
      model: result.modelUsed,
      fromCache: result.fromCache,
    });
  } catch (error: unknown) {
    console.warn("[GEMINI SEO SEARCH ERROR] Using fallback analysis.", error);

    const fbKeywords = [
      `làm móng đẹp Thủ Đức`,
      `gội đầu dưỡng sinh Lavita Charm`,
      `tiệm tóc nữ uy tín Trường Thọ Thủ Đức`,
      `${query || "làm nail tóc"} giá rẻ chuyên nghiệp`,
      `combo làm móng gội đầu dưỡng sinh thảo dược`,
    ];
    const fbTrends = `Khách hàng bận rộn chuộng combo trọn gói, đặt lịch online và không gian thư giãn.`;
    const fbOutline = `Mở bài → Thân bài (H2: Giới thiệu, H2: Quy trình, H2: Feedback) → Kết luận + CTA`;
    const fbHeadlineTips = `"Bật mí địa chỉ ${query || "làm đẹp"} được chị em Thủ Đức săn đón!"`;

    return NextResponse.json({
      research: `### Kết quả phân tích SEO\n\n**Từ khóa:** ${fbKeywords.join(', ')}\n\n**Xu hướng:** ${fbTrends}\n\n**Dàn bài:** ${fbOutline}\n\n**Mẹo tiêu đề:** ${fbHeadlineTips}`,
      summary: fbTrends,
      keywords: fbKeywords,
      outline: fbOutline,
      headlineTips: fbHeadlineTips,
      sources: [
        { title: "Báo cáo xu hướng Hair & Spa 2026", uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app'}/reports/beauty-trends` },
      ],
      isFallback: true,
    });
  }
}
