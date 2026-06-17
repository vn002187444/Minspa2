'use server'

import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import { sendPushNotification } from "@/utils/push";
import { lockTimeSlots } from "@/lib/booking-engine";
import { getPublicSeoSettings } from "./public";

export async function submitBooking(formData: any) {
  const supabase = await createClient();
  
  try {
    let customerId = formData.customerId;
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    
    if (!customerId) {
        const { data: newCust, error: custErr } = await supabase
            .from('customers')
            .insert({ full_name: formData.name, phone: cleanPhone })
            .select('id')
            .single();
        if (custErr) throw new Error("Không thể tạo thông tin khách hàng");
        customerId = newCust.id;
    } else {
        await supabase.from('customers').update({ full_name: formData.name }).eq('id', customerId);
    }
    
    let custPkg: any = null;
    if (formData.usePackageId) {
      const { data } = await supabase
        .from('customer_packages')
        .select('id, customer_id, package_id, total_sessions, remaining_sessions, status, treatment_packages!package_id(service_id, name)')
        .eq('id', formData.usePackageId)
        .single();
      custPkg = data;
    }

    let totalAmount = 0;
    let totalDuration = 60;
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
            svcPrice = 0;
          }
          rawTotal += svcPrice;
        });

        const discountPercent = seoSettings.discountEnabled ? seoSettings.discountPercent / 100 : 0;
        const discountAmount = Math.round(rawTotal * discountPercent);
        totalAmount = rawTotal - discountAmount;
        totalDuration = dbServices.reduce((sum: number, s: any) => sum + (s.duration || 30), 0);
      }
    }

    const startTimeISO = new Date(`${formData.date}T${formData.time}:00+07:00`).toISOString();
    const endDateTime = new Date(new Date(startTimeISO).getTime() + totalDuration * 60000).toISOString();
    
    const staffIdToUse = formData.staffId || null;
    const statusToUse = staffIdToUse ? 'CONFIRMED' : 'PENDING_RANDOM';

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
    
    if (staffIdToUse) {
      await lockTimeSlots(appt.id, staffIdToUse, startTimeISO, endDateTime);
    }
    
    if (formData.serviceIds && formData.serviceIds.length > 0) {
        const insertData = formData.serviceIds.map((sid: string) => ({
            appointment_id: appt.id,
            service_id: sid
        }));
        await supabase.from('appointment_services').insert(insertData);
    }

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

    Promise.all(bgTasks).catch(() => {});
    
    return { success: true, customerId: customerId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
