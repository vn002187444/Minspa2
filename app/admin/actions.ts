'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditAction } from "@/utils/audit";
import { hashPassword, verifyPassword } from "@/lib/password";
import { stripHtml } from "@/lib/sanitize";
import { normalizeNFC } from "@/lib/utils";

interface StaffInput {
  username?: string;
  password?: string;
  fullName?: string;
  full_name?: string;
  role?: string;
  cccd?: string;
}

interface ServiceInput {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  duration?: number;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  commission_percentage?: number;
  commission_amount?: number;
}

interface PackageInput {
  id?: string;
  name?: string;
  service_id?: string;
  buy_count?: number;
  free_count?: number;
  price?: number;
  commission_percentage?: number;
  is_active?: boolean;
  services?: any[];
}

interface BankInput {
  bank_id?: string;
  bank_name?: string;
  account_number?: string;
  account_owner?: string;
}

interface SeoInput {
  page_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image_url?: string;
  logo_url?: string;
  online_discount_enabled?: boolean;
  online_discount_percent?: number;
  default_commission_percent?: number;
  hotline?: string;
  facebook_url?: string;
  zalo_url?: string;
}

interface BannerInput {
  is_enabled?: boolean;
  content?: string;
}

interface StaffReportEntry {
  staffId: string;
  fullName: string;
  username: string;
  totalAppointments: number;
  totalSales: number;
  totalCommission: number;
  totalTip: number;
  items: Array<{
    id: string;
    startTime: string;
    customerName: string;
    sales: number;
    commission: number;
    tip: number;
    services: string[];
  }>;
}



async function checkAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

async function checkAdminOrManager() {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
}

export async function getDashboardData(startDateStr?: string, endDateStr?: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const userRole = session.user.role;
  const supabase = await createClient();
  const today = new Date();
  
  const startRange = startDateStr ? new Date(startDateStr).toISOString() : startOfMonth(today).toISOString();
  const endRange = endDateStr ? new Date(endDateStr).toISOString() : endOfMonth(today).toISOString();

  const startRangeDay = startDateStr ? format(new Date(startDateStr), 'yyyy-MM-dd') : format(startOfMonth(today), 'yyyy-MM-dd');
  const endRangeDay = endDateStr ? format(new Date(endDateStr), 'yyyy-MM-dd') : format(endOfMonth(today), 'yyyy-MM-dd');

  try {
    // 1. Completed Appointments in date range
    const { data: appts, error: err1 } = await supabase
      .from('appointments')
      .select(`
        id, total_amount, commission_amount, tip_amount, created_at, start_time, status, staff_id,
        users!appointments_staff_id_fkey(full_name),
        customers(full_name)
      `)
      .eq('status', 'COMPLETED')
      .gte('start_time', startRange)
      .lte('start_time', endRange)
      .limit(1000);

    if (err1) throw err1;

    let totalRevenue = 0;
    let totalCommission = 0;
    let totalTip = 0;
    let totalCompleted = 0;

    if (appts) {
      totalCompleted = appts.length;
      appts.forEach((app: any) => {
        totalRevenue += Number(app.total_amount) || 0;
        totalCommission += Number(app.commission_amount) || 0;
        totalTip += Number(app.tip_amount) || 0;
      });
    }

    // 2. Pending Appointments (Today)
    const todayVNStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(today);
    
    const startOfTodayISO = new Date(`${todayVNStr}T00:00:00+07:00`).toISOString();
    const endOfTodayISO = new Date(`${todayVNStr}T23:59:59.999+07:00`).toISOString();

    const { count: pendingCount, error: err2 } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .in('status', ['PENDING_RANDOM', 'CONFIRMED'])
      .gte('start_time', startOfTodayISO)
      .lte('start_time', endOfTodayISO);

    if (err2) throw err2;

    // 3. Staff Present Today
    const { count: presentCount, error: err3 } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', todayVNStr)
      .eq('status', 'PRESENT');
      
    if (err3) throw err3;

    // 4. Attendance log in date range for "Xem điểm danh"
    const { data: attendanceLog } = await supabase
      .from('attendance')
      .select(`
        id, staff_id, date, status, check_in_time,
        users!attendance_staff_id_fkey(full_name)
      `)
      .gte('date', startRangeDay)
      .lte('date', endRangeDay)
      .order('date', { ascending: false })
      .limit(500);

    // 5. Today's appointments (all statuses) for widget
    const { data: todayAppts } = await supabase
      .from('appointments')
      .select(`
        id, total_amount, start_time, status, staff_id,
        users!appointments_staff_id_fkey(full_name),
        customers(full_name)
      `)
      .gte('start_time', startOfTodayISO)
      .lte('start_time', endOfTodayISO)
      .order('start_time', { ascending: true })
      .limit(100);

    // Chart Data (group by day in chosen interval)
    const dailyRevenue: Record<string, number> = {};
    if (appts) {
      appts.forEach((app: any) => {
        const d = format(new Date(app.start_time), 'dd/MM');
        dailyRevenue[d] = (dailyRevenue[d] || 0) + (Number(app.total_amount) || 0);
      });
    }

    // Generate chart entries based on range
    const startObj = new Date(startRangeDay);
    const endObj = new Date(endRangeDay);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let chartData = [];
    if (diffDays >= 0 && diffDays <= 31) {
      try {
        chartData = eachDayOfInterval({ start: startObj, end: endObj }).map(d => {
          const dStr = format(d, 'dd/MM');
          return { name: dStr, value: dailyRevenue[dStr] || 0 };
        });
      } catch {
        chartData = eachDayOfInterval({ start: subDays(today, 6), end: today }).map(d => {
          const dStr = format(d, 'dd/MM');
          return { name: dStr, value: dailyRevenue[dStr] || 0 };
        });
      }
    } else {
      // Just return non-zero sorted days
      chartData = Object.entries(dailyRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => a.name.localeCompare(b.name));
    }

    return {
      userRole,
      totalRevenue,
      totalCommission,
      totalTip,
      totalCompleted,
      pendingCount: pendingCount || 0,
      presentCount: presentCount || 0,
      chartData,
      attendanceLog: attendanceLog || [],
      appointmentsList: appts || [],
      todayAppointments: todayAppts || []
    };
  } catch (error: unknown) {
    console.error('Supabase query error:', error);
    // Return empty mock data on fetch failure
    return {
      userRole,
      totalRevenue: 0,
      totalCommission: 0,
      totalTip: 0,
      totalCompleted: 0,
      pendingCount: 0,
      presentCount: 0,
      chartData: eachDayOfInterval({ start: subDays(today, 6), end: today }).map(d => ({ name: format(d, 'dd/MM'), value: 0 })),
      attendanceLog: [],
      appointmentsList: [],
      todayAppointments: []
    };
  }
}

export async function getStaffs() {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from('users')
      .select('id, username, full_name, role, cccd, is_active, created_at')
      .in('role', ['STAFF', 'MANAGER'])
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    console.log('Fetched staff count:', data?.length);
    return data || [];
  } catch (error: unknown) {
    if (error != null && typeof error === 'object' && 'code' in error && (error as any).code === '42703') {
      console.warn('is_active column missing from users table, retrying query without it');
      const { data, error: err2 } = await supabase.from('users')
        .select('id, username, full_name, role, cccd, created_at')
        .in('role', ['STAFF', 'MANAGER'])
        .order('created_at', { ascending: false })
        .limit(100);
      if (err2) {
        console.error('Error fetching staff list (fallback):', err2);
        return [];
      }
      return (data || []).map(s => ({ ...s, is_active: true }));
    }
    console.error('Error fetching staff list:', error);
    return [];
  }
}

