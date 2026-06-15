'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { sendPushNotification } from "@/utils/push";
import { runRemindersCheck } from "@/utils/reminders";

export async function getStaffData() {
  const session = await getSession();
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const staffId = session.user.id;
  const supabase = await createClient();

  const today = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(today);

  const startOfTodayISO = new Date(`${todayStr}T00:00:00+07:00`).toISOString();
  const endOfTodayISO = new Date(`${todayStr}T23:59:59.999+07:00`).toISOString();

  // Get profile details — use maybeSingle to avoid throw if user not found
  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role, username')
    .eq('id', staffId)
    .maybeSingle();

  // Check attendance — use maybeSingle to avoid throw if no record
  const { data: attendance } = await supabase
    .from('attendance')
    .select('id, staff_id, date, status, check_in_time')
    .eq('staff_id', staffId)
    .eq('date', todayStr)
    .maybeSingle();

  // Assigned appointments (today)
  const { data: myAppointments } = await supabase
    .from('appointments')
    .select(`
      id, start_time, end_time, status, total_amount, staff_id, is_package_session, use_package_id, buy_package_id,
      customers (id, full_name, phone),
      appointment_services (
        services (id, name, price)
      )
    `)
    .eq('staff_id', staffId)
    .gte('start_time', startOfTodayISO)
    .lte('start_time', endOfTodayISO)
    .order('start_time', { ascending: true });

  // Random appointments (all unclaimed pending random or confirmed bookings so staff can claim them immediately)
  const { data: randomAppointments } = await supabase
    .from('appointments')
    .select(`
      id, start_time, end_time, status, total_amount, staff_id, is_package_session, use_package_id, buy_package_id,
      customers (id, full_name, phone),
      appointment_services (
        services (id, name, price)
      )
    `)
    .is('staff_id', null)
    .in('status', ['PENDING_RANDOM', 'CONFIRMED'])
    .order('start_time', { ascending: true });

  // Other staff & managers for swap
  const { data: otherStaff } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['STAFF', 'MANAGER'])
    .neq('id', staffId)
    .eq('is_active', true);

  // All active services for upsell
  const { data: allServices } = await supabase
    .from('services')
    .select('id, name, category, price, duration, description, is_active')
    .eq('is_active', true);

  // Active treatment packages
  const { data: treatmentPackages } = await supabase
    .from('treatment_packages')
    .select('*, services(name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return {
    staffId,
    profile: profile || { id: staffId, full_name: session.user.name || "Kỹ thuật viên", role: session.user.role },
    attendance,
    myAppointments: myAppointments || [],
    randomAppointments: randomAppointments || [],
    otherStaff: otherStaff || [],
    allServices: allServices || [],
    treatmentPackages: treatmentPackages || []
  };
}

export async function checkIn() {
  const session = await getSession();
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'MANAGER')) throw new Error('Unauthorized');
  
  const supabase = await createClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { error } = await supabase
    .from('attendance')
    .insert({
      staff_id: session.user.id,
      date: today,
      status: 'PRESENT',
      check_in_time: new Date().toISOString()
    });
  
  if (error) return { success: false, error: error.message };

  // Trigger push notification to checked-in staff device
  await sendPushNotification(
    session.user.id,
    'Điểm danh thành công! ⏰',
    `Bạn đã điểm danh có mặt lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${format(new Date(), 'dd/MM/yyyy')}. Chúc một ngày làm việc tuyệt vời!`,
    '/staff'
  ).catch(err => console.error("Attendance notification error:", err));

  return { success: true };
}

export async function getCustomerActivePackages(customerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('customer_packages')
    .select('id, remaining_sessions, treatment_packages!package_id(name, service_id)')
    .eq('customer_id', customerId)
    .eq('status', 'ACTIVE');
  return data || [];
}

export async function getCustomerHistory(customerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select(`
      created_at,
      users (full_name),
      appointment_services (
        services (name)
      )
    `)
    .eq('customer_id', customerId)
    .eq('status', 'COMPLETED')
    .order('created_at', { ascending: false })
    .limit(5);
    
  return data || [];
}

