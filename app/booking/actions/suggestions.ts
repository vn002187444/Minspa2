'use server'

import { createClient } from "@/utils/supabase/server";
import { callGemini } from "@/lib/ai/gemini";

const GREETING_SCHEMA = {
  type: "object",
  properties: {
    greeting: { type: "string", description: "1 câu chào ngắn tối đa 15 từ, thân thiện, dùng 'chị'/'ạ'" },
  },
  required: ["greeting"],
};

const SYSTEM_PROMPT = `Bạn là trợ lý AI của tiệm Min Nail & Hair. Nhiệm vụ: viết 1 câu chào ngắn (tối đa 15 từ) hiển thị cho khách hàng khi họ quay lại đặt lịch.

NGUYÊN TẮC:
- Viết TRỰC TIẾP cho khách hàng, xưng "Min Nail & Hair" hoặc "bên em"
- Chỉ 1 câu duy nhất, tối đa 15 từ
- KHÔNG phân tích, KHÔNG liệt kê, KHÔNG đưa ra nhiều lựa chọn
- Thân thiện, dùng "chị", "ạ"
- KHÔNG dùng emoji, KHÔNG dùng dấu ngoặc kép
- Trả về JSON object: {"greeting": "..."}

TÌNH HUỐNG & VÍ DỤ:
- Khách mới (chưa có lịch sử): {"greeting": "Chào mừng chị đến với Min Nail & Hair ạ!"}
- Tháng sinh nhật: {"greeting": "Chúc mừng sinh nhật chị, Min có ưu đãi đặc biệt tặng chị ạ!"}
- Có gói active: {"greeting": "Gói liệu trình của chị còn buổi đang chờ sẵn sàng ạ!"}
- Quay lại sau >60 ngày: {"greeting": "Lâu quá mới gặp lại chị, hôm nay chị muốn làm gì ạ?"}
- Còn lại (khách quay lại bình thường): {"greeting": "Chào mừng chị quay lại, hôm nay chị muốn làm gì ạ?"}`;

export async function getCustomerCareSuggestion(phone: string): Promise<string> {
  const supabase = await createClient();
  const cleanPhone = phone.replace(/\s+/g, '');

  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, phone, birthday')
    .eq('phone', cleanPhone);

  const customer = customers && customers.length > 0 ? customers[0] : null;

  if (!customer) {
    return "Chào mừng anh/chị lần đầu đến với Min Nail & Hair! Đừng bỏ lỡ góc DEAL CHẤN ĐỘNG hôm nay: Combo Sơn Gel + Cắt da chỉ 99k nhé!";
  }

  const [packagesResult, appointmentsResult] = await Promise.all([
    supabase
      .from('customer_packages')
      .select('id, remaining_sessions, status, purchased_at, treatment_packages!package_id ( id, name, service_id )')
      .eq('customer_id', customer.id)
      .order('purchased_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('id, created_at, start_time, status, appointment_services ( services ( id, name, category, price ) )')
      .eq('customer_id', customer.id)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false }),
  ]);

  const customerPackages = packagesResult.data || [];
  const appointments = appointmentsResult.data || [];

  const context = buildContext(customer, customerPackages, appointments);

  const geminiResult = await callGemini({
    systemInstruction: SYSTEM_PROMPT,
    prompt: context,
    jsonSchema: GREETING_SCHEMA,
    useCache: true,
    cacheKey: `suggestion_${customer.id}_${new Date().toISOString().split('T')[0]}`,
    config: { maxOutputTokens: 100 },
  });

  if (geminiResult.text) {
    const trimmed = geminiResult.text.trim();
    try {
      const parsed = JSON.parse(trimmed);
      const greeting = parsed.greeting?.trim();
      if (greeting && greeting.split(/\s+/).length <= 15) return greeting;
    } catch {
      const words = trimmed.split(/\s+/);
      if (words.length <= 15) return trimmed;
    }
  }

  return getFallbackSuggestion(customer, customerPackages, appointments);
}