export async function createStaff(staffData: StaffInput) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const hashedPw = await hashPassword((staffData.password || '').trim());
  const { error } = await supabase.from('users').insert({
    role: staffData.role || 'STAFF',
    username: (staffData.username || '').trim().toLowerCase(),
    password_hash: hashedPw,
    full_name: (staffData.fullName || '').trim(),
    cccd: (staffData.cccd || '').trim()
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateStaff(staffId: string, staffData: StaffInput) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('users')
    .select('role, cccd')
    .eq('id', staffId)
    .single();

  const newRole = staffData.role || current?.role;
  const newCccd = staffData.cccd?.trim() ?? '';

  if (newRole === 'STAFF' && !newCccd) {
    return { success: false, error: 'CCCD là bắt buộc khi phân quyền là STAFF. Vui lòng nhập số CCCD.' };
  }

  const updates: Record<string, unknown> = {
    username: staffData.username,
    full_name: staffData.full_name,
  };

  if (staffData.role) updates.role = staffData.role;
  if (staffData.cccd !== undefined) updates.cccd = newCccd;

  const { error } = await supabase.from('users').update(updates).eq('id', staffId);

  if (!error) {
    await logAuditAction(session.user.id, "EDIT_STAFF", `Sửa thông tin nhân viên: ${staffData.full_name} (${staffData.username})`);
  }

  return { success: !error, error: error?.message };
}

export async function resetStaffPassword(staffId: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const hashedResetPw = await hashPassword('123456');
  const { error } = await supabase.from('users').update({
    password_hash: hashedResetPw
  }).eq('id', staffId);

  if (!error) {
    const { data: user } = await supabase.from('users').select('username').eq('id', staffId).single();
    await logAuditAction(session.user.id, "RESET_PASSWORD", `Reset mật khẩu nhân viên: ${user?.username || staffId}`);
  }

  return { success: !error, error: error?.message };
}

export async function getStaffDetail(staffId: string, startDateStr?: string, endDateStr?: string) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const today = new Date();
  
  const startMonth = startDateStr ? new Date(startDateStr).toISOString() : startOfMonth(today).toISOString();
  const endMonth = endDateStr ? new Date(endDateStr).toISOString() : endOfMonth(today).toISOString();

  try {
    const { data: appointments, error: err1 } = await supabase
      .from('appointments')
      .select(`id, total_amount, commission_amount, tip_amount, customer_id, customers(full_name), appointment_services(services(name))`)
      .eq('staff_id', staffId)
      .eq('status', 'COMPLETED')
      .gte('start_time', startMonth)
      .lte('start_time', endMonth)
      .limit(1000);

    if (err1) throw err1;

    const { data: attendance, error: err2 } = await supabase
      .from('attendance')
      .select('id, date, status, check_in_time, check_out_time')
      .eq('staff_id', staffId)
      .gte('date', format(new Date(startMonth), 'yyyy-MM-dd'))
      .lte('date', format(new Date(endMonth), 'yyyy-MM-dd'))
      .limit(100);

    if (err2) throw err2;

    let totalRevenue = 0, totalCommission = 0, totalTip = 0;
    const customerCount: Record<string, {name: string, count: number}> = {};
    const serviceCount: Record<string, number> = {};

    if (appointments) {
      appointments.forEach((app: any) => {
        totalRevenue += Number(app.total_amount) || 0;
        totalCommission += Number(app.commission_amount) || 0;
        totalTip += Number(app.tip_amount) || 0;
        if (app.customer_id) {
          if (!customerCount[app.customer_id]) customerCount[app.customer_id] = { name: app.customers?.full_name || 'Khách', count: 0 };
          customerCount[app.customer_id].count += 1;
        }
        app.appointment_services?.forEach((as: any) => {
          const sName = as.services?.name;
          if (sName) serviceCount[sName] = (serviceCount[sName] || 0) + 1;
        });
      });
    }

    const daysPresent = attendance?.filter((a: any) => a.status === 'PRESENT').length || 0;
    const daysAbsent = attendance?.filter((a: any) => a.status === 'ABSENT').length || 0;
    const topCustomers = Object.values(customerCount).sort((a, b) => b.count - a.count).slice(0, 10);
    const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => ({ name: e[0], count: e[1] }));

    return { totalRevenue, totalCommission, totalTip, daysPresent, daysAbsent, topCustomers, topServices, totalCompleted: appointments?.length || 0 };
  } catch {
    return { totalRevenue: 0, totalCommission: 0, totalTip: 0, daysPresent: 0, daysAbsent: 0, topCustomers: [], topServices: [], totalCompleted: 0 };
  }
}