export async function takeRandomAppointment(appointmentId: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'MANAGER')) throw new Error('Unauthorized');
  
  const supabase = await createClient();
  const { error, data } = await supabase
    .from('appointments')
    .update({ staff_id: session.user.id, status: 'CONFIRMED' })
    .eq('id', appointmentId)
    .is('staff_id', null)
    .in('status', ['PENDING_RANDOM'])
    .select('id');
    
  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0) return { success: false, error: 'Đơn đã có thợ nhận trước đó, vui lòng chọn đơn khác.' };
  return { success: true };
}

export async function swapAppointment(appointmentId: string, newStaffId: string) {
  const supabase = await createClient();
  const isUnassigned = newStaffId === '_unassigned' || !newStaffId;
  const { error } = await supabase
    .from('appointments')
    .update({ 
      staff_id: isUnassigned ? null : newStaffId,
      ...(isUnassigned ? { status: 'PENDING_RANDOM' } : {})
    })
    .eq('id', appointmentId);
    
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateAppointmentByStaffOrAdmin(appointmentId: string, payload: {
  fullName?: string;
  phone?: string;
  staffId?: string | null;
  startTime?: string;
  endTime?: string;
  status?: string;
  serviceIds?: string[];
}) {
  const session = await getSession();
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return { success: false, error: 'Bạn không có quyền thực hiện việc này.' };
  }

  const supabase = await createClient();

  try {
    const { data: appt, error: apptErr } = await supabase
      .from('appointments')
      .select('customer_id')
      .eq('id', appointmentId)
      .single();

    if (apptErr || !appt) {
      return { success: false, error: 'Không tìm thấy lịch hẹn' };
    }

    if (payload.fullName || payload.phone) {
      const cleanPhone = payload.phone ? payload.phone.replace(/\s+/g, '') : '';
      await supabase
        .from('customers')
        .update({
          ...(payload.fullName ? { full_name: payload.fullName } : {}),
          ...(cleanPhone ? { phone: cleanPhone } : {})
        })
        .eq('id', appt.customer_id);
    }

    const updateObj: any = {};
    if (payload.staffId !== undefined) {
      const isUn = payload.staffId === '_unassigned' || !payload.staffId;
      updateObj.staff_id = isUn ? null : payload.staffId;
      if (!isUn && payload.status === undefined) {
        updateObj.status = 'CONFIRMED';
      } else if (isUn && payload.status === undefined) {
        updateObj.status = 'PENDING_RANDOM';
      }
    }
    if (payload.startTime !== undefined) {
      updateObj.start_time = payload.startTime;
      updateObj.end_time = new Date(new Date(payload.startTime).getTime() + 60 * 60000).toISOString();
    }
    if (payload.endTime !== undefined) {
      updateObj.end_time = payload.endTime;
    }
    if (payload.status !== undefined) {
      updateObj.status = payload.status;
    }

    if (Object.keys(updateObj).length > 0) {
      const { error: updateErr } = await supabase
        .from('appointments')
        .update(updateObj)
        .eq('id', appointmentId);
      if (updateErr) throw updateErr;

      if (payload.status !== undefined && (session.user.role === 'ADMIN' || session.user.role === 'MANAGER')) {
         import('@/utils/audit').then(({ logAuditAction }) => {
            logAuditAction(session.user.id, "STATUS_CHANGE", `Admin cập nhật đơn '${appointmentId}' sang ${payload.status}`);
         });
      }
    }

    if (payload.serviceIds !== undefined) {
      await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', appointmentId);

      if (payload.serviceIds.length > 0) {
        const insertData = payload.serviceIds.map((sid: string) => ({
          appointment_id: appointmentId,
          service_id: sid
        }));
        await supabase.from('appointment_services').insert(insertData);
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const session = await getSession();
  const supabase = await createClient();
  const { data: oldAppt } = await supabase.from('appointments').select('status').eq('id', appointmentId).single();

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);
    
  if (error) return { success: false, error: error.message };

  if (session && oldAppt && oldAppt.status !== status) {
    if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
      import('@/utils/audit').then(({ logAuditAction }) => {
        logAuditAction(session.user.id, "STATUS_CHANGE", `Đổi trạng thái đơn '${appointmentId}': ${oldAppt.status} ➔ ${status}`);
      });
    }
  }

  return { success: true };
}

export async function completeAppointment(appointmentId: string, extraServiceIds: string[] = [], tipAmount: number = 0, discountPercent: number = 0) {
  const supabase = await createClient();
  
  // 1. Add extra services if any
  if (extraServiceIds.length > 0) {
    const records = extraServiceIds.map(id => ({
      appointment_id: appointmentId,
      service_id: id
    }));
    await supabase.from('appointment_services').insert(records);
  }

  // 1b. Fetch appointment details to check package session status
  const { data: dbAppt } = await supabase
    .from('appointments')
    .select('is_package_session, use_package_id, customer_id, staff_id')
    .eq('id', appointmentId)
    .single();

  let coveredServiceId: string | null = null;
  let usePackageId: string | null = null;

  if (dbAppt?.is_package_session && dbAppt?.use_package_id) {
    usePackageId = dbAppt.use_package_id;
    // Fetch the package details to find the covered service
    const { data: customerPkg } = await supabase
      .from('customer_packages')
      .select('id, remaining_sessions, treatment_packages!package_id(service_id, name)')
      .eq('id', usePackageId)
      .single();

    if (customerPkg?.treatment_packages?.length) {
  coveredServiceId = customerPkg.treatment_packages[0].service_id;
}

    // Process session deduction if remaining sessions > 0
    if (customerPkg && customerPkg.remaining_sessions > 0) {
      const nextRemaining = customerPkg.remaining_sessions - 1;
      const nextStatus = nextRemaining <= 0 ? 'EXHAUSTED' : 'ACTIVE';

      // Update remaining sessions and status
      await supabase
        .from('customer_packages')
        .update({
          remaining_sessions: nextRemaining,
          status: nextStatus
        })
        .eq('id', usePackageId);

      // Log the usage
      await supabase
        .from('package_usage_logs')
        .insert({
          customer_package_id: usePackageId,
          appointment_id: appointmentId,
          used_at: new Date().toISOString(),
          notes: `Khấu trừ tự động 1 buổi khi hoàn thành lịch hẹn`
        });
    }
  }

  // 2. Calculate new total amount and commission
  const { data: apptServices } = await supabase
    .from('appointment_services')
    .select('service_id, services(id, price, commission_percentage, commission_amount)')
    .eq('appointment_id', appointmentId);
    
  let total = 0;
  let commission = 0;
  if (apptServices) {
    apptServices.forEach((item: any) => {
      const svc = item.services;
      if (svc) {
        // If this is a treatment package session, the covered service price goes to 0đ
        const isCovered = coveredServiceId && String(item.service_id) === String(coveredServiceId);
        const price = isCovered ? 0 : (Number(svc.price) || 0);

        // Commission is ALWAYS computed based on the original full service price to support staff earnings fairly
        const basePriceForCommission = Number(svc.price) || 0;

        total += price;
        const commFixed = Number(svc.commission_amount) || 0;
        const commPercent = svc.commission_percentage !== undefined && svc.commission_percentage !== null ? Number(svc.commission_percentage) : 20;
        if (commFixed > 0) {
          commission += commFixed;
        } else {
          commission += Math.round(basePriceForCommission * (commPercent / 100));
        }
      }
    });
  } else {
    commission = Math.round(total * 0.20); // Fallback to 20% commission
  }

  // Calculate discount and apply to total_amount
  const discountAmount = Math.round(total * (discountPercent / 100));
  const discountedTotal = Math.max(0, total - discountAmount);
  
  // 3. Update appointment
  const { error } = await supabase
    .from('appointments')
    .update({ 
      status: 'COMPLETED',
      total_amount: discountedTotal,
      commission_amount: commission,
      tip_amount: tipAmount
    })
    .eq('id', appointmentId);
    
  if (error) return { success: false, error: error.message };

  // Trigger real-time notifications to customer and active staff of the completed appointment
  if (dbAppt) {
    if (dbAppt.customer_id) {
      await sendPushNotification(
        dbAppt.customer_id,
        'Thanh toán hoàn tất! ✨',
        `Hóa đơn của bạn đã sẵn sàng. Tổng thanh toán là ${discountedTotal.toLocaleString('vi-VN')} VNĐ. Cảm ơn quý khách đã tin chọn Min Salon!`,
        '/booking'
      ).catch(err => console.error("Customer checkout push notification error:", err));
    }
    
    const staffId = dbAppt.staff_id;
    if (staffId) {
      await sendPushNotification(
        staffId,
        'Hóa đơn hoàn tất! 🎉',
        `Bạn đã hoàn thành lịch hẹn #${appointmentId.slice(-6).toUpperCase()}. Hoa hồng của bạn là ${commission.toLocaleString('vi-VN')} VNĐ đã được ghi nhận.`,
        '/staff'
      ).catch(err => console.error("Staff checkout push notification error:", err));
    }
  }

  // Trigger reminders check immediately to notify other staff members of any unclaimed random appointments
  await runRemindersCheck().catch(err => console.error("Reminders check error:", err));

  return { success: true, total: discountedTotal };
}

export async function submitReview(appointmentId: string, rating: number, tags: string[], comment: string = "") {
  const supabase = await createClient();
  const { error } = await supabase
    .from('reviews')
    .insert({
      appointment_id: appointmentId,
      rating,
      quick_tags: tags,
      comment: comment || null
    });
    
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Stats
export async function getStaffStats(startDateStr?: string, endDateStr?: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'MANAGER')) throw new Error('Unauthorized');
  
  const staffId = session.user.id;
  const supabase = await createClient();
  const today = new Date();
  
  const startRange = startDateStr ? new Date(startDateStr).toISOString() : startOfMonth(today).toISOString();
  const endRange = endDateStr ? new Date(endDateStr).toISOString() : endOfMonth(today).toISOString();

  const startRangeDay = startDateStr ? format(new Date(startDateStr), 'yyyy-MM-dd') : format(startOfMonth(today), 'yyyy-MM-dd');
  const endRangeDay = endDateStr ? format(new Date(endDateStr), 'yyyy-MM-dd') : format(endOfMonth(today), 'yyyy-MM-dd');

  try {
    // 1. Appointments this month
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        id, total_amount, commission_amount, tip_amount, customer_id, customers(full_name),
        appointment_services(services(name))
      `)
      .eq('staff_id', staffId)
      .eq('status', 'COMPLETED')
      .gte('start_time', startRange)
      .lte('start_time', endRange);

    // 1b. Treatment packages sold by this staff member this month
    const { data: mySoldPackages } = await supabase
      .from('customer_packages')
      .select(`
        id,
        purchased_at,
        commission_amount,
        treatment_packages!package_id ( id, name, price, commission_percentage )
      `)
      .eq('sold_by_staff_id', staffId)
      .gte('purchased_at', startRange)
      .lte('purchased_at', endRange);

    // 2. Attendance this month
    const { data: attendance } = await supabase
      .from('attendance')
      .select('id, staff_id, date, status, check_in_time')
      .eq('staff_id', staffId)
      .gte('date', startRangeDay)
      .lte('date', endRangeDay)
      .order('date', { ascending: false });

    let totalRevenue = 0;
    let totalCommission = 0;
    let totalTip = 0;
    
    const customerCount: Record<string, {name: string, count: number}> = {};
    const serviceCount: Record<string, number> = {};

    if (appointments) {
      appointments.forEach((app: any) => {
        totalRevenue += Number(app.total_amount) || 0;
        totalCommission += Number(app.commission_amount) || 0;
        totalTip += Number(app.tip_amount) || 0;

        if (app.customer_id) {
          if (!customerCount[app.customer_id]) {
            customerCount[app.customer_id] = { name: app.customers?.full_name || 'Khách', count: 0 };
          }
          customerCount[app.customer_id].count += 1;
        }
        
        app.appointment_services?.forEach((as: any) => {
          const sName = as.services?.name;
          if (sName) {
            serviceCount[sName] = (serviceCount[sName] || 0) + 1;
          }
        });
      });
    }

    if (mySoldPackages) {
      mySoldPackages.forEach((pkg: any) => {
        totalRevenue += Number(pkg.treatment_packages?.price) || 0;
        totalCommission += Number(pkg.commission_amount) || 0;
      });
    }

    const daysPresent = attendance?.filter((a: any) => a.status === 'PRESENT').length || 0;
    const daysAbsent = attendance?.filter((a: any) => a.status === 'ABSENT').length || 0;

    const topCustomers = Object.values(customerCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => ({ name: e[0], count: e[1] }));

    // 3. Fetch reviews for completed appointments served by this staff member
    let staffReviews: any[] = [];
    let avgRating = 5;
    
    const { data: reviews, error: reviewErr } = await supabase
      .from('reviews')
      .select(`
        id, rating, quick_tags, comment, created_at,
        appointments!inner(
          id, start_time, staff_id,
          customers(id, full_name, phone)
        )
      `)
      .eq('appointments.staff_id', staffId)
      .order('created_at', { ascending: false });

    if (!reviewErr && reviews) {
      staffReviews = reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        quickTags: r.quick_tags || [],
        comment: r.comment || '',
        createdAt: r.created_at,
        customerName: r.appointments?.customers?.full_name || 'Khách vãng lai',
        customerPhone: r.appointments?.customers?.phone || '',
        appointmentTime: r.appointments?.start_time
      }));
      
      if (reviews.length > 0) {
        const sumRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
        avgRating = Number((sumRating / reviews.length).toFixed(1));
      }
    }

    return {
      totalRevenue,
      totalCommission,
      totalTip,
      daysPresent,
      daysAbsent,
      topCustomers,
      topServices,
      totalCompleted: appointments?.length || 0,
      attendanceLogs: attendance || [],
      reviews: staffReviews,
      avgRating,
      reviewsCount: staffReviews.length,
      soldPackages: mySoldPackages || []
    };
  } catch (error) {
    return {
      totalRevenue: 0, totalCommission: 0, totalTip: 0, daysPresent: 0, daysAbsent: 0, topCustomers: [], topServices: [], totalCompleted: 0, attendanceLogs: [], reviews: [], avgRating: 5, reviewsCount: 0
    };
  }
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Chưa đăng nhập hoặc phiên làm việc hết hạn' };
  }
  const userId = session.user.id;
  const supabase = await createClient();
  
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();
    
  if (fetchErr || !user) {
    return { success: false, error: 'Không tìm thấy tài khoản người dùng trong hệ thống' };
  }
  
  if (user.password_hash !== oldPassword) {
    return { success: false, error: 'Mật khẩu cũ nhập vào không chính xác' };
  }
  
  const { error: updateErr } = await supabase
    .from('users')
    .update({ password_hash: newPassword })
    .eq('id', userId);
    
  if (updateErr) {
    return { success: false, error: 'Lỗi cập nhật mật khẩu mới: ' + updateErr.message };
  }
  
  return { success: true };
}

export async function getCustomerPackagesDetailed(customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_packages')
    .select(`
      id,
      total_sessions,
      remaining_sessions,
      status,
      purchased_at,
      commission_amount,
      treatment_packages!package_id (
        id,
        name,
        price,
        services (name)
      )
    `)
    .eq('customer_id', customerId)
    .order('purchased_at', { ascending: false });
  if (error) {
    console.error("Lỗi lấy chi tiết gói của khách:", error);
    return [];
  }
  return data || [];
}

