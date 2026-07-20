'use server'

import { createClient } from "@/utils/supabase/server";
import { stripHtml } from "@/lib/sanitize";
import { getSeoSettings } from '@/lib/seo';

export async function getPublicServices() {
  const supabase = await createClient();
  const { data } = await supabase.from('services').select('id, name, category, price, duration, description, image_url, is_active').eq('is_active', true);
  return (data || []).map(s => ({
    ...s,
    name: stripHtml(s.name || ''),
    description: stripHtml(s.description || ''),
  }));
}

export async function getPublicSeoSettings() {
  const seo = await getSeoSettings();
  return {
    discountEnabled: seo.online_discount_enabled !== false,
    discountPercent: Number(seo.online_discount_percent) || 5,
    defaultCommissionPercent: Number(seo.default_commission_percent) || 15,
    hotline: seo.hotline || '0934 323 878',
  };
}

export async function getPublicPackages() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('treatment_packages')
    .select('id, name, buy_count, free_count, price, total_sessions, service_id, services(name, price)')
    .eq('is_active', true);
  return data || [];
}
