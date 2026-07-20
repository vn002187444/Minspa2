'use server'

import { z } from 'zod';
import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import { sendPushNotification } from "@/utils/push";
import { lockTimeSlots, incrementSlotLimit } from "@/lib/booking-engine";
import { getPublicSeoSettings } from "./public";
import { sendEmail } from "@/lib/notify";
import { logger } from "@/lib/logger";

const bookingSchema = z.object({
  customerId: z.string().nullable().optional(),
  name: z.string().min(1, 'Vui lòng nhập họ tên').max(100),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(15),
  email: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ không hợp lệ'),
  staffId: z.string().nullable().optional(),
  serviceIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 dịch vụ'),
  usePackageId: z.string().nullable().optional(),
  buyPackageId: z.string().nullable().optional(),
});

interface ServiceRow {
  id: string;
  price: number | null;
  duration: number | null;
}

export async function submitBooking(inputData: unknown) {
  const supabase = await createClient();
  
  try {
    const parsed = bookingSchema.safeParse(inputData);
    if (!parsed.success) {
      return { success: false, error: `Dữ liệu không hợp lệ: ${parsed.error.issues.map(i => i.message).join(', ')}` };
    }
    const formData = parsed.data;
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
    
    const [seoSettings, dbServicesResult, custPkgResult] = await Promise.all([
      getPublicSeoSettings(),
      formData.serviceIds?.length
        ? supabase.from('services').select('id, price, duration').in('id', formData.serviceIds)
        : Promise.resolve({ data: [] }),
      formData.usePackageId
        ? supabase
            .from('customer_packages')
            .select('id, customer_id, package_id, total_sessions, remaining_sessions, status, treatment_packages!package_id(service_id, name)')
            .eq('id', formData.usePackageId)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    let custPkg = custPkgResult?.data || null;
    const dbServices = dbServicesResult?.data || [];

    let totalAmount = 0;
    let totalDuration = 60;
    if (dbServices.length > 0) {
        let rawTotal = 0;
        dbServices.forEach((s: ServiceRow) => {
          let svcPrice = s.price || 0;
          if (custPkg?.treatment_packages?.length && String(s.id) === String(custPkg.treatment_packages[0].service_id)) {
            svcPrice = 0;
          }
          rawTotal += svcPrice;
        });

        const discountPercent = seoSettings.discountEnabled ? seoSettings.discountPercent / 100 : 0;
        const discountAmount = Math.round(rawTotal * discountPercent);
        totalAmount = rawTotal - discountAmount;
        totalDuration = dbServices.reduce((sum: number, s: ServiceRow) => sum + (s.duration || 30), 0);
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

    if (!staffIdToUse && formData.serviceIds && formData.serviceIds.length > 0) {
      const { autoAssignStaff } = await import('@/lib/scheduling');
      const autoStaffId = await autoAssignStaff(formData.serviceIds, startTimeISO, endDateTime, customerId || null);
      if (autoStaffId) {
        await supabase
          .from('appointments')
          .update({ staff_id: autoStaffId, status: 'CONFIRMED' })
          .eq('id', appt.id)
          .is('staff_id', null);
        await lockTimeSlots(appt.id, autoStaffId, startTimeISO, endDateTime);
      }
    } else if (staffIdToUse) {
      await lockTimeSlots(appt.id, staffIdToUse, startTimeISO, endDateTime);
    }

    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const bookingDate = formData.date;
    if (bookingDate === tomorrowStr && formData.time) {
      incrementSlotLimit(bookingDate, formData.time).catch(e => logger.error('[Database] Failed to increment slot limit', e));
    }

    if (formData.serviceIds && formData.serviceIds.length > 0) {
        const insertData = formData.serviceIds.map((sid: string) => ({
            appointment_id: appt.id,
            service_id: sid
        }));
        await supabase.from('appointment_services').insert(insertData);
    }

    const { data: finalAppt } = await supabase
      .from('appointments')
      .select('staff_id')
      .eq('id', appt.id)
      .single();

    const assignedStaffId = finalAppt?.staff_id || formData.staffId;
    const bgTasks: Promise<void | unknown>[] = [
      sendPushNotification(
        customerId!,
        'Đặt lịch thành công! ✨',
        `Lịch hẹn của bạn lúc ${formData.time} ngày ${format(new Date(formData.date), 'dd/MM/yyyy')} đã được ghi nhận thành công.`,
        '/booking'
      ).catch(e => logger.error('[Push] Failed to send booking confirmation push', e)),
      sendEmail({
        to: formData.email || formData.phone + '@example.com',
        subject: 'Xác nhận đặt lịch hẹn tại Min Nail & Hair',
        html: `<p>Chào <b>${formData.name}</b>,</p><p>Lịch hẹn của bạn lúc <b>${formData.time}</b> ngày <b>${format(new Date(formData.date), 'dd/MM/yyyy')}</b> đã được xác nhận thành công.</p><p>Hẹn gặp bạn tại salon!</p>`
      }).catch(e => logger.error('[Email] Failed to send booking confirmation email', e)),
    ];
    if (assignedStaffId && assignedStaffId !== 'Ngẫu nhiên') {
      bgTasks.push(
        sendPushNotification(
          assignedStaffId!,
          'Lịch hẹn mới! 📅',
          `Khách hàng ${formData.name} đã đặt lịch hẹn trực tuyến với bạn lúc ${formData.time} ngày ${format(new Date(formData.date), 'dd/MM/yyyy')}.`,
          '/staff'
        ).catch(e => logger.error('[Push] Failed to notify assigned staff', e))
      );
    }
    supabase.from('users').select('id').in('role', ['ADMIN', 'MANAGER']).eq('is_active', true).then(({ data: admins }) => {
      if (admins) {
        Promise.all(admins.map(admin =>
          sendPushNotification(
            admin.id,
            'Đơn đặt lịch mới! 🛎️',
            `Khách hàng ${formData.name} vừa đặt lịch hẹn lúc ${formData.time} ngày ${format(new Date(formData.date), 'dd/MM/yyyy')}.`,
            '/admin/orders'
          ).catch(e => logger.error('[Push] Failed to notify admin of new booking', e))
        ));
      }
    });

    Promise.all(bgTasks);

    return { success: true, customerId: customerId };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi không xác định' };
  }
}
