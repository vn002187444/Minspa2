import { callGemini } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/utils/auth";

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia viết copy cho spa và salon làm đẹp (Nail, Gội dưỡng sinh, Massage) tại Việt Nam.
Chỉ viết mô tả dịch vụ, không tư vấn y tế. Giọng văn sinh động, hấp dẫn. Tiếng Việt có dấu.`;

const DESC_SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string", description: "Đoạn mô tả ngắn 2-3 câu, tối đa 50 từ" },
  },
  required: ["description"],
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let serviceName = "";
  let category = "";
  try {
    const body = await req.json();
    serviceName = body.serviceName || "";
    category = body.category || "";

    if (!serviceName) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const prompt = `Viết mô tả dịch vụ:
Tên: "${serviceName}"
Danh mục: "${category}"`;

    const result = await callGemini({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt,
      jsonSchema: DESC_SCHEMA,
      useCache: true,
    });

    if (result.text) {
      const parsed = JSON.parse(result.text);
      return NextResponse.json({ description: parsed.description, fromCache: result.fromCache });
    }

    throw new Error("Gemini returned empty");
  } catch (error: unknown) {
    console.warn("[GEMINI API ERROR] Using fallback description.", error);
    
    // Custom beautiful fallback description based on service request
    let fallback = `Trải nghiệm dịch vụ chuyên nghiệp ${serviceName || ""} đặc sắc tại Min Nail & Hair. `;
    if (category?.toLowerCase().includes("nail") || serviceName?.toLowerCase().includes("nail") || serviceName?.toLowerCase().includes("móng")) {
      fallback += `Với nguyên liệu sơn gel cao cấp nhập khẩu an toàn, kỹ thuật viên tỉ mỉ đo vẽ các mẫu móng thời thượng nhất, mang lại bộ móng chắc khỏe và thời trang cho quý khách.`;
    } else if (category?.toLowerCase().includes("gội") || serviceName?.toLowerCase().includes("gội") || serviceName?.toLowerCase().includes("dưỡng sinh")) {
      fallback += `Liệu trình kết hợp thảo mộc tự nhiên thơm mát cùng các động tác massage cổ vai gáy bấm huyệt điêu luyện giúp xua tan căng thẳng mệt mỏi, nuôi dưỡng tóc sâu khỏe từ gốc.`;
    } else if (category?.toLowerCase().includes("massage") || serviceName?.toLowerCase().includes("massage")) {
      fallback += `Sử dụng tinh dầu thiên nhiên cao cấp kết hợp phương pháp bấm huyệt truyền thống, đem đến trạng thái thư giãn tuyệt đỉnh, lưu thông khí huyết và tái tạo năng lượng tích cực cho cơ thể.`;
    } else {
      fallback += `Sự chăm sóc tận tâm chu đáo từ đội ngũ kỹ thuật viên tay nghề cao sẽ mang lại cho bạn những phút giây thư giãn thoải mái cùng sự tự tin rạng ngời.`;
    }

    return NextResponse.json({ description: fallback, isFallback: true });
  }
}