function buildContext(customer: Record<string, unknown>, packages: Record<string, unknown>[], appointments: Record<string, unknown>[]): string {
  const currentMonth = new Date().getMonth() + 1;
  const isBirthdayMonth = checkBirthday(customer, currentMonth);

  const activePkg = packages.find((p) => String(p.status) === 'ACTIVE' && Number(p.remaining_sessions) > 0);
  const exhaustedPkg = packages.find((p) => String(p.status) === 'EXHAUSTED');
  const lastAppt = appointments[0] as Record<string, unknown> | undefined;
  const lastApptDate = lastAppt ? new Date((lastAppt.created_at || lastAppt.start_time) as string) : null;
  const daysSinceLastAppt = lastApptDate ? Math.floor((Date.now() - lastApptDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const serviceStats = getServiceStats(appointments);

  const lines: string[] = [];
  lines.push(`KHÁCH HÀNG: ${customer.full_name || 'N/A'} (ID: ${customer.id})`);
  if (isBirthdayMonth) lines.push(`THÁNG NÀY LÀ THÁNG SINH NHẬT`);
  if (activePkg) lines.push(`CÓ GÓI ĐANG ACTIVE: còn ${(activePkg as Record<string, unknown>).remaining_sessions} buổi`);
  if (exhaustedPkg) {
    const pkgDate = (exhaustedPkg as Record<string, unknown>).updated_at || (exhaustedPkg as Record<string, unknown>).purchased_at;
    const diffDays = pkgDate ? Math.floor((Date.now() - new Date(pkgDate as string).getTime()) / (1000 * 60 * 60 * 24)) : 999;
    lines.push(`GÓI VỪA HẾT: ${diffDays} ngày trước`);
  }
  lines.push(`TỔNG LỊCH ĐÃ LÀM: ${appointments.length}`);
  if (daysSinceLastAppt !== null) lines.push(`NGÀY GHÉ GẦN NHẤT: ${daysSinceLastAppt} ngày trước`);
  if (serviceStats.massageRatio >= 0.5) lines.push(`VIP MASSAGE: ${Math.round(serviceStats.massageRatio * 100)}% lịch là massage`);
  if (serviceStats.allDealCombo) lines.push(`CHỈ DÙNG COMBO/DEAL`);
  if (serviceStats.nailCount > 3) lines.push(`KHÁCH NAIL THƯỜNG XUYÊN: ${serviceStats.nailCount} lịch nail`);
  if (serviceStats.lastGoiDays && serviceStats.lastGoiDays > 14) lines.push(`LẦN GỘI GẦN NHẤT: ${serviceStats.lastGoiDays} ngày trước`);
  if (serviceStats.hasNail && serviceStats.hasHair) lines.push(`CẢ NAIL VẪN HAIR`);

  return lines.join('\n');
}

function checkBirthday(customer: Record<string, unknown>, currentMonth: number): boolean {
  const dobField = customer.birthday || customer.dob || customer.birth_date;
  if (dobField) {
    const dobDate = new Date(dobField as string);
    if (!isNaN(dobDate.getTime()) && (dobDate.getMonth() + 1) === currentMonth) {
      return true;
    }
  } else if (customer.birth_month === currentMonth) {
    return true;
  }
  return false;
}

function getServiceStats(appointments: Record<string, unknown>[]) {
  let massageCount = 0;
  let totalServicesCount = 0;
  let dealComboServicesCount = 0;
  let nailCount = 0;
  let hasNail = false;
  let hasHair = false;
  let lastGoiDays: number | null = null;

  for (const app of appointments) {
    const services = (app as Record<string, unknown>).appointment_services as Record<string, unknown>[] | undefined;
    if (!services) continue;

    let appHasMassage = false;
    let appHasNail = false;
    let appHasGoi = false;

    for (const as of services) {
      const svc = (as as Record<string, unknown>).services as Record<string, unknown> | undefined;
      if (!svc) continue;

      const name = ((svc.name as string) || '').toLowerCase();
      const cat = ((svc.category as string) || '').toLowerCase();
      totalServicesCount++;

      if (name.includes('massage') || cat.includes('massage')) { appHasMassage = true; }
      if (cat.includes('combo') || name.includes('combo') || cat.includes('deal') || name.includes('deal')) { dealComboServicesCount++; }
      if (cat.includes('móng') || name.includes('móng') || cat.includes('nail') || name.includes('nail') || cat.includes('sơn gel') || name.includes('gel')) { appHasNail = true; hasNail = true; }
      if (cat.includes('gội') || name.includes('gội') || cat.includes('tóc') || name.includes('tóc') || cat.includes('dưỡng sinh') || name.includes('dưỡng sinh')) { appHasGoi = true; hasHair = true; }
    }

    if (appHasMassage) massageCount++;
    if (appHasNail) nailCount++;
    if (appHasGoi && !lastGoiDays) {
      const appDate = new Date((app.created_at || app.start_time) as string);
      lastGoiDays = Math.floor((Date.now() - appDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return {
    massageRatio: appointments.length > 0 ? massageCount / appointments.length : 0,
    allDealCombo: totalServicesCount > 0 && dealComboServicesCount === totalServicesCount,
    nailCount,
    hasNail,
    hasHair,
    lastGoiDays,
  };
}

function getFallbackSuggestion(customer: Record<string, unknown>, packages: Record<string, unknown>[], _appointments: Record<string, unknown>[]): string {
  const currentMonth = new Date().getMonth() + 1;
  if (checkBirthday(customer, currentMonth)) {
    return "Chúc mừng sinh nhật chị, Min có ưu đãi đặc biệt tặng chị ạ!";
  }

  const activePkg = packages.find((p) => String(p.status) === 'ACTIVE' && Number(p.remaining_sessions) > 0);
  if (activePkg) {
    return `Gói liệu trình của chị còn ${Number(activePkg.remaining_sessions)} buổi đang chờ sẵn sàng ạ!`;
  }

  return "Chào mừng chị quay lại, hôm nay chị muốn làm gì ạ?";
}