export async function getServices() {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from('services').select('id, name, category, price, duration, description, image_url, commission_percentage, commission_amount, is_active').order('category', { ascending: true }).limit(200);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function saveService(serviceData: ServiceInput) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  let imageUrl = serviceData.image_url;
  if (imageUrl && imageUrl.startsWith('data:')) {
    try {
      imageUrl = await uploadBase64ToStorage(imageUrl);
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
  const { id, ...updateData } = { ...serviceData, image_url: imageUrl };
  if (serviceData.id) {
    const { data: oldService } = await supabase.from('services').select('price, name').eq('id', serviceData.id).single();
    
    const { error } = await supabase.from('services').update(updateData).eq('id', id);
    if (error) return { success: false, error: error.message };

    if (oldService) {
      if (oldService.price !== serviceData.price) {
        await logAuditAction(session.user.id, "EDIT_SERVICE", `Đổi giá dịch vụ '${serviceData.name}': ${oldService.price} ➔ ${serviceData.price}`);
      } else {
        await logAuditAction(session.user.id, "EDIT_SERVICE", `Sửa thông tin dịch vụ '${serviceData.name}'`);
      }
    }
  } else {
    const { error } = await supabase.from('services').insert(updateData);
    if (error) return { success: false, error: error.message };
    await logAuditAction(session.user.id, "ADD_SERVICE", `Thêm mới dịch vụ '${serviceData.name}'`);
  }
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteServiceSafely(serviceId: string, serviceName: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  try {
    const { error: updateErr } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', serviceId);

    if (updateErr) throw updateErr;

    await logAuditAction(session.user.id, "SOFT_DELETE_SERVICE", `Ẩn dịch vụ: '${serviceName}'`);

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, mode: 'SOFT_DELETE', message: 'Hệ thống đã tắt kích hoạt và tự động ẩn dịch vụ thành công để tránh lỗi lịch sử đơn hàng.' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deleteStaffSafely(staffId: string, staffName: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  try {
    const { error: updateErr } = await supabase
      .from('users')
      .update({ is_active: false, cccd: '' })
      .eq('id', staffId);

    if (updateErr) throw updateErr;

    await logAuditAction(session.user.id, "SOFT_DELETE_STAFF", `Ẩn nhân viên: '${staffName}'`);

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: 'Đã ẩn nhân viên thành công.' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function toggleStaffActive(staffId: string, newStatus: boolean) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  try {
    const { error: updateErr } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', staffId);

    if (updateErr) throw updateErr;

    await logAuditAction(
      session.user.id,
      newStatus ? "RESTORE_STAFF" : "SOFT_DELETE_STAFF",
      `${newStatus ? 'Kích hoạt lại' : 'Vô hiệu hóa'} nhân viên ID: '${staffId}'`
    );

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: newStatus ? 'Đã kích hoạt lại nhân viên.' : 'Đã vô hiệu hóa nhân viên.' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getReviews() {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, rating, quick_tags, comment, created_at,
        appointments (
          status, start_time,
          customers (full_name, phone),
          users (full_name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function getSeoSettings() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('seo_settings').select('page_title, meta_description, meta_keywords, og_image_url, logo_url, online_discount_enabled, online_discount_percent, default_commission_percent, hotline, facebook_url, zalo_url').eq('id', 1).single();
    if (error) throw error;
    if (data) {
      return {
        page_title: data.page_title,
        meta_description: data.meta_description,
        meta_keywords: data.meta_keywords,
        og_image_url: data.og_image_url,
        logo_url: data.logo_url || '',
        online_discount_enabled: data.online_discount_enabled !== false,
        online_discount_percent: data.online_discount_percent ?? 5,
        default_commission_percent: data.default_commission_percent ?? 15,
        hotline: data.hotline || '0934 323 878',
        facebook_url: data.facebook_url || 'https://facebook.com/minnailhair',
        zalo_url: data.zalo_url || 'https://zalo.me/0934323878',
      };
    }
  } catch (e: unknown) {
    console.error(e);
  }
  return { page_title: '', meta_description: '', meta_keywords: '', og_image_url: '', logo_url: '', online_discount_enabled: true, online_discount_percent: 5, default_commission_percent: 15, hotline: '0934 323 878', facebook_url: 'https://facebook.com/minnailhair', zalo_url: 'https://zalo.me/0934323878' };
}

export async function saveSeoSettings(payload: SeoInput) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_settings').upsert({
      id: 1,
      page_title: payload.page_title,
      meta_description: payload.meta_description,
      meta_keywords: payload.meta_keywords,
      og_image_url: payload.og_image_url,
      logo_url: payload.logo_url || '',
      online_discount_enabled: payload.online_discount_enabled !== false,
      online_discount_percent: payload.online_discount_percent ?? 5,
      default_commission_percent: payload.default_commission_percent ?? 15,
      hotline: payload.hotline || '0934 323 878',
      facebook_url: payload.facebook_url || 'https://facebook.com/minnailhair',
      zalo_url: payload.zalo_url || 'https://zalo.me/0934323878',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getSeoArticles() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_articles')
      .select('id, created_at, topic, keywords, article, image_url, image_alt, status, topic_source, blog_slug, published_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data || []).map((a: {
      id: string; created_at: string; topic: string; keywords: string; article: string;
      image_url: string | null; image_alt: string | null; status: string;
      topic_source: string; blog_slug: string | null; published_at: string | null;
    }) => {
      const n = normalizeNFC(a)
      return {
        id: n.id,
        createdAt: n.created_at,
        topic: n.topic,
        keywords: n.keywords,
        article: n.article,
        imageUrl: n.image_url,
        imageAlt: n.image_alt,
        status: n.status,
        topicSource: n.topic_source,
        blogSlug: n.blog_slug,
        publishedAt: n.published_at,
      }
    });
  } catch (e: unknown) {
    console.error(e);
  }
  return [];
}

export async function getSeoArticleById(id: string) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_articles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return normalizeNFC(data);
  } catch (e: unknown) {
    console.error(e);
    return null;
  }
}

async function uploadBase64ToStorage(base64Url: string): Promise<string> {
  if (!base64Url || !base64Url.startsWith('data:')) return base64Url;
  const sharp = (await import('sharp')).default;
  const matches = base64Url.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return base64Url;
  const base64Data = matches[2];
  const raw = Buffer.from(base64Data, 'base64');
  
  // Server-side size limit: 500KB (ảnh gốc trước khi optimize)
  if (raw.length > 512000) {
    console.warn('[STORAGE] Rejected upload >500KB:', raw.length, 'bytes');
    throw new Error('Ảnh quá lớn! Vui lòng chọn ảnh dưới 500KB.');
  }
  
  let optimized: Buffer;
  try {
    optimized = await sharp(raw).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  } catch {
    try { optimized = await sharp(raw).webp({ quality: 80 }).toBuffer(); } catch { optimized = raw; }
  }
  const fileName = `seo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from('seo-images').upload(fileName, optimized, { contentType: 'image/webp', upsert: true });
  if (error) {
    console.error('[STORAGE UPLOAD ERROR]', error);
    return base64Url;
  }
  const { data: urlData } = supabase.storage.from('seo-images').getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function saveSeoArticle(article: Record<string, unknown>) {
  await checkAdminOrManager();
  try {
    const imageUrl = await uploadBase64ToStorage(String(article.image_url || article.imageUrl || ''));
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('seo_articles')
      .select('id')
      .eq('id', article.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('seo_articles')
        .update({
          topic: normalizeNFC(article.topic),
          keywords: normalizeNFC(article.keywords),
          article: normalizeNFC(article.article),
          image_url: imageUrl,
          image_alt: normalizeNFC(article.image_alt || article.imageAlt || null),
          status: article.status || 'draft',
        })
        .eq('id', article.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('seo_articles')
        .insert({
          id: article.id || 'art_' + Math.random().toString(36).substring(2, 11),
          topic: normalizeNFC(article.topic),
          keywords: normalizeNFC(article.keywords),
          article: normalizeNFC(article.article),
          image_url: imageUrl,
          image_alt: normalizeNFC(article.image_alt || article.imageAlt || null),
          status: article.status || 'draft',
          created_at: article.createdAt || new Date().toISOString(),
        });
      if (error) throw error;
    }
    return { success: true };
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function deleteSeoArticle(id: string) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_articles').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function publishSeoArticleToBlog(
  articleText: string,
  imageUrl: string,
  options?: { title?: string; slug?: string; keywords?: string }
) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }

  const title = options?.title
    || (articleText.match(/^#\s+(.+)/m)?.[1]?.trim())
    || articleText.split('\n').find(l => l.trim().startsWith('## '))?.replace(/^##\s+/, '').trim()
    || articleText.split('\n')[0].replace(/^#+\s*/, '').trim().substring(0, 100)
    || 'Bài viết SEO';

  const firstParagraph = articleText.replace(/^#\s+.+\n*/m, '').match(/^(.+?)(?:\n\n|$)/m);
  const summary = firstParagraph ? firstParagraph[1].replace(/\*\*/g, '').trim().substring(0, 300) : title;

  const slugify = (text: string) => text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200) || 'bai-viet-seo';

  let baseSlug = options?.slug || slugify(title);

  const finalImageUrl = await uploadBase64ToStorage(imageUrl || '');
  const supabase = await createClient();

  // Auto-increment slug if duplicate exists
  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const { data: existing } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const now = new Date().toISOString();
  const ncTitle = normalizeNFC(title);
  const ncSummary = normalizeNFC(summary);
  const ncContent = normalizeNFC(articleText);
  const ncKeywords = normalizeNFC(options?.keywords || '');
  const { error } = await supabase.from('blogs').insert({
    title: ncTitle,
    slug,
    summary: ncSummary,
    content: ncContent,
    image_url: finalImageUrl || 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop',
    keywords: ncKeywords,
    published: true,
    published_at: now,
    created_at: now,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/sitemap');
  revalidatePath('/admin/blog');

  return { success: true, slug };
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
  
  const isOldPasswordCorrect = await verifyPassword(oldPassword, user.password_hash);
  if (!isOldPasswordCorrect) {
    return { success: false, error: 'Mật khẩu cũ nhập vào không chính xác' };
  }
  
  const hashedNewPassword = await hashPassword(newPassword);
  const { error: updateErr } = await supabase
    .from('users')
    .update({ password_hash: hashedNewPassword })
    .eq('id', userId);
    
  if (updateErr) {
    return { success: false, error: 'Lỗi cập nhật mật khẩu mới: ' + updateErr.message };
  }
  
  return { success: true };
}

export async function getCommissionReport(startDateStr: string, endDateStr: string) {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        total_amount,
        commission_amount,
        tip_amount,
        start_time,
        status,
        staff_id,
        customers (full_name),
        users (id, full_name, username),
        appointment_services (
          services (name, price)
        )
      `)
      .eq('status', 'COMPLETED')
      .gte('start_time', startDateStr)
      .lte('start_time', endDateStr)
      .order('start_time', { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Fetch treatment packages sold within date range
    const { data: soldPackages } = await supabase
      .from('customer_packages')
      .select(`
        id,
        purchased_at,
        sold_by_staff_id,
        commission_amount,
        treatment_packages!package_id ( id, name, price, commission_percentage ),
        customers ( full_name )
      `)
      .gte('purchased_at', startDateStr)
      .lte('purchased_at', endDateStr)
      .limit(500);

    // Get all active staff to ensure we list everyone even if they have 0 appointments
    const { data: staffList } = await supabase
      .from('users')
      .select('id, full_name, username')
      .eq('role', 'STAFF')
      .eq('is_active', true)
      .limit(100);

    const staffMap: Record<string, StaffReportEntry> = {};
    if (staffList) {
      staffList.forEach((s: { id: string; full_name: string | null; username: string | null }) => {
        staffMap[s.id] = {
          staffId: s.id,
          fullName: s.full_name || s.username || 'N/A',
          username: s.username || '',
          totalAppointments: 0,
          totalSales: 0,
          totalCommission: 0,
          totalTip: 0,
          items: []
        };
      });
    }

    let grandTotalSales = 0;
    let grandTotalCommission = 0;
    let grandTotalTip = 0;
    let grandAppointmentsCount = 0;

    if (appointments) {
      appointments.forEach((app: any) => {
        const sId = app.staff_id;
        if (sId) {
          if (!staffMap[sId]) {
            staffMap[sId] = {
              staffId: sId,
              fullName: app.users?.full_name || app.users?.username || 'KTV chưa rõ',
              username: app.users?.username || '',
              totalAppointments: 0,
              totalSales: 0,
              totalCommission: 0,
              totalTip: 0,
              items: []
            };
          }

          const sales = Number(app.total_amount) || 0;
          const comm = Number(app.commission_amount) || 0;
          const tip = Number(app.tip_amount) || 0;

          staffMap[sId].totalAppointments += 1;
          staffMap[sId].totalSales += sales;
          staffMap[sId].totalCommission += comm;
          staffMap[sId].totalTip += tip;
          staffMap[sId].items.push({
            id: app.id,
            startTime: app.start_time,
            customerName: app.customers?.full_name || 'Khách lẻ',
            sales,
            commission: comm,
            tip,
            services: (app.appointment_services || []).map((as: any) => as.services?.name).filter(Boolean)
          });

          grandTotalSales += sales;
          grandTotalCommission += comm;
          grandTotalTip += tip;
          grandAppointmentsCount += 1;
        }
      });
    }

    if (soldPackages) {
      soldPackages.forEach((pkg: any) => {
        const sId = pkg.sold_by_staff_id;
        if (sId) {
          if (!staffMap[sId]) {
            staffMap[sId] = {
              staffId: sId,
              fullName: 'KTV chưa rõ',
              username: '',
              totalAppointments: 0,
              totalSales: 0,
              totalCommission: 0,
              totalTip: 0,
              items: []
            };
          }

          const sales = Number(pkg.treatment_packages?.price) || 0;
          const comm = Number(pkg.commission_amount) || 0;

          staffMap[sId].totalSales += sales;
          staffMap[sId].totalCommission += comm;
          staffMap[sId].items.push({
            id: pkg.id,
            startTime: pkg.purchased_at,
            customerName: pkg.customers?.full_name || 'Khách mua gói',
            sales,
            commission: comm,
            tip: 0,
            services: [`Bán gói: ${pkg.treatment_packages?.name || 'Gói liệu trình'}`]
          });

          grandTotalSales += sales;
          grandTotalCommission += comm;
        }
      });
    }

    return {
      success: true,
      data: {
        staffReports: Object.values(staffMap),
        grandTotalSales,
        grandTotalCommission,
        grandTotalTip,
        grandAppointmentsCount
      }
    };
  } catch (error: unknown) {
    console.error("Commission Report aggregation error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi khi lấy báo cáo hoa hồng' };
  }
}

export async function getTreatmentPackages() {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('treatment_packages')
      .select('*, services(name, price)')
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function saveTreatmentPackage(packageData: PackageInput) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  
  // total_sessions = buy_count + free_count
  const total_sessions = (Number(packageData.buy_count) || 0) + (Number(packageData.free_count) || 0);
  const dataToSave = {
    ...packageData,
    total_sessions
  };

  if (dataToSave.id) {
    const { id, services: _services, ...updateData } = dataToSave;
    const { error } = await supabase.from('treatment_packages').update(updateData).eq('id', id);
    if (error) return { success: false, error: error.message };
    await logAuditAction(session.user.id, "EDIT_PACKAGE", `Sửa gói liệu trình '${updateData.name}'`);
  } else {
    const { services: _services, ...insertData } = dataToSave;
    const { error } = await supabase.from('treatment_packages').insert(insertData);
    if (error) return { success: false, error: error.message };
    await logAuditAction(session.user.id, "ADD_PACKAGE", `Thêm mới gói liệu trình '${insertData.name}'`);
  }
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteTreatmentPackageSafely(packageId: string, packageName: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('treatment_packages')
      .update({ is_active: false })
      .eq('id', packageId);

    if (error) throw error;

    await logAuditAction(session.user.id, "SOFT_DELETE_PACKAGE", `Ẩn gói liệu trình: '${packageName}'`);

    revalidatePath('/admin');
    return { success: true, message: 'Đã ẩn gói liệu trình (soft delete).' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sellPackageToCustomer(customerPhone: string, customerName: string, packageId: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER' && session.user.role !== 'STAFF')) {
    throw new Error('Unauthorized');
  }
  
  const supabase = await createClient();
  
  // 1. Find or create customer
  let customer: any = null;
  const { data: existingCustomers } = await supabase.from('customers').select('id, full_name, phone').eq('phone', customerPhone);
  if (existingCustomers && existingCustomers.length > 0) {
    customer = existingCustomers[0];
  } else {
    const { data: newCustomer, error: createCustErr } = await supabase.from('customers').insert({
      full_name: customerName,
      phone: customerPhone
    }).select().single();
    if (createCustErr) return { success: false, error: 'Lỗi tạo khách hàng' };
    customer = newCustomer || (await supabase.from('customers').select('id, full_name, phone').eq('phone', customerPhone).single()).data;
  }
  
  if (!customer) return { success: false, error: 'Không thể xác định khách hàng' };

  // 2. Get package details
  const { data: pkg } = await supabase.from('treatment_packages').select('id, name, total_sessions, price, commission_percentage').eq('id', packageId).single();
  if (!pkg) return { success: false, error: 'Không tìm thấy gói liệu trình' };

  const price = Number(pkg.price) || 0;
  const commPercent = pkg.commission_percentage !== undefined && pkg.commission_percentage !== null ? Number(pkg.commission_percentage) : 10; // Default to 10% package commission if not specified
  const commission_amount = Math.round(price * (commPercent / 100));

  // 3. Insert customer_packages
  const expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 2 years
  const { error: insertErr } = await supabase.from('customer_packages').insert({
    customer_id: customer.id,
    package_id: pkg.id,
    total_sessions: pkg.total_sessions,
    remaining_sessions: pkg.total_sessions,
    status: 'ACTIVE',
    purchased_at: new Date().toISOString(),
    expires_at: expiresAt,
    sold_by_staff_id: session.user.id,
    commission_amount: commission_amount
  });

  if (insertErr) return { success: false, error: insertErr.message };

  await logAuditAction(session.user.id, "SELL_PACKAGE", `Bán gói '${pkg.name}' cho khách ${customer.full_name} (${customer.phone})`);
  revalidatePath('/staff');
  revalidatePath('/admin');
  
  return { success: true, message: 'Kích hoạt gói thành công!' };
}

export async function getBankSettings() {
  const session = await getSession();
  if (!session) {
    throw new Error('Chưa đăng nhập');
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('bank_settings').select('bank_id, bank_name, account_number, account_owner').eq('id', 1).single();
    if (error) throw error;
    if (data) {
      return {
        bank_id: data.bank_id,
        bank_name: data.bank_name,
        account_number: data.account_number,
        account_owner: data.account_owner,
      };
    }
  } catch (e: unknown) {
    console.error(e);
  }
  return { bank_id: 'vcb', bank_name: 'Vietcombank', account_number: '', account_owner: '' };
}

export async function saveBankSettings(payload: BankInput) {
  await checkAdmin();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('bank_settings').upsert({
      id: 1,
      bank_id: payload.bank_id,
      bank_name: payload.bank_name,
      account_number: payload.account_number,
      account_owner: payload.account_owner,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getCustomerByPhone(phone: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase.from('customers').select('id, full_name, phone').eq('phone', phone);
  if (error || !data || data.length === 0) return null;
  return data[0];
}

export async function getFilteredAppointments(filters: {
  status?: string;
  dateRange?: 'today' | 'week' | 'month' | 'custom' | 'all';
  startDate?: string;
  endDate?: string;
}) {
  await checkAdminOrManager();
  const supabase = await createClient();
  
  let query = supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      total_amount,
      commission_amount,
      tip_amount,
      created_at,
      customers ( full_name, phone ),
      users!appointments_staff_id_fkey ( id, full_name, username ),
      appointment_services (
        services ( id, name, price )
      ),
      reviews (
        id,
        rating,
        quick_tags,
        comment,
        created_at
      )
    `);

  // Status Filter
  if (filters.status && filters.status !== 'ALL') {
    if (filters.status === 'PENDING') {
      query = query.in('status', ['PENDING_RANDOM', 'CONFIRMED']);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  // Date Range Filter
  if (filters.dateRange && filters.dateRange !== 'all') {
    const today = new Date();
    const todayVNStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(today);

    let startRange = '';
    let endRange = '';

    if (filters.dateRange === 'today') {
      startRange = new Date(`${todayVNStr}T00:00:00+07:00`).toISOString();
      endRange = new Date(`${todayVNStr}T23:59:59.999+07:00`).toISOString();
    } else if (filters.dateRange === 'week') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeekDate = new Date(now.setDate(diff));
      startOfWeekDate.setHours(0, 0, 0, 0);
      startRange = startOfWeekDate.toISOString();
      endRange = new Date().toISOString();
    } else if (filters.dateRange === 'month') {
      const startObj = new Date(today.getFullYear(), today.getMonth(), 1);
      startObj.setHours(0,0,0,0);
      startRange = startObj.toISOString();
      endRange = new Date().toISOString();
    } else if (filters.dateRange === 'custom') {
      if (filters.startDate) {
        const startObj = new Date(filters.startDate);
        startObj.setHours(0,0,0,0);
        startRange = startObj.toISOString();
      }
      if (filters.endDate) {
        const endObj = new Date(filters.endDate);
        endObj.setHours(23,59,59,999);
        endRange = endObj.toISOString();
      }
    }

    if (startRange) {
      query = query.gte('start_time', startRange);
    }
    if (endRange) {
      query = query.lte('start_time', endRange);
    }
  }

  const { data, error } = await query.order('start_time', { ascending: false }).limit(1000);
  if (error) {
    console.error('getFilteredAppointments Error:', error);
    return [];
  }
  return data || [];
}

export async function deleteAppointment(appointmentId: string) {
  await checkAdmin();
  const supabase = await createClient();
  const session = await getSession();
  
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);
      
    if (error) throw error;
    
    await logAuditAction(session!.user.id, "DELETE_APPOINTMENT", `Xóa vĩnh viễn lịch hẹn ID: ${appointmentId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error('deleteAppointment Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getAttendanceLogs(startDate: string, endDate: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id, staff_id, date, status, check_in_time, check_out_time,
      users!attendance_staff_id_fkey(full_name, username)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('getAttendanceLogs error:', error);
    return [];
  }

  return data || [];
}

export async function getSystemHealth() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return { status: res.ok ? 'ok' : 'unhealthy', ...data };
  } catch (e: unknown) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function triggerCronJob(jobName: 'reminders' | 'marketing' | 'auto_assign' | 'seo_publish') {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const endpoints: Record<string, string> = {
    reminders: `${baseUrl}/api/cron/reminders`,
    marketing: `${baseUrl}/api/cron/marketing`,
    auto_assign: `${baseUrl}/api/cron/auto-assign`,
    seo_publish: `${baseUrl}/api/cron/seo-publish`,
  };

  try {
    const res = await fetch(endpoints[jobName], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Server error (${res.status}): ${text.substring(0, 200)}` };
    }
    const data = await res.json();
    return { success: true, ...data };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function createManualNotification(recipientRole: string, title: string, body: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const supabase = await createClient();
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .in('role', recipientRole === 'ALL' ? ['ADMIN', 'MANAGER', 'STAFF'] : [recipientRole])
    .eq('is_active', true)
    .limit(500);

  if (!users || users.length === 0) return { success: false, error: 'Không tìm thấy người nhận' };

  const notifications = users.map((u: { id: string }) => ({
    recipient_type: 'user',
    recipient_id: u.id,
    title,
    content: body,
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) return { success: false, error: error.message };

  await logAuditAction(session.user.id, "SEND_NOTIFICATION", `Gửi thông báo "${title}" cho ${users.length} người dùng (${recipientRole})`);
  return { success: true, count: notifications.length };
}

export async function getCronJobStatuses() {
  const supabase = await createClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const jobs = [
    { name: 'reminders', label: 'Nhắc lịch hẹn' },
    { name: 'marketing', label: 'Marketing tự động' },
    { name: 'auto_assign', label: 'Tự động phân ca' },
    { name: 'background_worker', label: 'Background Worker' },
  ];

  const results: any[] = [];
  for (const job of jobs) {
    const { data: logs } = await supabase
      .from('cron_job_logs')
      .select('started_at, finished_at, success, error')
      .eq('job_name', job.name)
      .gte('started_at', oneDayAgo)
      .order('started_at', { ascending: false })
      .limit(1);

    results.push({
      name: job.name,
      label: job.label,
      lastRun: logs && logs.length > 0 ? logs[0] : null,
    });
  }

  return results;
}

export async function getAdminSessionInfo() {
  const session = await getSession();
  if (!session) return null;
  return session.user;
}

import { cachedFetch } from '@/lib/cache';

export async function getBannerSettings() {
  return cachedFetch('banner-settings', async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('banner_settings').select('is_enabled, content').eq('id', 1).single();
      if (error) throw error;
      if (data) {
        return {
          is_enabled: data.is_enabled,
          content: stripHtml(data.content || ''),
        };
      }
    } catch (e: unknown) {
      console.error(e);
    }
    // fallback: fetch hotline from seo_settings
    let hotline = '0934 323 878';
    try {
      const supabase = await createClient();
      const { data: seo } = await supabase.from('seo_settings').select('hotline').eq('id', 1).single();
      if (seo?.hotline) hotline = seo.hotline;
      return { is_enabled: false, content: hotline };
    } catch {
      return { is_enabled: false, content: hotline };
    }
  });
}

export async function saveBannerSettings(payload: BannerInput) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('banner_settings').upsert({
      id: 1,
      is_enabled: payload.is_enabled,
      content: stripHtml(payload.content || ''),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function adminUpdateTip(appointmentId: string, newTipAmount: number) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return { success: false, error: 'Chỉ admin mới có quyền này.' };
  }

  const supabase = await createClient();

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, tip_amount, status, start_time')
    .eq('id', appointmentId)
    .single();

  if (!appt) return { success: false, error: 'Không tìm thấy đơn hàng.' };
  if (appt.status !== 'COMPLETED') return { success: false, error: 'Chỉ được sửa tip cho đơn đã hoàn thành.' };

  const oldTip = appt.tip_amount;

  const { error } = await supabase
    .from('appointments')
    .update({ tip_amount: newTipAmount })
    .eq('id', appointmentId);

  if (error) return { success: false, error: error.message };

  logAuditAction(session.user.id, 'EDIT_TIP',
    `Admin sửa tip đơn '${appointmentId}': ${oldTip}đ → ${newTipAmount}đ`
  ).catch(() => {});

  return { success: true, oldTip, newTip: newTipAmount };
}

export async function getTasks(filters?: { assigneeId?: string; status?: string; taskType?: string; search?: string }) {
  await checkAdminOrManager();
  const supabase = await createClient();
  let query = supabase
    .from('tasks')
    .select('*, assignee:users!assignee_id(id, full_name), creator:users!created_by(id, full_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.assigneeId) query = query.eq('assignee_id', filters.assigneeId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.taskType) query = query.eq('task_type', filters.taskType);
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

  const { data } = await query;
  return data || [];
}

export async function getTaskStats() {
  await checkAdminOrManager();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { count: total } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
  const { count: pending } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
  const { count: inProgress } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS');
  const { count: completed } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
  const { count: overdue } = await supabase.from('tasks').select('*', { count: 'exact', head: true })
    .not('status', 'in', '("COMPLETED","CANCELLED")')
    .lt('deadline', now);

  return { total: total || 0, pending: pending || 0, inProgress: inProgress || 0, completed: completed || 0, overdue: overdue || 0 };
}

export async function getTasksForStaff() {
  const session = await getSession();
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'MANAGER')) {
    return [];
  }
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from('tasks')
    .select('*, creator:users!created_by(id, full_name)')
    .or(`assignee_id.eq.${session.user.id},assignee_type.eq.all`)
    .not('status', 'in', '("CANCELLED")')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  return data || [];
}

export async function createTask(taskData: {
  title: string;
  description?: string;
  taskType: 'daily' | 'one_time';
  assigneeId?: string | null;
  assigneeType: 'specific' | 'all';
  deadline?: string;
  timeSlot?: string;
  priority?: string;
}) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('tasks').insert({
    title: taskData.title,
    description: taskData.description || null,
    task_type: taskData.taskType,
    assignee_id: taskData.assigneeType === 'specific' ? taskData.assigneeId : null,
    assignee_type: taskData.assigneeType,
    deadline: taskData.deadline || null,
    time_slot: taskData.timeSlot || null,
    priority: taskData.priority || 'medium',
    created_by: session.user.id,
  });

  if (error) return { success: false, error: error.message };
  logAuditAction(session.user.id, 'CREATE_TASK', `Tạo công việc: ${taskData.title}`);
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const supabase = await createClient();
  const updateData: Record<string, any> = { status };
  if (status === 'COMPLETED') {
    updateData.completed_at = new Date().toISOString();
  }
  updateData.updated_at = new Date().toISOString();

  const { data: task } = await supabase.from('tasks').select('assignee_id, title').eq('id', taskId).single();
  if (!task) return { success: false, error: 'Không tìm thấy công việc' };

  if (session.user.role === 'STAFF' && task.assignee_id !== session.user.id) {
    return { success: false, error: 'Bạn không có quyền cập nhật công việc này' };
  }

  const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
  if (error) return { success: false, error: error.message };

  if (status === 'COMPLETED' || status === 'REJECTED') {
    const { data: admins } = await supabase
      .from('users').select('id').in('role', ['ADMIN', 'MANAGER']).eq('is_active', true);
    for (const admin of (admins || [])) {
      const notifTitle = status === 'COMPLETED' ? '✅ Nhân viên hoàn thành việc' : '❌ Nhân viên từ chối việc';
      const notifBody = `Công việc "${task.title}" đã được cập nhật: ${status}`;
      void supabase.from('notifications').insert({
        recipient_type: 'user', recipient_id: admin.id,
        title: notifTitle, content: notifBody, link: '/admin?tab=TASKS',
      }).then(() => {}, () => {});
    }
  }

  logAuditAction(session.user.id, 'UPDATE_TASK', `Cập nhật công việc '${task.title}' → ${status}`);
  return { success: true };
}

export async function deleteTask(taskId: string) {
  await checkAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', taskId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function cloneDailyTasks() {
  await checkAdminOrManager();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: yesterdayTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_type', 'daily')
    .lt('created_at', todayStart.toISOString())
    .gte('created_at', new Date(todayStart.getTime() - 86400000).toISOString());

  if (!yesterdayTasks || yesterdayTasks.length === 0) return { success: true, cloned: 0 };

  let cloned = 0;
  for (const task of yesterdayTasks) {
    const { error } = await supabase.from('tasks').insert({
      title: task.title,
      description: task.description,
      task_type: 'daily',
      assignee_id: task.assignee_id,
      assignee_type: task.assignee_type,
      deadline: task.deadline,
      time_slot: task.time_slot,
      priority: task.priority,
      created_by: task.created_by,
      original_task_id: task.original_task_id || task.id,
    });
    if (!error) cloned++;
  }

  return { success: true, cloned };
}

export async function getCustomerPackageProgress(phone: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const supabase = await createClient();
  const cleanedPhone = phone.trim().replace(/\s+/g, "");
  
  // 1. Get the customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('phone', cleanedPhone)
    .maybeSingle();
    
  if (!customer) {
    return { success: false, error: 'Không tìm thấy khách hàng nào với số điện thoại này.' };
  }
  
  // 2. Get customer packages
  const { data: packages, error: pkgErr } = await supabase
    .from('customer_packages')
    .select(`
      id,
      total_sessions,
      remaining_sessions,
      status,
      purchased_at,
      treatment_packages!package_id(
        id,
        name,
        total_sessions,
        price,
        services(name)
      )
    `)
    .eq('customer_id', customer.id)
    .limit(50);
    
  if (pkgErr) {
    return { success: false, error: pkgErr.message };
  }
  
  // 3. For each package, get usage logs
  const packagesWithLogs = [];
  if (packages) {
    for (const p of packages) {
      const { data: logs } = await supabase
        .from('package_usage_logs')
        .select(`
          id,
          used_at,
          notes,
          appointments(
            id,
            start_time,
            users(full_name)
          )
        `)
        .eq('customer_package_id', p.id)
        .order('used_at', { ascending: false })
        .limit(100);
        
      packagesWithLogs.push({
        ...p,
        logs: logs || []
      });
    }
  }
  
  return {
    success: true,
    customer,
    packages: packagesWithLogs
  };
}

export async function getAdvancedRevenueReport(startDate: string, endDate: string) {
  await checkAdminOrManager();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, start_time, total_amount, discount_amount, tip_amount, commission_amount, status, staff_id,
      users!appointments_staff_id_fkey(full_name),
      customers(full_name, phone),
      appointment_services(
        id, price, discount_amount,
        services(id, name)
      )
    `)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .eq('status', 'COMPLETED')
    .limit(5000);

  if (!appointments) {
    return { revenueByDay: [], revenueByService: [], revenueByStaff: [], totalRevenue: 0, totalAppointments: 0 };
  }

  const revenueByDayMap: Record<string, number> = {};
  const revenueByServiceMap: Record<string, { name: string; revenue: number; count: number }> = {};
  const revenueByStaffMap: Record<string, { name: string; revenue: number; tip: number; count: number }> = {};
  let totalRevenue = 0;
  let totalTip = 0;
  let totalDiscount = 0;

  for (const appt of appointments) {
    const day = appt.start_time?.slice(0, 10);
    const netRevenue = (appt.total_amount || 0) - (appt.discount_amount || 0);
    totalRevenue += netRevenue;
    totalTip += appt.tip_amount || 0;
    totalDiscount += appt.discount_amount || 0;

    if (day) revenueByDayMap[day] = (revenueByDayMap[day] || 0) + netRevenue;

    const usersArr = (appt.users as any) || [];
    const staffName = Array.isArray(usersArr) ? (usersArr[0]?.full_name || 'N/A') : (usersArr?.full_name || 'N/A');
    if (!revenueByStaffMap[appt.staff_id]) {
      revenueByStaffMap[appt.staff_id] = { name: staffName, revenue: 0, tip: 0, count: 0 };
    }
    revenueByStaffMap[appt.staff_id].revenue += netRevenue;
    revenueByStaffMap[appt.staff_id].tip += appt.tip_amount || 0;
    revenueByStaffMap[appt.staff_id].count += 1;

    for (const as of (appt.appointment_services || [])) {
      const svc = as.services as any;
      if (!svc?.name) continue;
      if (!revenueByServiceMap[svc.name]) {
        revenueByServiceMap[svc.name] = { name: svc.name, revenue: 0, count: 0 };
      }
      revenueByServiceMap[svc.name].revenue += (as.price || 0) - (as.discount_amount || 0);
      revenueByServiceMap[svc.name].count += 1;
    }
  }

  const revenueByDay = Object.entries(revenueByDayMap)
    .map(([date, value]) => ({ date, value: Math.round(value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const revenueByService = Object.values(revenueByServiceMap)
    .sort((a, b) => b.revenue - a.revenue);

  const revenueByStaff = Object.values(revenueByStaffMap)
    .sort((a, b) => b.revenue - a.revenue);

  return {
    revenueByDay,
    revenueByService,
    revenueByStaff,
    totalRevenue: Math.round(totalRevenue),
    totalTip: Math.round(totalTip),
    totalDiscount: Math.round(totalDiscount),
    totalAppointments: appointments.length,
  };
}

export async function getCustomerAnalytics(startDate: string, endDate: string) {
  await checkAdminOrManager();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, total_amount, discount_amount, tip_amount, status, start_time,
      customers!inner(id, full_name, phone, created_at)
    `)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .eq('status', 'COMPLETED')
    .limit(5000);

  if (!appointments) {
    return { topCustomers: [], customerStats: { total: 0, newCount: 0, returningCount: 0, avgVisits: 0 } };
  }

  const customerMap: Record<string, { id: string; name: string; phone: string; totalSpent: number; visits: number; firstVisit: string }> = {};
  const newCustomers = new Set<string>();

  for (const appt of appointments) {
    const c = appt.customers as any;
    if (!c?.id) continue;
    if (!customerMap[c.id]) {
      customerMap[c.id] = { id: c.id, name: c.full_name || 'N/A', phone: c.phone || '', totalSpent: 0, visits: 0, firstVisit: c.created_at || appt.start_time };
    }
    customerMap[c.id].totalSpent += (appt.total_amount || 0) - (appt.discount_amount || 0);
    customerMap[c.id].visits += 1;
  }

  const now = new Date();
  for (const c of Object.values(customerMap)) {
    const created = new Date(c.firstVisit);
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / 86400000);
    if (daysSinceCreated <= 30) newCustomers.add(c.id);
  }

  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 20)
    .map(c => ({ ...c, totalSpent: Math.round(c.totalSpent) }));

  const uniqueCustomers = Object.keys(customerMap).length;

  return {
    topCustomers,
    customerStats: {
      total: uniqueCustomers,
      newCount: newCustomers.size,
      returningCount: uniqueCustomers - newCustomers.size,
      avgVisits: uniqueCustomers > 0 ? Math.round((appointments.length / uniqueCustomers) * 10) / 10 : 0,
    },
  };
}

export async function getGrowthComparison(startDate: string, endDate: string, compareStartDate: string, compareEndDate: string) {
  await checkAdminOrManager();
  const supabase = await createClient();

  const fetchPeriod = async (s: string, e: string) => {
    const { data } = await supabase
      .from('appointments')
      .select('id, total_amount, discount_amount, tip_amount, start_time, status')
      .gte('start_time', s)
      .lte('start_time', e)
      .eq('status', 'COMPLETED')
      .limit(5000);
    if (!data) return { revenue: 0, count: 0, tip: 0, byDay: [] as { date: string; value: number }[] };
    let rev = 0;
    let tip = 0;
    const dayMap: Record<string, number> = {};
    for (const a of data) {
      rev += (a.total_amount || 0) - (a.discount_amount || 0);
      tip += a.tip_amount || 0;
      const d = a.start_time?.slice(0, 10);
      if (d) dayMap[d] = (dayMap[d] || 0) + (a.total_amount || 0) - (a.discount_amount || 0);
    }
    const byDay = Object.entries(dayMap).map(([date, value]) => ({ date, value: Math.round(value) })).sort((a, b) => a.date.localeCompare(b.date));
    return { revenue: Math.round(rev), count: data.length, tip: Math.round(tip), byDay };
  };

  const [current, previous] = await Promise.all([
    fetchPeriod(startDate, endDate),
    fetchPeriod(compareStartDate, compareEndDate),
  ]);

  const revenueChange = previous.revenue > 0 ? Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100 * 10) / 10 : 0;
  const countChange = previous.count > 0 ? Math.round(((current.count - previous.count) / previous.count) * 100 * 10) / 10 : 0;

  return {
    current,
    previous,
    revenueChange,
    countChange,
  };
}

export async function getThemeSettings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('seo_settings').select('theme_override, theme_particles_enabled').eq('id', 1).single();
    return {
      override: data?.theme_override || null,
      particlesEnabled: data?.theme_particles_enabled ?? true,
    };
  } catch {
    return { override: null, particlesEnabled: true };
  }
}

export async function saveThemeSettings(payload: { override: string | null; particlesEnabled: boolean }) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_settings').upsert({
      id: 1,
      theme_override: payload.override || null,
      theme_particles_enabled: payload.particlesEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getMascotSettings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('seo_settings').select('mascot_enabled, mascot_character, mascot_sound').eq('id', 1).single();
    return {
      enabled: data?.mascot_enabled ?? true,
      character: data?.mascot_character || 'min',
      soundEnabled: data?.mascot_sound ?? true,
    };
  } catch {
    return { enabled: true, character: 'min', soundEnabled: true };
  }
}

export async function saveMascotSettings(payload: { enabled: boolean; character: string; soundEnabled: boolean }) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_settings').upsert({
      id: 1,
      mascot_enabled: payload.enabled,
      mascot_character: payload.character,
      mascot_sound: payload.soundEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getAutoSeoConfig() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('auto_seo_config').select('*').eq('id', 1).single();
    return data || { enabled: false, schedule_days: ['THU'], schedule_hour: 20, topic_pool: [] };
  } catch {
    return { enabled: false, schedule_days: ['THU'], schedule_hour: 20, topic_pool: [] };
  }
}

export async function saveAutoSeoConfig(payload: {
  enabled: boolean; schedule_days: string[]; schedule_hour: number; topic_pool: string[];
}) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('auto_seo_config').upsert({
      id: 1, ...payload, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getAutoSeoHistory() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_articles')
      .select('id, created_at, topic, keywords, status, topic_source, blog_slug, published_at')
      .eq('topic_source', 'auto_seo')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id,
      createdAt: a.created_at,
      topic: a.topic,
      keywords: a.keywords,
      status: a.status,
      topicSource: a.topic_source,
      blogSlug: a.blog_slug,
      publishedAt: a.published_at,
    }));
  } catch {
    return [];
  }
}

// ===== V3.9 — Financial Dashboard (P&L, Cash Flow) =====

export async function getFinancialDashboard(startDateStr?: string, endDateStr?: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const now = new Date();

  const start = startDateStr ? new Date(startDateStr).toISOString() : startOfMonth(now).toISOString();
  const end = endDateStr ? new Date(endDateStr).toISOString() : endOfMonth(now).toISOString();

  const { data: appts } = await supabase
    .from('appointments')
    .select('total_amount, commission_amount, tip_amount, discount_amount, start_time, status')
    .eq('status', 'COMPLETED')
    .gte('start_time', start)
    .lte('start_time', end)
    .limit(5000);

  const totalRevenue = (appts || []).reduce((s, a: any) => s + (Number(a.total_amount) || 0), 0);
  const totalCommission = (appts || []).reduce((s, a: any) => s + (Number(a.commission_amount) || 0), 0);
  const totalTip = (appts || []).reduce((s, a: any) => s + (Number(a.tip_amount) || 0), 0);
  const totalDiscount = (appts || []).reduce((s, a: any) => s + (Number(a.discount_amount) || 0), 0);
  const totalOrders = (appts || []).length;
  const netProfit = totalRevenue - totalCommission - totalDiscount;

  // Monthly breakdown for cash flow chart
  const monthlyMap: Record<string, { revenue: number; commission: number; orders: number }> = {};
  (appts || []).forEach((a: any) => {
    const m = format(new Date(a.start_time), 'yyyy-MM');
    if (!monthlyMap[m]) monthlyMap[m] = { revenue: 0, commission: 0, orders: 0 };
    monthlyMap[m].revenue += Number(a.total_amount) || 0;
    monthlyMap[m].commission += Number(a.commission_amount) || 0;
    monthlyMap[m].orders += 1;
  });

  const monthlyCashFlow = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      commission: data.commission,
      netCashflow: data.revenue - data.commission,
      orders: data.orders,
    }));

  return { totalRevenue, totalCommission, totalTip, totalDiscount, totalOrders, netProfit, monthlyCashFlow };
}

// ===== V3.9 — Tax Report =====

export async function getTaxReport(year?: number) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const yearVal = year || new Date().getFullYear();

  const startISO = new Date(`${yearVal}-01-01T00:00:00+07:00`).toISOString();
  const endISO = new Date(`${yearVal}-12-31T23:59:59+07:00`).toISOString();

  const { data: appts } = await supabase
    .from('appointments')
    .select('total_amount, commission_amount, tip_amount, start_time, status')
    .eq('status', 'COMPLETED')
    .gte('start_time', startISO)
    .lte('start_time', endISO)
    .limit(10000);

  const monthlyData: Record<string, { revenue: number; orders: number; commission: number; tip: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${yearVal}-${String(m).padStart(2, '0')}`;
    monthlyData[key] = { revenue: 0, orders: 0, commission: 0, tip: 0 };
  }

  (appts || []).forEach((a: any) => {
    const m = format(new Date(a.start_time), 'yyyy-MM');
    if (monthlyData[m]) {
      monthlyData[m].revenue += Number(a.total_amount) || 0;
      monthlyData[m].orders += 1;
      monthlyData[m].commission += Number(a.commission_amount) || 0;
      monthlyData[m].tip += Number(a.tip_amount) || 0;
    }
  });

  const months = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = months.reduce((s, m) => s + m.orders, 0);

  return { year: yearVal, months, totalRevenue, totalOrders };
}

// ===== V3.9 — Cash Register (Sổ quỹ) =====

interface CashInput {
  type: 'THU' | 'CHI';
  category: string;
  amount: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
}

export async function getCashRegisterTransactions(month?: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const now = new Date();
  const ym = month || format(now, 'yyyy-MM');
  const startISO = new Date(`${ym}-01T00:00:00+07:00`).toISOString();
  const endISO = new Date(new Date(startISO).getFullYear(), new Date(startISO).getMonth() + 1, 1).toISOString();

  const { data: rows, error } = await supabase
    .from('cash_register')
    .select('*, users(full_name)')
    .gte('recorded_at', startISO)
    .lt('recorded_at', endISO)
    .eq('is_active', true)
    .order('recorded_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  const items = (rows || []).map((r: any) => ({
    id: r.id,
    type: r.type,
    category: r.category,
    amount: r.amount,
    description: r.description,
    referenceType: r.reference_type,
    referenceId: r.reference_id,
    recordedBy: r.users?.full_name || '',
    recordedAt: r.recorded_at,
  }));

  const totalThu = items.filter((i) => i.type === 'THU').reduce((s, i) => s + i.amount, 0);
  const totalChi = items.filter((i) => i.type === 'CHI').reduce((s, i) => s + i.amount, 0);
  const balance = totalThu - totalChi;

  return { items, totalThu, totalChi, balance };
}

export async function addCashTransaction(data: CashInput) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  const { error } = await supabase.from('cash_register').insert({
    type: data.type,
    category: data.category,
    amount: data.amount,
    description: data.description || '',
    reference_type: data.reference_type || null,
    reference_id: data.reference_id || null,
    recorded_by: session.user.id,
  });

  if (error) throw error;
}

export async function deleteCashTransaction(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  await supabase.from('cash_register').update({ is_active: false }).eq('id', id);
}

// ===== V3.14 — Payroll =====

interface StaffPayrollInfo {
  id: string;
  fullName: string;
  username: string;
  role: string;
  isActive: boolean;
  baseSalary: number;
  bankAccount: string | null;
  bankName: string | null;
}

interface PayrollStaffRow {
  staffId: string;
  fullName: string;
  baseSalary: number;
  totalCommission: number;
  totalTips: number;
  totalPackageCommission: number;
  totalSales: number;
  appointmentCount: number;
  absentDays: number;
  workingDays: number;
}

interface PayrollRecord {
  id: string;
  staffId: string;
  fullName: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  totalCommission: number;
  totalTips: number;
  totalPackageCommission: number;
  bonus: number;
  deduction: number;
  advance: number;
  netPay: number;
  status: string;
  notes: string | null;
  paidAt: string | null;
}

export async function getStaffPayrollInfo(): Promise<StaffPayrollInfo[]> {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('id, full_name, username, role, is_active, base_salary, bank_account, bank_name')
    .in('role', ['STAFF', 'MANAGER'])
    .order('full_name');
  return (data || []).map((u: any) => ({
    id: u.id,
    fullName: u.full_name,
    username: u.username,
    role: u.role,
    isActive: u.is_active,
    baseSalary: Number(u.base_salary) || 0,
    bankAccount: u.bank_account || null,
    bankName: u.bank_name || null,
  }));
}

export async function updateStaffSalary(staffId: string, baseSalary: number, bankAccount: string, bankName: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');
  const supabase = await createClient();
  const { error } = await supabase.from('users').update({
    base_salary: baseSalary,
    bank_account: bankAccount || null,
    bank_name: bankName || null,
  }).eq('id', staffId);
  if (error) throw error;
}

export async function calculatePayroll(periodStart: string, periodEnd: string): Promise<PayrollStaffRow[]> {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const staffs = await getStaffPayrollInfo();

  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  endDate.setHours(23, 59, 59, 999);

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  const result: PayrollStaffRow[] = [];

  for (const staff of staffs) {
    if (!staff.isActive) continue;

    // Commission + tips from completed appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('commission_amount, tip_amount, total_amount')
      .eq('staff_id', staff.id)
      .eq('status', 'COMPLETED')
      .gte('start_time', startISO)
      .lte('start_time', endISO);

    // Package commission from customer_packages sold in period
    const { data: packages } = await supabase
      .from('customer_packages')
      .select('commission_amount')
      .eq('sold_by_staff_id', staff.id)
      .gte('purchased_at', startISO)
      .lte('purchased_at', endISO);

    // Attendance: count working days vs absent days
    const { data: attendance } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('staff_id', staff.id)
      .gte('date', periodStart)
      .lte('date', periodEnd);

    const totalCommission = (appointments || []).reduce((s, a: any) => s + Number(a.commission_amount || 0), 0);
    const totalTips = (appointments || []).reduce((s, a: any) => s + Number(a.tip_amount || 0), 0);
    const totalPackageCommission = (packages || []).reduce((s, p: any) => s + Number(p.commission_amount || 0), 0);
    const totalSales = (appointments || []).reduce((s, a: any) => s + Number(a.total_amount || 0), 0);
    const appointmentCount = (appointments || []).length;
    const absentDays = (attendance || []).filter((a: any) => a.status === 'ABSENT').length;
    const workingDays = (attendance || []).length;

    result.push({
      staffId: staff.id,
      fullName: staff.fullName,
      baseSalary: staff.baseSalary,
      totalCommission: Math.round(totalCommission),
      totalTips: Math.round(totalTips),
      totalPackageCommission: Math.round(totalPackageCommission),
      totalSales: Math.round(totalSales),
      appointmentCount,
      absentDays,
      workingDays,
    });
  }

  return result;
}

export async function getSalaryPayments(periodStart: string, periodEnd: string): Promise<PayrollRecord[]> {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from('salary_payments')
    .select('*, users!staff_id(full_name)')
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd)
    .order('created_at', { ascending: false });

  return (data || []).map((p: any) => ({
    id: p.id,
    staffId: p.staff_id,
    fullName: p.users?.full_name || '',
    periodStart: p.period_start,
    periodEnd: p.period_end,
    baseSalary: Number(p.base_salary),
    totalCommission: Number(p.total_commission),
    totalTips: Number(p.total_tips),
    totalPackageCommission: Number(p.total_package_commission),
    bonus: Number(p.bonus),
    deduction: Number(p.deduction),
    advance: Number(p.advance),
    netPay: Number(p.net_pay),
    status: p.status,
    notes: p.notes,
    paidAt: p.paid_at,
  }));
}

export async function savePayrollCalculations(
  periodStart: string,
  periodEnd: string,
  rows: PayrollStaffRow[]
) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  for (const row of rows) {
    const netPay = row.baseSalary + row.totalCommission + row.totalTips + row.totalPackageCommission;

    const { error } = await supabase.from('salary_payments').insert({
      staff_id: row.staffId,
      period_start: periodStart,
      period_end: periodEnd,
      base_salary: row.baseSalary,
      total_commission: row.totalCommission,
      total_tips: row.totalTips,
      total_package_commission: row.totalPackageCommission,
      bonus: 0,
      deduction: 0,
      advance: 0,
      net_pay: netPay,
      status: 'PENDING',
    });
    if (error) console.error(`[PAYROLL] Failed to save ${row.fullName}:`, error);
  }
}

export async function processPayrollPayment(id: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from('salary_payments')
    .select('*, users!staff_id(full_name)')
    .eq('id', id)
    .single();

  if (!payment) throw new Error('Không tìm thấy bản ghi lương');
  if (payment.status === 'PAID') throw new Error('Kỳ lương này đã được thanh toán');

  const fullName = (payment.users as any)?.full_name || 'Nhân viên';

  // Update payment status
  const { error: updateError } = await supabase
    .from('salary_payments')
    .update({ status: 'PAID', paid_at: new Date().toISOString(), paid_by: session.user.id })
    .eq('id', id);
  if (updateError) throw updateError;

  // Record in cash register
  const { error: cashError } = await supabase.from('cash_register').insert({
    type: 'CHI',
    category: 'Chi lương',
    amount: payment.net_pay,
    description: `Lương ${fullName} - ${payment.period_start} đến ${payment.period_end}`,
    reference_type: 'salary_payment',
    reference_id: payment.id,
    recorded_by: session.user.id,
  });
  if (cashError) throw cashError;
}

// Backup tables in FK-safe order
const BACKUP_TABLES = [
  'users', 'customers', 'services', 'treatment_packages', 'staff_skills',
  'bank_settings', 'banner_settings', 'seo_settings', 'auto_seo_config',
  'ai_cache', 'rate_limits', 'slot_limits',
  'appointments', 'customer_packages', 'reviews', 'blogs', 'seo_articles',
  'notifications', 'tasks', 'cash_register', 'appointment_services',
  'package_usage_logs', 'audit_logs', 'blog_views', 'blog_stats',
  'attendance', 'time_slot_locks', 'auto_assign_logs', 'cron_job_logs',
  'background_tasks', 'salary_payments',
  'attendance_reminders_log', 'random_booking_reminders_log',
  'unaccepted_booking_reminders_log', 'uncompleted_booking_reminders_log',
];

export async function backupDatabase() {
  await checkAdmin();
  const supabase = await createClient();
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push('-- Min Nail & Hair Database Backup');
  lines.push(`-- Generated: ${now}`);
  lines.push('-- ================================================');
  lines.push('');

  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      lines.push(`-- Skipping ${table}: ${error.message}`);
      continue;
    }
    if (!data || data.length === 0) {
      lines.push(`-- ${table}: 0 rows`);
      continue;
    }
    lines.push(`-- ${table}: ${data.length} rows`);
    for (const row of data) {
      const cols = Object.keys(row);
      const vals = cols.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (typeof v === 'number') return String(v);
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      lines.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
    }
    lines.push('');
  }

  return { success: true, sql: lines.join('\n'), count: BACKUP_TABLES.length } as const;
}

// ====== FAQ CRUD (V3.15) ======

export async function getFaqs() {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function createFaq(payload: {
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();

  const { error } = await supabase
    .from('faqs')
    .insert({
      question: payload.question,
      answer: payload.answer,
      category: payload.category || 'general',
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    });
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function updateFaq(id: string, updates: Partial<{
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}>) {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();

  const { error } = await supabase
    .from('faqs')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function deleteFaq(id: string) {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();

  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin');
}

export async function reorderFaqs(sortedIds: string[]) {
  const session = await getSession();
  if (!session) redirect('/login');
  const supabase = await createClient();

  const updates = sortedIds.map((id, idx) => ({ id, sort_order: idx }));
  const { error } = await supabase
    .from('faqs')
    .upsert(updates, { onConflict: 'id' });
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function getStaffSkills(staffId: string) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_skills')
    .select('*, services(name)')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveStaffSkill(skillData: {
  staff_id: string;
  service_id: string;
  skill_level: number;
  certificate_name?: string;
  certificate_url?: string;
  is_active: boolean;
}) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const { error } = await supabase
    .from('staff_skills')
    .upsert({
      staff_id: skillData.staff_id,
      service_id: skillData.service_id,
      skill_level: skillData.skill_level,
      certificate_name: skillData.certificate_name,
      certificate_url: skillData.certificate_url,
      is_active: skillData.is_active,
    }, { onConflict: 'staff_id,service_id' });
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function deleteStaffSkill(skillId: string) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const { error } = await supabase
    .from('staff_skills')
    .delete()
    .eq('id', skillId);
  if (error) throw error;
  revalidatePath('/admin');
  return { success: true };
}
