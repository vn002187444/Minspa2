'use server'

import { createClient } from "@/utils/supabase/server";

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
