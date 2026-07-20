import { callGemini } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/utils/auth";

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia Copywriter SEO hàng đầu trong ngành làm đẹp, Spa, Hair và Nail tại Việt Nam.

PHONG CÁCH VIẾT:
- Giọng văn ấm áp, chuyên nghiệp, tự nhiên — như người bạn am hiểu đang chia sẻ.
- Không viết như bài báo. Viết như người thật trải nghiệm thật.
- Mỗi đoạn văn tối đa 3-4 câu, xuống dòng sau mỗi ý.
- Tiếng Việt có dấu đầy đủ.
- Luôn trả về JSON đúng schema.

ĐỊNH DẠNG MARKDOWN (hệ thống chỉ render được ## và ###):
- ## cho section chính, ### cho sub-section.
- KHÔNG BAO GIỜ dùng # (H1).
- ### dạng: ### **Tiêu đề con:**
- Mỗi heading có 1 dòng trống trước và sau.
- Mỗi đoạn văn cách nhau 1 dòng trống.
- Dùng list (- item) khi liệt kê 3+ mục.
- Internal link dạng: [đặt lịch ngay](/booking), KHÔNG dùng URL trần.`;

const ARTICLE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Tiêu đề SEO, tối đa 70 ký tự, chứa từ khóa chính" },
    metaDescription: { type: "string", description: "Thẻ mô tả SEO, tối đa 160 ký tự, tóm tắt + CTA" },
    content: { type: "string", description: "Markdown: mở bài không heading, 3-4 phần ## có ### bên trong, kết bài CTA. KHÔNG dùng # (H1). ### dạng ### **Tiêu đề:**. Tối đa 1200 từ." },
  },
  required: ["title", "metaDescription", "content"],
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let topic = "";
  let keywords = "";
  try {
    const body = await req.json();
    topic = body.topic || "";
    keywords = body.keywords || "";

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const prompt = `Viết bài SEO về chủ đề: "${topic}"
Từ khóa phụ: "${keywords || "Không có"}"

THÔNG TIN THƯƠNG HIỆU:
- Tên: Min Nail & Hair (Min Salon)
- Địa chỉ: Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức, TP.HCM
- Dịch vụ: gội đầu dưỡng sinh thảo dược, nail nghệ thuật, massage body
- Đặt lịch: https://minhair.vercel.app/booking

CẤU TRÚC: Mở bài 2-3 đoạn ngắn (không heading), 3-4 phần ## có 2-3 ### mỗi phần, kết bài CTA.
QUY TẮC: ## section chính, ### sub-section dạng ### **Tiêu đề:**. KHÔNG dùng #. Mỗi block cách nhau 1 dòng trống. Internal link markdown [đặt lịch ngay](https://minhair.vercel.app/booking).`;

    const result = await callGemini({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt,
      jsonSchema: ARTICLE_SCHEMA,
      useCache: true,
    });

    if (result.text) {
      const parsed = JSON.parse(result.text);
      return NextResponse.json({
        article: parsed.content || result.text,
        title: parsed.title || topic,
        summary: parsed.metaDescription || "",
        fromCache: result.fromCache,
      });
    }

    throw new Error("Gemini returned empty");
  } catch (error: unknown) {
    console.warn("[GEMINI ARTICLE GENERATOR ERROR] Using high-quality fallback content.", error);
    
    // Create custom beautiful SEO article markdown based on the requested topic and keywords
    const fallbackArticle = `Khám phá dịch vụ ${topic || "làm đẹp"} tại Min Nail & Hair — địa chỉ chăm sóc sắc đẹp uy tín tại Thủ Đức, TP.HCM.

Bạn có bao giờ cảm thấy mệt mỏi sau những ngày làm việc căng thẳng và muốn tìm một không gian thư giãn thật sự? Liệu pháp làm đẹp không chỉ giúp cải thiện vẻ bề ngoài mà còn là cách tuyệt vời để tái tạo năng lượng cho cơ thể và tinh thần.

### **Hiểu về ${topic || "chăm sóc sắc đẹp"}:**

${topic || "Chăm sóc sắc đẹp"} là một trong những dịch vụ được yêu thích nhất hiện nay. Tại **Min Nail & Hair**, chúng tôi mang đến trải nghiệm làm đẹp đẳng cấp với đội ngũ chuyên viên giàu kinh nghiệm và sản phẩm cao cấp nhập khẩu.

- **Sản phẩm an toàn**: Sử dụng dòng sản phẩm organic thân thiện với cơ thể
- **Quy trình chuẩn**: Đội ngũ kỹ thuật viên tay nghề cao, tận tâm
- **Không gian thư giãn**: Thiết kế mộc mạc, tinh tế với hương tinh dầu dịu nhẹ

### **Quy trình thực hiện tại Min Salon:**

Khách hàng sẽ được tư vấn chi tiết về dịch vụ phù hợp nhất. Quy trình thực hiện đảm bảo an toàn và hiệu quả cao. Hướng dẫn chăm sóc tại nhà để duy trì kết quả lâu dài.

## **Không gian spa sang trọng tại Thủ Đức:**

Tọa lạc tại **Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức**, Min Salon sở hữu không gian thiết kế tinh tế với hương tinh dầu sả chanh thoang thoảng. Đội ngũ nhân viên giàu kinh nghiệm, luôn chăm chút từng chi tiết nhỏ nhất.

## **Đặt lịch ngay hôm nay:**

Đừng bỏ lỡ cơ hội trải nghiệm dịch vụ tuyệt vời tại Min Nail & Hair. [Đặt lịch ngay](https://minhair.vercel.app/booking) để nhận ưu đãi đặc biệt dành cho khách hàng mới!`;

    return NextResponse.json({ article: fallbackArticle, isFallback: true });
  }
}
