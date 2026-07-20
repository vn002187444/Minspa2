export const SERVICE_CATEGORIES = [
  'Deal Chấn Động',
  'Gội dưỡng sinh',
  'Chà Gót Chân',
  'Massage',
  'Chăm Sóc & Trang Trí Móng',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export function normalizeServiceCategory(category: string | null | undefined): string {
  const cat = (category || '').trim();

  if (cat === 'Móng' || cat.toLowerCase().includes('móng') || cat.toLowerCase().includes('nail')) {
    return 'Chăm Sóc & Trang Trí Móng';
  }
  if (cat === 'Deal' || cat.toLowerCase().includes('deal')) {
    return 'Deal Chấn Động';
  }
  if (cat === 'Gội Dưỡng Sinh' || cat === 'Gội ') {
    return 'Gội dưỡng sinh';
  }
  return cat || 'Khác';
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  duration?: number;
  description?: string;
  image_url?: string;
}

export function groupServicesByCategory(services: ServiceItem[]): Record<string, ServiceItem[]> {
  const grouped: Record<string, ServiceItem[]> = {};

  for (const service of services) {
    const cat = normalizeServiceCategory(service.category);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(service);
  }

  return grouped;
}
