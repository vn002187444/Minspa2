'use server'

import { createClient } from "@/utils/supabase/server";

export async function getCustomerCareSuggestion(phone: string): Promise<string> {
  const supabase = await createClient();
  const cleanPhone = phone.replace(/\s+/g, '');

  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('phone', cleanPhone);
  
  const customer = customers && customers.length > 0 ? customers[0] : null;

  if (!customer) {
    return "Chào mừng anh/chị lần đầu đến với Min Nail & Hair! Đừng bỏ lỡ góc DEAL CHẤN ĐỘNG hôm nay: Combo Sơn Gel + Cắt da chỉ 99k nhé!";
  }

  const { data: customerPackages } = await supabase
    .from('customer_packages')
    .select(`
      id,
      remaining_sessions,
      status,
      purchased_at,
      treatment_packages!package_id ( id, name, service_id )
    `)
    .eq('customer_id', customer.id)
    .order('purchased_at', { ascending: false });

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      created_at,
      start_time,
      status,
      appointment_services (
        services ( id, name, category, price )
      )
    `)
    .eq('customer_id', customer.id)
    .eq('status', 'COMPLETED')
    .order('created_at', { ascending: false });

  const currentMonth = new Date().getMonth() + 1;
  let isBirthdayMonth = false;
  const dobField = (customer as any).birthday || (customer as any).dob || (customer as any).birth_date;
  if (dobField) {
    const dobDate = new Date(dobField);
    if (!isNaN(dobDate.getTime()) && (dobDate.getMonth() + 1) === currentMonth) {
      isBirthdayMonth = true;
    }
  } else if ((customer as any).birth_month === currentMonth) {
    isBirthdayMonth = true;
  }

  if (isBirthdayMonth) {
    return "Chúc mừng tháng sinh nhật của chị! Min Nail & Hair gửi tặng chị ưu đãi đặc biệt khi trải nghiệm gói Gội Dưỡng Sinh Vip Hoàng Gia ngày hôm nay!";
  }

  const activePkg = (customerPackages || []).find((p: any) => p.status === 'ACTIVE' && p.remaining_sessions > 0);
  if (activePkg) {
    return `Chào mừng chị quay lại! Gói liệu trình của chị vẫn còn ${activePkg.remaining_sessions} buổi đang chờ sẵn sàng phục vụ chị hôm nay ạ!`;
  }

  const exhaustedPkg = (customerPackages || []).find((p: any) => p.status === 'EXHAUSTED');
  if (exhaustedPkg) {
    const pkgDate = (exhaustedPkg as any).updated_at || exhaustedPkg.purchased_at;
    if (pkgDate) {
      const diffMs = new Date().getTime() - new Date(pkgDate).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) {
        return "Gói liệu trình cũ của chị đã hoàn thành xuất sắc nhiệm vụ rồi ạ. Hôm nay chị có muốn đăng ký mua gói mới để tiếp tục nhận ưu đãi Mua 5 Tặng 1 không?";
      }
    }
  }

  if (appointments && appointments.length > 0) {
    let massageCount = 0;
    appointments.forEach((app: any) => {
      const hasMassage = app.appointment_services?.some((as: any) => {
        const sName = as.services?.name?.toLowerCase() || '';
        const sCat = as.services?.category?.toLowerCase() || '';
        return sName.includes('massage') || sCat.includes('massage');
      });
      if (hasMassage) massageCount++;
    });
    if (massageCount / appointments.length >= 0.5) {
      return "Chào mừng khách VIP! Lịch hẹn Massage Body đặt trước hôm nay của chị sẽ được ưu đãi giảm ngay 5% trực tiếp vào hóa đơn ạ!";
    }
  }

  if (appointments && appointments.length > 0) {
    let totalServicesCount = 0;
    let dealComboServicesCount = 0;
    appointments.forEach((app: any) => {
      app.appointment_services?.forEach((as: any) => {
        totalServicesCount++;
        const sName = as.services?.name?.toLowerCase() || '';
        const sCat = as.services?.category?.toLowerCase() || '';
        if (sName.includes('combo') || sName.includes('deal') || sCat.includes('deal') || sCat.includes('combo')) {
          dealComboServicesCount++;
        }
      });
    });
    if (totalServicesCount > 0 && dealComboServicesCount === totalServicesCount) {
      return "Min Nail & Hair chào chị! Hôm nay Góc Deal Chấn Động vừa cập nhật Combo Mắt mèo + Cắt da chỉ 139k siêu hot, chị thử ngay nha!";
    }
  }

  if (appointments && appointments.length > 0) {
    let nailAppCount = 0;
    appointments.forEach((app: any) => {
      const hasNail = app.appointment_services?.some((as: any) => {
        const sName = as.services?.name?.toLowerCase() || '';
        const sCat = as.services?.category?.toLowerCase() || '';
        return sCat.includes('móng') || sName.includes('móng') || sCat.includes('nail') || sName.includes('nail') || sCat.includes('sơn gel') || sName.includes('gel');
      });
      if (hasNail) nailAppCount++;
    });
    if (nailAppCount > 3) {
      return "Chào mừng chị quay lại! Tiệm vừa cập nhật thêm nhiều mẫu sơn thạch hiệu ứng mướt mịn cực xinh, hôm nay chị trải nghiệm thử nhé!";
    }
  }

  if (appointments && appointments.length > 0) {
    let lastGoiDate: Date | null = null;
    for (const app of appointments) {
      const hasGoi = app.appointment_services?.some((as: any) => {
        const sName = as.services?.name?.toLowerCase() || '';
        const sCat = as.services?.category?.toLowerCase() || '';
        return sCat.includes('gội') || sName.includes('gội') || sCat.includes('dưỡng sinh') || sName.includes('dưỡng sinh');
      });
      if (hasGoi) {
        lastGoiDate = new Date(app.created_at || app.start_time);
        break;
      }
    }
    if (lastGoiDate) {
      const diffMs = new Date().getTime() - lastGoiDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 14) {
        return "Đã hơn 2 tuần chưa thấy chị ghé tiệm thư giãn rồi ạ. Hôm nay hãy tự thưởng cho mình một gói Gội dưỡng sinh CB2 Chuyên sâu để xua tan mỏi mệt cổ vai gáy chị nhé!";
      }
    }
  }

  if (appointments && appointments.length > 0) {
    const lastApptDate = new Date(appointments[0].created_at || appointments[0].start_time);
    const diffMs = new Date().getTime() - lastApptDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 60) {
      return "Chào mừng chị đã quay trở lại với Min Nail & Hair! Tiệm nhớ chị rất nhiều, hôm nay có rất nhiều combo mới đang chờ chị khám phá đấy ạ!";
    }
  }

  if (appointments && appointments.length > 0) {
    let hasNail = false;
    let hasHair = false;
    appointments.forEach((app: any) => {
      app.appointment_services?.forEach((as: any) => {
        const sName = as.services?.name?.toLowerCase() || '';
        const sCat = as.services?.category?.toLowerCase() || '';
        if (sCat.includes('móng') || sName.includes('móng') || sCat.includes('nail') || sName.includes('nail') || sCat.includes('sơn gel') || sName.includes('gel')) {
          hasNail = true;
        }
        if (sCat.includes('gội') || sName.includes('gội') || sCat.includes('tóc') || sName.includes('tóc') || sCat.includes('dưỡng sinh') || sName.includes('dưỡng sinh')) {
          hasHair = true;
        }
      });
    });
    if (hasNail && hasHair) {
      return "Chào chị, hôm nay chị muốn làm sạch móng xinh hay muốn khai huyệt gội đầu thảo dược thư giãn trước ạ?";
    }
  }

  return "Chào mừng chị quay lại với Min Nail & Hair! Chúc chị có một buổi làm đẹp thư giãn và ưng ý nhất hôm nay ạ!";
}
