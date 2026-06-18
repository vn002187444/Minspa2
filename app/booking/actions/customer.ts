'use server'

import { createClient } from "@/utils/supabase/server";
import { sendPushNotification } from "@/utils/push";
import { unlockTimeSlots } from "@/lib/booking-engine";

export async function checkCustomerHistory(phone: string) {
  const supabase = await createClient();
  
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
    .in('status', ['COMPLETED'])
    .order('created_at', { ascending: false })
    .limit(3);

  const history = (appointments || []).map((app: any) => ({
    date: new Date(app.created_at).toLocaleDateString('vi-VN'),
    staff: app.users?.full_name || null,
    services: app.appointment_services.map((as: any) => as.services?.name).filter(Boolean)
  }));

  const now = new Date().toISOString();
  const { data: allActivePkgs } = await supabase
    .from('customer_packages')
    .select(`
      id, customer_id, package_id, total_sessions, remaining_sessions, status,
      purchased_at, expires_at, sold_by_staff_id, commission_amount,
      treatment_packages!package_id(id, name, service_id, services(name, price))
    `)
    .eq('customer_id', customer.id)
    .eq('status', 'ACTIVE')
    .gt('expires_at', now)
    .gt('remaining_sessions', 0)
    .limit(50);

  const activePackages = (allActivePkgs || []);

  // Group packages by treatment_package_id (same package type)
  const groupedPackages = activePackages.reduce((acc: Record<string, any[]>, pkg: any) => {
    const key = pkg.treatment_packages?.id || pkg.package_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pkg);
    return acc;
  }, {});

  return { found: true, name: customer.full_name, id: customer.id, history, activePackages, groupedPackages };
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
    .order('start_time', { ascending: false })
    .limit(20);

  if (apptErr) {
    return { success: false, error: 'Không thể truy xuất danh sách lịch hẹn: ' + apptErr.message };
  }

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
    review: app.reviews?.[0] || null,
  }));

  return {
    success: true,
    customerName: customer.full_name,
    appointments: formattedAppointments
  };
}

export async function submitAppointmentReview(appointmentId: string, rating: number, quickTags: string[], comment: string = "") {
  const supabase = await createClient();

  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Mức điểm đánh giá không hợp lệ.' };
  }

  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('appointment_id', appointmentId);

  if (existingReviews && existingReviews.length > 0) {
    return { success: false, error: 'Lịch hẹn này đã được đánh giá trước đó.' };
  }

  const { error } = await supabase
    .from('reviews')
    .insert({
      appointment_id: appointmentId,
      rating,
      quick_tags: quickTags,
      comment: comment || null,
    });

  if (error) {
    return { success: false, error: 'Gửi đánh giá thất bại: ' + error.message };
  }

  return { success: true };
}

export async function cancelAppointmentByCustomer(appointmentId: string) {
  const supabase = await createClient();

  const { data: appt, error: findErr } = await supabase
    .from('appointments')
    .select('status, is_package_session, use_package_id')
    .eq('id', appointmentId)
    .single();

  if (findErr || !appt) {
    return { success: false, error: 'Không thể tìm thấy thông tin lịch hẹn này.' };
  }

  if (appt.status !== 'PENDING_RANDOM' && appt.status !== 'CONFIRMED') {
    return { success: false, error: 'Chỉ có thể tự hủy lịch hẹn ở trạng thái Chưa phục vụ.' };
  }

  // Refund package session if this appointment used a package
  if (appt.is_package_session && appt.use_package_id) {
    await supabase.rpc('refund_package_session', {
      p_pkg_id: appt.use_package_id,
      p_appt_id: appointmentId,
      p_used_at: new Date().toISOString(),
    });
  }

  const { error: updateErr } = await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', appointmentId);

  if (updateErr) {
    return { success: false, error: 'Có lỗi xảy ra: ' + updateErr.message };
  }

  await unlockTimeSlots(appointmentId);

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
