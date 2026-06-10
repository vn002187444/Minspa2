import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let serviceName = "";
  let category = "";
  try {
    const body = await req.json();
    serviceName = body.serviceName || "";
    category = body.category || "";

    if (!serviceName) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Bạn là một chuyên gia viết copy cho spa và salon làm đẹp (Nail, Gội dưỡng sinh, Massage).
Hãy viết một đoạn mô tả ngắn gọn, sinh động, hấp dẫn (khoảng 2-3 câu, tối đa 50 từ) cho dịch vụ sau:
Tên dịch vụ: "${serviceName}"
Danh mục: "${category}"

Chỉ trả về đoạn văn mô tả, không cần thêm tiêu đề hay lời chào hỏi.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ description: response.text });
  } catch (error: any) {
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
