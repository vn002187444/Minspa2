'use server'

import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import { sendPushNotification } from "@/utils/push";
import { getSlotAvailabilityWithNames, lockTimeSlots, unlockTimeSlots } from "@/lib/booking-engine";

export async function getPublicServices() {
  const supabase = await createClient();
  const { data } = await supabase.from('services').select('id, name, category, price, duration, description, image_url, is_active').eq('is_active', true);
  return data || [];
}

export async function getPublicSeoSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from('seo_settings').select('online_discount_enabled, online_discount_percent, default_commission_percent, hotline').eq('id', 1).single();
  if (data) return {
    discountEnabled: data.online_discount_enabled !== false,
    discountPercent: Number(data.online_discount_percent) || 5,
    defaultCommissionPercent: Number(data.default_commission_percent) || 15,
    hotline: data.hotline || '0934 323 878',
  };
  return { discountEnabled: true, discountPercent: 5, defaultCommissionPercent: 15, hotline: '0934 323 878' };
}

export async function getPublicPackages() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('treatment_packages')
    .select('id, name, buy_count, free_count, price, total_sessions, service_id, services(name, price)')
    .eq('is_active', true);
  return data || [];
}

export async function checkCustomerHistory(phone: string) {
  const supabase = await createClient();
  
  // Clean phone number: remove spaces
  const cleanPhone = phone.replace(/\s+/g, '');
  
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('phone', cleanPhone)
    .single();
  
  if (!customer) return { found: false, name: '' };

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      created_at,
      users ( full_name ),
      appointment_services (
        services ( name )
      )
    `)
    .eq('customer_id', customer.id)
    .in('status', ['COMPLETED']) // only care about completed history
    .order('created_at', { ascending: false })
    .limit(3);

  const history = (appointments || []).map((app: any) => ({
    date: new Date(app.created_at).toLocaleDateString('vi-VN'),
    staff: app.users?.full_name || null,
    services: app.appointment_services.map((as: any) => as.services?.name).filter(Boolean)
  }));

  const { data: allActivePkgs } = await supabase
    .from('customer_packages')
    .select('id, customer_id, package_id, total_sessions, remaining_sessions, status')
    .eq('customer_id', customer.id)
    .eq('status', 'ACTIVE');

  const activePackages = (allActivePkgs || []).filter((p: any) => p.remaining_sessions > 0);

  return { found: true, name: customer.full_name, id: customer.id, history, activePackages };
}

function getEffectiveTimeRange(appt: any): { start: Date; end: Date } {
  const expectedStart = new Date(appt.start_time);
  const expectedEnd = new Date(appt.end_time);
  const actualStart = appt.actual_start_time ? new Date(appt.actual_start_time) : null;
  const actualEnd = appt.actual_end_time ? new Date(appt.actual_end_time) : null;

  if (actualEnd) {
    return { start: actualStart || expectedStart, end: actualEnd };
  }
  if (actualStart) {
    const duration = expectedEnd.getTime() - expectedStart.getTime();
    return { start: actualStart, end: new Date(actualStart.getTime() + duration) };
  }
  return { start: expectedStart, end: expectedEnd };
}

function doRangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableStaff(date: string, time: string, durationMinutes: number = 60) {
  const supabase = await createClient();

  // 1. Get all active staff & managers
  const { data: allStaff } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['STAFF', 'MANAGER'])
    .eq('is_active', true);

  if (!allStaff || allStaff.length === 0) {
    return [];
  }

  // 2. Get staff PRESENT today (attendance check)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('staff_id')
    .eq('date', date)
    .eq('status', 'PRESENT');
  const presentStaffIds = new Set((attendance || []).map((a: any) => a.staff_id));

  // 3. Compute slot start and end based on real total duration
  const slotStart = new Date(`${date}T${time}:00+07:00`);
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

  // 4. Get all active appointments for the day (fetch actual_start/end for effective range)
  const dayStart = new Date(`${date}T00:00:00+07:00`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59.999+07:00`).toISOString();
  const { data: busyAppointments } = await supabase
    .from('appointments')
    .select('staff_id, start_time, end_time, actual_start_time, actual_end_time')
    .in('status', ['CONFIRMED', 'IN_PROGRESS', 'PENDING_RANDOM'])
    .not('staff_id', 'is', null)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd);

  // 5. Compute which staff are busy using effective time ranges (accounts for cascade shifts)
  const busyStaffIds = new Set<string>();
  for (const appt of (busyAppointments || [])) {
    const { start, end } = getEffectiveTimeRange(appt);
    if (doRangesOverlap(slotStart, slotEnd, start, end)) {
      busyStaffIds.add(appt.staff_id);
    }
  }

  // 6. Return staff who are PRESENT today AND have no overlapping appointments
  const freeStaff = allStaff.filter((staff: any) =>
    presentStaffIds.has(staff.id) && !busyStaffIds.has(staff.id)
  );
  return freeStaff;
}

