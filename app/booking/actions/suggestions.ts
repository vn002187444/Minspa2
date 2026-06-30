'use server'

import { createClient } from "@/utils/supabase/server";
import { callGemini } from "@/lib/ai/gemini";

const SYSTEM_PROMPT = `Bạn là trợ lý AI tư vấn chăm sóc khách hàng cho tiệm Min Nail & Hair.

QUY TẮC GỢI Ý:
1. KHÁCH MỚI (chưa có lịch sử): Chào mừng + gợi ý combo DEAL CHẤN ĐỘNG (Combo Sơn Gel + Cắt da 99k)
2. THÁNG SINH NHẬT: Chúc mừng + ưu đãi đặc biệt gói Gội Dưỡng Sinh Vip Hoàng Gia
3. CÓ GÓI ĐANG ACTIVE (còn buổi): Nhắc nhở lịch hẹn còn chờ sẵn sàng
4. GÓI VỪA HẾT (< 7 ngày): Đề xuất mua gói mới, ưu đãi Mua 5 Tặng 1
5. KHÁCH VIP MASSAGE (>50% lịch là massage): Ưu đãi giảm 5% Massage Body
6. KHÁCH COMBO/DEAL (>100% dịch vụ là combo/deal): Gợi ý Combo Mắt mèo + Cắt da 139k
7. KHÁCH NAIL THƯỜNG XUYÊN (>3 lịch nail): Gợi ý mẫu sơn thạch mới
8. KHÁCH GỘI > 2 TUẦN KHÔNG GHÉ: Nhắc nhở gói Gội dưỡng sinh CB2 Chuyên sâu
9. KHÁCH QUAY LẠI SAU > 60 NGÀY: Chào mừng + khám phá combo mới
10. KHÁCH CẢ NAIL LẪN HAIR: Hỏi hôm nay muốn làm móng hay gội đầu

PHONG CÁCH: Thân thiện, dùng "chị", "ạ", "nha". Ngắn gọn 1-2 câu. KHÔNG dùng emoji.`;

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
    useCache: true,
    cacheKey: `suggestion_${customer.id}_${new Date().toISOString().split('T')[0]}`,
  });

  if (geminiResult.text) {
    return geminiResult.text;
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
    return "Chúc mừng tháng sinh nhật của chị! Min Nail & Hair gửi tặng chị ưu đãi đặc biệt khi trải nghiệm gói Gội D dưỡng sinh Vip Hoàng Gia ngày hôm nay!";
  }

  const activePkg = packages.find((p) => String(p.status) === 'ACTIVE' && Number(p.remaining_sessions) > 0);
  if (activePkg) {
    return `Chào mừng chị quay lại! Gói liệu trình của chị vẫn còn ${Number(activePkg.remaining_sessions)} buổi đang chờ sẵn sàng phục vụ chị hôm nay ạ!`;
  }

  return "Chào mừng chị quay lại với Min Nail & Hair! Chúc chị có một buổi làm đẹp thư giãn và ưng ý nhất hôm nay ạ!";
}
