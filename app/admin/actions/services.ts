'use server'

import {
  createClient, getSession, revalidatePath, logAuditAction,
  checkAdminOrManager, ServiceInput, PackageInput,
} from "./_shared";
import { logger } from "@/lib/logger";

export async function getServices() {
  await checkAdminOrManager();
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from('services').select('id, name, category, price, duration, description, image_url, commission_percentage, commission_amount, is_active').order('category', { ascending: true }).limit(200);
    if (error) throw error;
    return data || [];
  } catch (e) {
    logger.error('[Database] Failed to fetch services', e instanceof Error ? e : undefined);
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
  } catch (e) {
    logger.error('[Database] Failed to fetch packages', e instanceof Error ? e : undefined);
    return [];
  }
}

export async function saveTreatmentPackage(packageData: PackageInput) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient();

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

  const { data: pkg } = await supabase.from('treatment_packages').select('id, name, total_sessions, price, commission_percentage').eq('id', packageId).single();
  if (!pkg) return { success: false, error: 'Không tìm thấy gói liệu trình' };

  const price = Number(pkg.price) || 0;
  const commPercent = pkg.commission_percentage !== undefined && pkg.commission_percentage !== null ? Number(pkg.commission_percentage) : 10;
  const commission_amount = Math.round(price * (commPercent / 100));

  const expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
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

export async function getCustomerPackageProgress(phone: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const supabase = await createClient();
  const cleanedPhone = phone.trim().replace(/\s+/g, "");

  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('phone', cleanedPhone)
    .maybeSingle();

  if (!customer) {
    return { success: false, error: 'Không tìm thấy khách hàng nào với số điện thoại này.' };
  }

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

export async function listStorageImages(folder = '') {
  await checkAdminOrManager();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('service-images').list(folder, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) throw error;

  return (data || []).map(file => ({
    name: file.name,
    url: supabase.storage.from('service-images').getPublicUrl(file.name).data.publicUrl,
    created_at: file.created_at,
    metadata: file.metadata,
  }));
}

export async function uploadBase64ToStorage(base64Url: string): Promise<string> {
  if (!base64Url || !base64Url.startsWith('data:')) return base64Url;
  const matches = base64Url.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return base64Url;
  const base64Data = matches[2];
  const ext = matches[1] === 'png' ? 'png' : 'jpeg';
  const raw = Buffer.from(base64Data, 'base64');
  if (raw.length > 5242880) {
    console.warn('[STORAGE] Rejected upload >5MB:', raw.length, 'bytes');
    throw new Error('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
  }
  let optimized: Buffer;
  let contentType: string;
  try {
    const sharp = (await import('sharp')).default;
    try {
      optimized = await sharp(raw).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      contentType = 'image/webp';
    } catch {
      try { optimized = await sharp(raw).webp({ quality: 80 }).toBuffer(); contentType = 'image/webp'; } catch { throw new Error('Sharp failed'); }
    }
  } catch {
    console.warn('[STORAGE] Sharp not available, uploading raw image');
    optimized = raw;
    contentType = `image/${ext}`;
  }
  if (optimized.length > 5242880) {
    console.warn('[STORAGE] Optimized image still >5MB:', optimized.length, 'bytes');
    throw new Error('Ảnh quá lớn ngay cả sau khi tối ưu!');
  }
  const fileName = `svc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${contentType === 'image/webp' ? 'webp' : ext}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from('service-images').upload(fileName, optimized, { contentType, upsert: true });
  if (error) {
    logger.error('[STORAGE UPLOAD ERROR]', error instanceof Error ? error : undefined);
    throw new Error('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
  }
  const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function uploadImageAction(base64Data: string): Promise<string> {
  await checkAdminOrManager();
  return await uploadBase64ToStorage(base64Data);
}
