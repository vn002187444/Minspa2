import { createClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';
import { normalizeNFC } from '@/lib/utils';

export interface SeoSettings {
  page_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image_url: string | null;
  logo_url: string | null;
  hotline: string | null;
  facebook_url: string | null;
  zalo_url: string | null;
  online_discount_enabled: boolean | null;
  online_discount_percent: number | null;
  default_commission_percent: number | null;
}

const DEFAULT_SEO: SeoSettings = {
  page_title: null,
  meta_description: null,
  meta_keywords: null,
  og_image_url: null,
  logo_url: null,
  hotline: null,
  facebook_url: null,
  zalo_url: null,
  online_discount_enabled: null,
  online_discount_percent: null,
  default_commission_percent: null,
};

export async function getSeoSettings(): Promise<SeoSettings> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from('seo_settings')
        .select('*')
        .eq('id', 1)
        .single();
      return normalizeNFC<SeoSettings>(data ?? DEFAULT_SEO);
    },
    ['seo-settings'],
    { revalidate: 3600 }
  )();
}

export function formatHotline(hotline: string | null): string {
  return hotline || '0934 323 878';
}

export function formatDiscount(data: { online_discount_enabled: boolean | null; online_discount_percent: number | null }) {
  return {
    discountEnabled: data.online_discount_enabled !== false,
    discountPercent: Number(data.online_discount_percent) || 5,
  };
}

const SECTION_KEYWORDS: Record<string, string[]> = {
  "Làm đẹp & Sức khỏe": ["làm đẹp", "sức khỏe", "beauty", "health", "wellness", "spa", "chăm sóc da"],
  "Nail & Móng": ["nail", "móng", "sơn gel", "mắt mèo", "cắt da", "chà gót"],
  "Gội dưỡng sinh": ["gội", "dưỡng sinh", "massage đầu", "thảo dược"],
  "Massage & Thư giãn": ["massage", "thư giãn", "body", "relax"],
};

export function detectArticleSection(keywords: string | null, _content?: string): string {
  if (!keywords) return "Làm đẹp & Sức khỏe";
  const lower = keywords.toLowerCase();
  for (const [section, kws] of Object.entries(SECTION_KEYWORDS)) {
    if (kws.some(kw => lower.includes(kw))) return section;
  }
  return "Làm đẹp & Sức khỏe";
}
