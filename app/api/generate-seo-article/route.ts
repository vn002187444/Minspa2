import { callGemini } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/utils/auth";

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia Copywriter SEO hàng đầu trong ngành làm đẹp, Spa, Hair và Nail tại Việt Nam.

QUY TẮC:
- Chỉ viết về chăm sóc sắc đẹp, không tư vấn y tế.
- Luôn trả về JSON đúng schema yêu cầu.
- Giọng văn thân thiện, chuyên nghiệp, tự nhiên.
- Tiếng Việt có dấu đầy đủ.`;

const ARTICLE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Tiêu đề bài viết, tối đa 70 ký tự, chứa từ khóa chính" },
    metaDescription: { type: "string", description: "Thẻ mô tả ngắn gọn, tối đa 160 ký tự" },
    content: { type: "string", description: "Nội dung Markdown gồm 3-4 phần H2, kèm CTA đặt lịch" },
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
Địa điểm: Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức.
Thương hiệu: Min Nail & Hair`;

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
    const fallbackArticle = `# Đặt Lịch Làm Đẹp Tại Min Nail & Hair - Không Gian Thư Giãn Tuyệt Vời Tại Thủ Đức

## Xu Hướng Chăm Sóc Sắc Đẹp Hiện Đại Về ${topic || "Làm Đẹp Sức Khỏe"}
Ngày nay, các phương pháp làm đẹp hiện đại không chỉ đơn thuần là chăm sóc vẻ bề ngoài mà còn là liệu pháp tinh thần giúp giải tỏa căng thẳng hiệu quả. Rất nhiều chị em và khách hàng tại Thủ Đức đang quan tâm đặc biệt đến tìm kiếm từ khóa thương hiệu liên quan đến **${topic || "chăm sóc móng & gội dưỡng sinh"}**${keywords ? ` cùng các chủ đề liên quan như **${keywords}**` : ""}. Tại Thủ Đức, **Min Nail & Hair** luôn là địa chỉ uy tín, đem lại sự an tâm tuyệt đối cho khách hàng.

## Các Dịch Vụ Nổi Bật Được Yêu Thích Tại Min
Chúng tôi tự hào đem đến cho bạn những trải nghiệm chăm sóc sắc đẹp trọn vẹn và an toàn tốt nhất:
- **Nail Art chuyên nghiệp**: Thiết kế phong phú, độc đáo từ phong cách Hàn - Nhật nhẹ nhàng đến các mẫu sang trọng. Min luôn sử dụng dòng sơn gel organic cao cấp nhập khẩu thân thiện môi trường để móng luôn bóng đẹp, bền chắc mà không bị xơ yếu.
- **Gội đầu dưỡng sinh thảo dược**: Sử dụng hoàn toàn nước gội điều chế từ bồ kết, sả chanh, vỏ bưởi kết hợp bài massage ấn huyệt chuyên sâu vùng đầu, cổ, vai gáy. Giúp đả thông kinh lạc, loại bỏ hoàn toàn mệt mỏi, căng thẳng và nuôi dưỡng mái tóc chắc khỏe bóng mượt.
- **Khách Tự Do (Random) Linh Hoạt**: Min có hệ thống tiếp đón chu đáo, ngay cả khi bạn đặt lịch ngẫu nhiên hoặc bận rộn ghé qua không hẹn trước, các kỹ thuật viên vẫn luôn sẵn sàng phục vụ và mang lại bộ móng xinh hoặc mái tóc ưng ý nhanh chóng nhất.

## Không Gian Spa Sang Trọng & Đội Ngũ Tận Tâm
Tọa lạc tại khu căn hộ sầm uất **Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức**, Min sở hữu không gian thiết kế mộc mạc, tinh tế với hương tinh dầu sả chanh thoang thoảng dịu nhẹ. Đội ngũ nhân viên của Min giàu kinh nghiệm, chu đáo tỉ mỉ, luôn chăm chút từng móng tay, sợi tóc của khách hàng bằng tất cả sự chân thành và nhiệt huyết.

## Nhận Ngay Ưu Đãi & Đặt Lịch Làm Đẹp Ngay!
Sức khỏe của tóc và bộ móng của bạn xứng đáng nhận được sự chăm sóc tuyệt vời nhất. Đừng chần chừ, hãy sử dụng tính năng **Đặt lịch Online** của Min ngay hôm nay để chọn thợ yêu thích hoặc chọn ưu tiên ngẫu nhiên và nhận ngay voucher giảm giá 5% trực tuyến độc quyền! Chúng tôi rất hân hạnh được đón tiếp bạn.`;

    return NextResponse.json({ article: fallbackArticle, isFallback: true });
  }
}