export type SlotStatus = 'past' | 'no_staff_present' | 'fully_booked' | 'some_available' | 'all_available';

export interface SlotInfo {
  time: string;
  status: SlotStatus;
  availableStaff: number;
  totalStaff: number;
  availableStaffNames: string[];
  isRecommended: boolean;
}

export async function getSlotAvailability(
  date: string,
  selectedServiceIds: string[] = [],
  services: { id: string; duration: number }[] = []
): Promise<SlotInfo[]> {
  return getSlotAvailabilityWithNames(date, selectedServiceIds, services);
}

export async function submitBooking(formData: any) {
  const supabase = await createClient();
  
  try {
    let customerId = formData.customerId;
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    
    // Create new customer if not found
    if (!customerId) {
        const { data: newCust, error: custErr } = await supabase
            .from('customers')
            .insert({ full_name: formData.name, phone: cleanPhone })
            .select('id')
            .single();
        if (custErr) throw new Error("Không thể tạo thông tin khách hàng");
        customerId = newCust.id;
    } else {
        // Update name just in case
        await supabase.from('customers').update({ full_name: formData.name }).eq('id', customerId);
    }
    
    // Fetch customer package if usePackageId is specified
    let custPkg: any = null;
    if (formData.usePackageId) {
      const { data } = await supabase
        .from('customer_packages')
        .select('id, customer_id, package_id, total_sessions, remaining_sessions, status, treatment_packages!package_id(service_id, name)')
        .eq('id', formData.usePackageId)
        .single();
      custPkg = data;
    }

    // Fetch service prices and durations to calculate total_amount and end_time
    let totalAmount = 0;
    let totalDuration = 60; // default to 60m
    const seoSettings = await getPublicSeoSettings();
    if (formData.serviceIds && formData.serviceIds.length > 0) {
      const { data: dbServices } = await supabase
        .from('services')
        .select('id, price, duration')
        .in('id', formData.serviceIds);

      if (dbServices && dbServices.length > 0) {
        let rawTotal = 0;
        dbServices.forEach((s: any) => {
          let svcPrice = s.price || 0;
          if (custPkg?.treatment_packages?.length && String(s.id) === String(custPkg.treatment_packages[0].service_id)) {
            svcPrice = 0; // 0đ for package treatment session service!
          }
          rawTotal += svcPrice;
        });

        // apply online booking discount
        const discountPercent = seoSettings.discountEnabled ? seoSettings.discountPercent / 100 : 0;
        const discountAmount = Math.round(rawTotal * discountPercent);
        totalAmount = rawTotal - discountAmount;
        totalDuration = dbServices.reduce((sum: number, s: any) => sum + (s.duration || 30), 0);
      }
    }

    const startTimeISO = new Date(`${formData.date}T${formData.time}:00+07:00`).toISOString();
    const endDateTime = new Date(new Date(startTimeISO).getTime() + totalDuration * 60000).toISOString();
    
    // Determine staff assignment and booking status:
    // If a specific staff is requested, assign them as CONFIRMED.
    // If no specific staff is requested (or "Ngẫu nhiên" is selected), set staff to null and status to PENDING_RANDOM so staff can claim it.
    const staffIdToUse = formData.staffId || null;
    const statusToUse = staffIdToUse ? 'CONFIRMED' : 'PENDING_RANDOM';

    // Insert appointment
    const { data: appt, error: apptErr } = await supabase
        .from('appointments')
        .insert({
            customer_id: customerId,
            staff_id: staffIdToUse,
            start_time: startTimeISO,
            end_time: endDateTime,
            status: statusToUse,
            total_amount: totalAmount,
            commission_amount: Math.round(totalAmount * (seoSettings.defaultCommissionPercent) / 100),
            tip_amount: 0,
            is_package_session: !!formData.usePackageId,
            use_package_id: formData.usePackageId || null,
            buy_package_id: formData.buyPackageId || null,
        })
        .select('id')
        .single();
        
    if (apptErr) throw new Error("Không thể tạo lịch hẹn: " + apptErr.message);
    
    // Lock time slots immediately if staff is assigned
    if (staffIdToUse) {
      await lockTimeSlots(appt.id, staffIdToUse, startTimeISO, endDateTime);
    }
    
    // Insert services
    if (formData.serviceIds && formData.serviceIds.length > 0) {
        const insertData = formData.serviceIds.map((sid: string) => ({
            appointment_id: appt.id,
            service_id: sid
        }));
        await supabase.from('appointment_services').insert(insertData);
    }

    // Fire-and-forget: push notifications (non-blocking background tasks)
    const staffId = formData.staffId;
    const bgTasks: Promise<any>[] = [
      sendPushNotification(
        customerId,
        'Đặt lịch thành công! ✨',
        `Lịch hẹn của bạn lúc ${formData.time} ngày ${format(new Date(formData.date), 'dd/MM/yyyy')} đã được ghi nhận thành công.`,
        '/booking'
      ).catch(() => {}),
    ];
    if (staffId && staffId !== 'Ngẫu nhiên') {
      bgTasks.push(
        sendPushNotification(
          staffId,
          'Lịch hẹn mới! 📅',
          `Khách hàng ${formData.name} đã đặt lịch hẹn trực tuyến với bạn lúc ${formData.time} ngày ${format(new Date(formData.date), 'dd/MM/yyyy')}.`,
          '/staff'
        ).catch(() => {})
      );
    }
    // Notify all active admins/managers in parallel (fire-and-forget)
    void supabase.from('users').select('id').in('role', ['ADMIN', 'MANAGER']).eq('is_active', true).then(({ data: admins }) => {
      if (admins) {
        Promise.all(admins.map(admin =>
          sendPushNotification(
            admin.id,
            'Đơn đặt lịch mới! 🛎️',
            `Khách hàng ${formData.name} vừa đặt lịch hẹn lúc ${formData.time} ngày ${format(new Date(formData.date), 'dd/MM/yyyy')}.`,
            '/admin/orders'
          ).catch(() => {})
        )).catch(() => {});
      }
    });

    // Not awaited — runs in background
    Promise.all(bgTasks).catch(() => {});
    
    return { success: true, customerId: customerId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function lookupAppointmentsByPhone(phone: string) {
  const supabase = await createClient();
  const cleanPhone = phone.replace(/\s+/g, '');

  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('phone', cleanPhone)
    .single();

  if (!customer) {
    return { success: false, error: 'Số điện thoại này chưa được đăng ký lịch hẹn nào tại Min Salon' };
  }

  const { data: appointments, error: apptErr } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      total_amount,
      users ( full_name ),
      appointment_services (
        services ( name, price )
      ),
      reviews (
        id,
        rating,
        quick_tags
      )
    `)
    .eq('customer_id', customer.id)
    .order('start_time', { ascending: false });

  if (apptErr) {
    return { success: false, error: 'Không thể truy xuất danh sách lịch hẹn: ' + apptErr.message };
  }

  // Format appointments details
  const formattedAppointments = (appointments || []).map((app: any) => ({
    id: app.id,
    startTime: app.start_time,
    endTime: app.end_time,
    status: app.status,
    totalAmount: app.total_amount,
    staffName: app.users?.full_name || 'KTV ngẫu nhiên',
    services: (app.appointment_services || []).map((as: any) => ({
      name: as.services?.name || 'Dịch vụ',
      price: as.services?.price || 0,
    })),
    review: app.reviews?.[0] || null, // Capture review if exists
  }));

  return {
    success: true,
    customerName: customer.full_name,
    appointments: formattedAppointments
  };
}

export async function submitAppointmentReview(appointmentId: string, rating: number, quickTags: string[], comment: string = "") {
  const supabase = await createClient();

  // Validate rating
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Mức điểm đánh giá không hợp lệ.' };
  }

  // Check if already reviewed
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('appointment_id', appointmentId);

  if (existingReviews && existingReviews.length > 0) {
    return { success: false, error: 'Lịch hẹn này đã được đánh giá trước đó.' };
  }

  // Save the review
  const { error } = await supabase
    .from('reviews')
    .insert({
      appointment_id: appointmentId,
      rating,
      quick_tags: quickTags, // stored as JSONB
      comment: comment || null,
    });

  if (error) {
    return { success: false, error: 'Gửi đánh giá thất bại: ' + error.message };
  }

  return { success: true };
}

export async function cancelAppointmentByCustomer(appointmentId: string) {
  const supabase = await createClient();

  // Retrieve existing appointment to verify current status
  const { data: appt, error: findErr } = await supabase
    .from('appointments')
    .select('status')
    .eq('id', appointmentId)
    .single();

  if (findErr || !appt) {
    return { success: false, error: 'Không thể tìm thấy thông tin lịch hẹn này.' };
  }

  // Can only cancel PENDING_RANDOM or CONFIRMED appointments
  if (appt.status !== 'PENDING_RANDOM' && appt.status !== 'CONFIRMED') {
    return { success: false, error: 'Chỉ có thể tự hủy lịch hẹn ở trạng thái Chưa phục vụ.' };
  }

  // Update status to CANCELLED
  const { error: updateErr } = await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', appointmentId);

  if (updateErr) {
    return { success: false, error: 'Có lỗi xảy ra: ' + updateErr.message };
  }

  // Unlock time slots immediately
  await unlockTimeSlots(appointmentId);

  // Fire-and-forget: notify active admins/managers
  void supabase.from('users').select('id').in('role', ['ADMIN', 'MANAGER']).eq('is_active', true).then(({ data: admins }) => {
    if (admins) {
      Promise.all(admins.map(admin =>
        sendPushNotification(
          admin.id,
          'Lịch hẹn bị hủy! ❌',
          `Một lịch hẹn vừa bị khách hàng hủy trên hệ thống.`,
          '/admin/orders'
        ).catch(() => {})
      )).catch(() => {});
    }
  });

  return { success: true };
}

export async function getCustomerCareSuggestion(phone: string): Promise<string> {
  const supabase = await createClient();
  const cleanPhone = phone.replace(/\s+/g, '');

  // Query customer details
  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('phone', cleanPhone);
  
  const customer = customers && customers.length > 0 ? customers[0] : null;

  // Scenario 1: Khách mới tinh - Không tìm thấy SĐT trong bảng customers
  if (!customer) {
    return "Chào mừng anh/chị lần đầu đến với Min Nail & Hair! Đừng bỏ lỡ góc DEAL CHẤN ĐỘNG hôm nay: Combo Sơn Gel + Cắt da chỉ 99k nhé!";
  }

  // Fetch customer packages
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

  // Fetch completed appointments
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

  // Scenario 8: Khách đi làm đẹp đúng Tháng Sinh Nhật
  const currentMonth = new Date().getMonth() + 1; // 1 to 12
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

  // Scenario 4: Khách đang còn gói liệu trình khả dụng
  const activePkg = (customerPackages || []).find((p: any) => p.status === 'ACTIVE' && p.remaining_sessions > 0);
  if (activePkg) {
    return `Chào mừng chị quay lại! Gói liệu trình của chị vẫn còn ${activePkg.remaining_sessions} buổi đang chờ sẵn sàng phục vụ chị hôm nay ạ!`;
  }

  // Scenario 5: Khách vừa dùng hết gói liệu trình (EXHAUSTED trong vòng 7 ngày)
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

  // Scenario 7: Khách VIP thường xuyên Massage Body (đơn hàng massage chiếm >= 50% tổng đơn)
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

  // Scenario 6: Khách thích săn Deal (Lịch sử chỉ toàn đặt combo/deal services)
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

  // Scenario 2: Khách hàng quen làm móng (Lịch sử có > 3 đơn hàng dịch vụ Nail)
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

  // Scenario 3: Lần gội dưỡng sinh cuối cùng cách đây > 14 ngày
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

  // Scenario 9: Khách quay lại sau hơn 2 tháng (khoảng cách đơn hàng gần nhất > 60 ngày)
  if (appointments && appointments.length > 0) {
    const lastApptDate = new Date(appointments[0].created_at || appointments[0].start_time);
    const diffMs = new Date().getTime() - lastApptDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 60) {
      return "Chào mừng chị đã quay trở lại với Min Nail & Hair! Tiệm nhớ chị rất nhiều, hôm nay có rất nhiều combo mới đang chờ chị khám phá đấy ạ!";
    }
  }

  // Scenario 10: Khách trải nghiệm cả Tóc và Móng
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

  // Fallback default message
  return "Chào mừng chị quay lại với Min Nail & Hair! Chúc chị có một buổi làm đẹp thư giãn và ưng ý nhất hôm nay ạ!";
}

export async function getCustomerNotifications(customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, content, link, is_read, created_at')
    .eq('recipient_type', 'customer')
    .eq('recipient_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[NOTIFICATIONS] Failed to fetch customer notifications:', error);
    return [];
  }

  return data || [];
}

export async function markCustomerNotificationRead(notificationId: string, customerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('recipient_type', 'customer')
    .eq('recipient_id', customerId);

  if (error) {
    console.error('[NOTIFICATIONS] Failed to mark customer notification as read:', error);
  }
}

export async function markAllCustomerNotificationsRead(customerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_type', 'customer')
    .eq('recipient_id', customerId)
    .eq('is_read', false);

  if (error) {
    console.error('[NOTIFICATIONS] Failed to mark all customer notifications as read:', error);
  }
}
