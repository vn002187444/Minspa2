'use server'

import sharp from 'sharp';
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "@/utils/audit";

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
      .lte('start_time', endRange);

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
      .order('date', { ascending: false });

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
      .order('start_time', { ascending: true });

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
      } catch (chartErr) {
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
  } catch (error) {
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
      .order('created_at', { ascending: false });
    if (error) throw error;
    console.log('Fetched staff count:', data?.length);
    return data || [];
  } catch (error: any) {
    if (error?.code === '42703') {
      console.warn('is_active column missing from users table, retrying query without it');
      const { data, error: err2 } = await supabase.from('users')
        .select('id, username, full_name, role, cccd, created_at')
        .in('role', ['STAFF', 'MANAGER'])
        .order('created_at', { ascending: false });
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

export async function createStaff(staffData: any) {
  await checkAdminOrManager();
  const supabase = await createClient();
  const { error } = await supabase.from('users').insert({
    role: staffData.role || 'STAFF',
    username: (staffData.username || '').trim().toLowerCase(),
    password_hash: (staffData.password || '').trim(),
    full_name: (staffData.fullName || '').trim(),
    cccd: (staffData.cccd || '').trim()
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateStaff(staffId: string, staffData: any) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  const updates: any = {
    username: staffData.username,
    full_name: staffData.full_name,
    cccd: staffData.cccd,
  };
  if (staffData.role) updates.role = staffData.role;
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
  const { error } = await supabase.from('users').update({
    password_hash: '123456'
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
      .lte('start_time', endMonth);

    if (err1) throw err1;

    const { data: attendance, error: err2 } = await supabase
      .from('attendance')
      .select('id, date, status, check_in_time, check_out_time')
      .eq('staff_id', staffId)
      .gte('date', format(new Date(startMonth), 'yyyy-MM-dd'))
      .lte('date', format(new Date(endMonth), 'yyyy-MM-dd'));

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
  } catch (error) {
    return { totalRevenue: 0, totalCommission: 0, totalTip: 0, daysPresent: 0, daysAbsent: 0, topCustomers: [], topServices: [], totalCompleted: 0 };
  }
}

export async function getServices() {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from('services').select('id, name, category, price, duration, description, is_active').order('category', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function saveService(serviceData: any) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();
  let imageUrl = serviceData.image_url;
  if (imageUrl && imageUrl.startsWith('data:')) {
    imageUrl = await uploadBase64ToStorage(imageUrl);
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
      .update({ is_active: false })
      .eq('id', staffId);

    if (updateErr) throw updateErr;

    await logAuditAction(session.user.id, "SOFT_DELETE_STAFF", `Ẩn nhân viên: '${staffName}'`);

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: 'Đã ẩn nhân viên thành công.' };
  } catch (err: any) {
    return { success: false, error: err.message };
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
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getSeoSettings() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('seo_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    if (data) {
      return {
        page_title: data.page_title,
        meta_description: data.meta_description,
        meta_keywords: data.meta_keywords,
        og_image_url: data.og_image_url,
        online_discount_enabled: data.online_discount_enabled !== false,
        online_discount_percent: data.online_discount_percent ?? 5,
      };
    }
  } catch (e) {
    console.error(e);
  }
  return { page_title: '', meta_description: '', meta_keywords: '', og_image_url: '', online_discount_enabled: true, online_discount_percent: 5 };
}

export async function saveSeoSettings(payload: any) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_settings').upsert({
      id: 1,
      page_title: payload.page_title,
      meta_description: payload.meta_description,
      meta_keywords: payload.meta_keywords,
      og_image_url: payload.og_image_url,
      online_discount_enabled: payload.online_discount_enabled !== false,
      online_discount_percent: payload.online_discount_percent ?? 5,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

export async function getSeoArticles() {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id,
      createdAt: a.created_at,
      topic: a.topic,
      keywords: a.keywords,
      article: a.article,
      imageUrl: a.image_url,
    }));
  } catch (e) {
    console.error(e);
  }
  return [];
}

async function uploadBase64ToStorage(base64Url: string): Promise<string> {
  if (!base64Url || !base64Url.startsWith('data:')) return base64Url;
  const matches = base64Url.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return base64Url;
  const base64Data = matches[2];
  const raw = Buffer.from(base64Data, 'base64');
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

export async function saveSeoArticle(article: any) {
  await checkAdminOrManager();
  try {
    const imageUrl = await uploadBase64ToStorage(article.image_url || '');
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
          topic: article.topic,
          keywords: article.keywords,
          article: article.article,
          image_url: imageUrl,
        })
        .eq('id', article.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('seo_articles')
        .insert({
          id: article.id || 'art_' + Math.random().toString(36).substring(2, 11),
          topic: article.topic,
          keywords: article.keywords,
          article: article.article,
          image_url: imageUrl,
          created_at: article.createdAt || new Date().toISOString(),
        });
      if (error) throw error;
    }
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

export async function deleteSeoArticle(id: string) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('seo_articles').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

export async function publishSeoArticleToBlog(articleText: string, imageUrl: string) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }

  const titleMatch = articleText.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Bài viết SEO';

  const firstParagraph = articleText.replace(/^#\s+.+\n*/m, '').match(/^(.+?)(?:\n\n|$)/m);
  const summary = firstParagraph ? firstParagraph[1].replace(/\*\*/g, '').trim().substring(0, 300) : title;

  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200) || 'bai-viet-seo-' + Date.now();

  const finalImageUrl = await uploadBase64ToStorage(imageUrl || '');
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('blogs')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return { success: false, error: `Slug "${slug}" đã tồn tại. Vui lòng đổi tiêu đề hoặc đăng bằng trình soạn thảo Blog.` };
  }

  const { error } = await supabase.from('blogs').insert({
    title,
    slug,
    summary,
    content: articleText,
    image_url: finalImageUrl || 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop',
    created_at: new Date().toISOString(),
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
      .order('start_time', { ascending: false });

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
      .lte('purchased_at', endDateStr);

    // Get all staff to ensure we list everyone even if they have 0 appointments
    const { data: staffList } = await supabase
      .from('users')
      .select('id, full_name, username')
      .eq('role', 'STAFF');

    const staffMap: Record<string, any> = {};
    if (staffList) {
      staffList.forEach((s: any) => {
        staffMap[s.id] = {
          staffId: s.id,
          fullName: s.full_name || s.username || 'N/A',
          username: s.username,
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
  } catch (error: any) {
    console.error("Commission Report aggregation error:", error);
    return { success: false, error: error.message || 'Lỗi khi lấy báo cáo hoa hồng' };
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
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function saveTreatmentPackage(packageData: any) {
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
    const { id, services, ...updateData } = dataToSave;
    const { error } = await supabase.from('treatment_packages').update(updateData).eq('id', id);
    if (error) return { success: false, error: error.message };
    await logAuditAction(session.user.id, "EDIT_PACKAGE", `Sửa gói liệu trình '${updateData.name}'`);
  } else {
    const { services, ...insertData } = dataToSave;
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
  } catch (err: any) {
    return { success: false, error: err.message };
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
  const { error: insertErr } = await supabase.from('customer_packages').insert({
    customer_id: customer.id,
    package_id: pkg.id,
    total_sessions: pkg.total_sessions,
    remaining_sessions: pkg.total_sessions,
    status: 'ACTIVE',
    purchased_at: new Date().toISOString(),
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
    const { data, error } = await supabase.from('bank_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    if (data) {
      return {
        bank_id: data.bank_id,
        bank_name: data.bank_name,
        account_number: data.account_number,
        account_owner: data.account_owner,
      };
    }
  } catch (e) {
    console.error(e);
  }
  return { bank_id: 'vcb', bank_name: 'Vietcombank', account_number: '', account_owner: '' };
}

export async function saveBankSettings(payload: any) {
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
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
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

  const { data, error } = await query.order('start_time', { ascending: false });
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
  } catch (error: any) {
    console.error('deleteAppointment Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getAdminSessionInfo() {
  const session = await getSession();
  if (!session) return null;
  return session.user;
}

export async function getBannerSettings() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('banner_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    if (data) {
      return {
        is_enabled: data.is_enabled,
        content: data.content,
      };
    }
  } catch (e) {
    console.error(e);
  }
  return { is_enabled: true, content: '✨ GIẢM NGAY 5% KHI ĐẶT LỊCH HẸN TRỰC TUYẾN ✨ HOTLINE: 0934 323 878' };
}

export async function saveBannerSettings(payload: any) {
  await checkAdminOrManager();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('banner_settings').upsert({
      id: 1,
      is_enabled: payload.is_enabled,
      content: payload.content,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
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
    .eq('customer_id', customer.id);
    
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
        .order('used_at', { ascending: false });
        
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



