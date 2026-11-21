'use server'

import { createClient } from "@/utils/supabase/server";
import { callGemini } from "@/lib/ai/gemini";
import { AiBookingRecommendation, CustomerLookupResult, ServiceSuggestion } from "@/types/booking-ai";
import { logger } from "@/lib/logger";

const RECOMMENDATION_SCHEMA = {
  type: "object",
  properties: {
    welcomeMessage: {
      type: "string",
      description: "Câu chào ngắn thân thiện tối đa 15 từ, xưng Min Nail & Hair hoặc bên em, gọi khách là chị hoặc anh/chị"
    },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          serviceId: { type: "string" },
          serviceName: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
          duration: { type: "number" },
          reason: { type: "string", description: "Lý do gợi ý ngắn gọn, hấp dẫn dưới 12 từ" }
        },
        required: ["serviceId", "serviceName", "category", "price", "duration", "reason"]
      }
    }
  },
  required: ["welcomeMessage", "suggestions"]
};

export async function lookupCustomerAndGetAiRecommendations(phone: string): Promise<{
  success: boolean;
  lookup: CustomerLookupResult;
  aiRecommendation?: AiBookingRecommendation;
  error?: string;
}> {
  try {
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      return {
        success: false,
        lookup: { isExisting: false },
        error: 'Số điện thoại không hợp lệ'
      };
    }

    const supabase = await createClient();

    // 1. Fetch active services list to feed to Gemini
    const { data: activeServices } = await supabase
      .from('services')
      .select('id, name, category, price, duration, is_active')
      .eq('is_active', true)
      .limit(30);

    const availableServices = activeServices || [];

    // 2. Lookup customer by phone
    const { data: customers } = await supabase
      .from('customers')
      .select('id, full_name, phone')
      .eq('phone', cleanPhone);

    const customer = customers && customers.length > 0 ? customers[0] : null;

    if (!customer) {
      // New customer
      const defaultSuggestions: ServiceSuggestion[] = availableServices
        .slice(0, 3)
        .map(s => ({
          serviceId: s.id,
          serviceName: s.name,
          category: s.category,
          price: Number(s.price),
          duration: Number(s.duration) || 30,
          reason: 'Dịch vụ được yêu thích nhất cho khách trải nghiệm lần đầu'
        }));

      return {
        success: true,
        lookup: {
          isExisting: false,
        },
        aiRecommendation: {
          welcomeMessage: 'Chào mừng chị lần đầu đến với Min Nail & Hair ạ!',
          suggestions: defaultSuggestions
        }
      };
    }

    // 3. Existing customer - fetch recent history
    const { data: pastAppointments } = await supabase
      .from('appointments')
      .select(`
        id, created_at, start_time,
        appointment_services (
          services ( id, name, category, price, duration )
        )
      `)
      .eq('customer_id', customer.id)
      .in('status', ['COMPLETED'])
      .order('created_at', { ascending: false })
      .limit(5);

    const recentServicesList: { id: string; name: string; category: string; date: string }[] = [];
    (pastAppointments || []).forEach(appt => {
      const dateStr = new Date(appt.start_time || appt.created_at).toLocaleDateString('vi-VN');
      (appt.appointment_services || []).forEach((as: any) => {
        if (as.services) {
          recentServicesList.push({
            id: as.services.id,
            name: as.services.name,
            category: as.services.category,
            date: dateStr
          });
        }
      });
    });

    const lookupResult: CustomerLookupResult = {
      isExisting: true,
      customer: {
        id: customer.id,
        fullName: customer.full_name,
        phone: customer.phone
      },
      recentServices: recentServicesList
    };

    // 4. Build prompt for Gemini 3.1 Flash Lite
    const customerName = customer.full_name || 'chị';
    const recentServiceNames = recentServicesList.map(s => `${s.name} (${s.category})`).slice(0, 4).join(', ') || 'Chưa có lịch sử';
    const serviceCatalog = availableServices.map(s => `[ID: ${s.id}] ${s.name} - ${s.category} - ${Number(s.price).toLocaleString('vi-VN')}đ - ${s.duration}p`).join('\n');

    const prompt = `Khách hàng: ${customerName}
Dịch vụ đã từng làm: ${recentServiceNames}

Danh mục dịch vụ hiện có của salon:
${serviceCatalog}

Hãy gợi ý 2-3 dịch vụ phù hợp nhất tiếp theo cho khách và 1 câu chào mừng đích danh ${customerName}. Gợi ý phải chọn serviceId chính xác từ danh sách trên.`;

    const geminiResult = await callGemini({
      systemInstruction: 'Bạn là chuyên gia tư vấn làm đẹp của salon Min Nail & Hair. Hãy phân tích sở thích của khách để gợi ý đúng dịch vụ họ cần nhất hôm nay.',
      prompt,
      jsonSchema: RECOMMENDATION_SCHEMA,
      useCache: true,
      cacheKey: `booking_rec_${customer.id}_${new Date().toISOString().split('T')[0]}`,
      config: { maxOutputTokens: 300 }
    });

    if (geminiResult.text) {
      try {
        const parsed = JSON.parse(geminiResult.text);
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          // Verify suggestions have valid IDs from availableServices
          const validSuggestions: ServiceSuggestion[] = parsed.suggestions
            .map((s: any) => {
              const matched = availableServices.find(av => av.id === s.serviceId || av.name.toLowerCase() === s.serviceName.toLowerCase());
              if (!matched) return null;
              return {
                serviceId: matched.id,
                serviceName: matched.name,
                category: matched.category,
                price: Number(matched.price),
                duration: Number(matched.duration) || 30,
                reason: s.reason || 'Dịch vụ phù hợp với lịch sử làm đẹp của chị'
              };
            })
            .filter(Boolean) as ServiceSuggestion[];

          if (validSuggestions.length > 0) {
            return {
              success: true,
              lookup: lookupResult,
              aiRecommendation: {
                welcomeMessage: parsed.welcomeMessage || `Chào mừng ${customerName} quay lại với Min Nail & Hair ạ!`,
                suggestions: validSuggestions
              }
            };
          }
        }
      } catch (parseErr) {
        logger.error('[PersonalizedBooking] Failed to parse Gemini response', parseErr instanceof Error ? parseErr : new Error(String(parseErr)));
      }
    }

    // Fallback if AI call returns empty
    const fallbackSuggestions: ServiceSuggestion[] = availableServices.slice(0, 3).map(s => ({
      serviceId: s.id,
      serviceName: s.name,
      category: s.category,
      price: Number(s.price),
      duration: Number(s.duration) || 30,
      reason: 'Dịch vụ được gợi ý cho chị hôm nay'
    }));

    return {
      success: true,
      lookup: lookupResult,
      aiRecommendation: {
        welcomeMessage: `Chào mừng ${customerName} quay lại với Min Nail & Hair ạ!`,
        suggestions: fallbackSuggestions
      }
    };
  } catch (err) {
    logger.error('[PersonalizedBooking] Exception', err instanceof Error ? err : new Error(String(err)));
    return {
      success: false,
      lookup: { isExisting: false },
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
