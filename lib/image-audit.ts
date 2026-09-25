import { createServiceClient } from '@/utils/supabase/server'

function normalizeId(url: string): string {
  const m = url.match(/photo-[a-f0-9-]+/i)
  if (m) return m[0].toLowerCase()
  const m2 = url.match(/photos\/\d+/i)
  if (m2) return m2[0].toLowerCase()
  return url.split('?')[0].toLowerCase()
}

// Map known Unsplash photoId to theme (dựa trên pool trong image-suggestions)
const THEME_BY_PHOTO: Record<string, string> = {
  // NAILS
  'photo-1604654894610-df63bc536371': 'nails',
  'photo-1519014816548-bf5fe059798b': 'nails',
  'photo-1604654894611-6973b376cbde': 'nails',
  'photo-1735236007245-9dc6e28bbe56': 'nails',
  'photo-1519699047748-de8e457a634e': 'nails',
  'photo-1560066984-138dadb4c035': 'general', // appears in multiple pools -> treat as general
  'photo-1595475884562-073c30d45670': 'nails',
  'photo-1527799820374-dcf8d9d4a388': 'nails',
  // HAIRCARE
  'photo-1526947425960-945c6e72858f': 'haircare',
  'photo-1717160675643-53a7a2ebaa9f': 'haircare',
  'photo-1570172619644-dfd03ed5d881': 'general',
  'photo-1487412947147-5cebf100ffc2': 'general',
  // MASSAGE / SPA
  'photo-1600334089648-b0d9d3028eb2': 'massage',
  'photo-1600334129128-685c5582fd35': 'massage',
  'photo-1519824145371-296894a0daa9': 'massage',
  'photo-1544161515-4ab6ce6db874': 'massage',
  'photo-1540555700478-4be289fbecef': 'spa',
  'photo-1591343395082-e120087004b4': 'massage',
  'photo-1515378791036-0648a3ef77b2': 'massage',
}

function topicTheme(topic: string): string {
  const t = topic.toLowerCase()
  if (/nail|móng|sơn gel|pedicure|manicure|nail art/gi.test(t)) return 'nails'
  if (/gội.*dưỡng sinh|dưỡng sinh|gội đầu|tóc|hair|uốn tóc|duỗi/gi.test(t)) return 'haircare'
  if (/massage|bấm huyệt|vai gáy|body/gi.test(t)) return 'massage'
  if (/spa|xông hơi/gi.test(t)) return 'spa'
  if (/da mặt|mụn|nám|facial|dưỡng da/gi.test(t)) return 'facial'
  if (/trang điểm|makeup/gi.test(t)) return 'makeup'
  return 'general'
}

export async function auditImageDuplicates(): Promise<{ photoId: string; count: number; urls: string[]; titles: string[] }[]> {
  const supabase = await createServiceClient()
  const [blogsRes, svcRes] = await Promise.all([
    supabase.from('blogs').select('title, slug, image_url').limit(500),
    supabase.from('services').select('name, image_url').limit(200),
  ])
  const map = new Map<string, { count: number; urls: Set<string>; titles: string[] }>()
  const all: { title: string; url: string }[] = []
  if (blogsRes.data) blogsRes.data.forEach((r: any) => { if (r.image_url) all.push({ title: r.title, url: r.image_url }) })
  if (svcRes.data) svcRes.data.forEach((r: any) => { if (r.image_url) all.push({ title: r.name, url: r.image_url }) })
  for (const item of all) {
    const id = normalizeId(item.url)
    const entry = map.get(id) || { count: 0, urls: new Set(), titles: [] }
    entry.count++
    entry.urls.add(item.url)
    entry.titles.push(item.title)
    map.set(id, entry)
  }
  const dups = Array.from(map.entries())
    .filter(([, v]) => v.count > 1)
    .map(([photoId, v]) => ({ photoId, count: v.count, urls: Array.from(v.urls), titles: v.titles.slice(0, 5) }))
    .sort((a, b) => b.count - a.count)
  return dups
}

export async function auditOffTopicImages(): Promise<{ title: string; slug?: string; image_url: string; expected: string; actual: string }[]> {
  const supabase = await createServiceClient()
  const { data: blogs } = await supabase.from('blogs').select('title, slug, image_url').limit(200)
  const off: { title: string; slug?: string; image_url: string; expected: string; actual: string }[] = []
  for (const b of blogs || []) {
    if (!b.image_url) continue
    const expected = topicTheme(b.title)
    const id = normalizeId(b.image_url)
    const actual = THEME_BY_PHOTO[id] || 'unknown'
    // chỉ flag khi expected là nails/haircare/massage nhưng actual lệch rõ
    if (expected !== 'general' && actual !== 'general' && actual !== 'unknown' && expected !== actual) {
      // cho phép haircare <-> spa gần nhau không flag quá gắt
      const isNear = (expected === 'haircare' && actual === 'spa') || (expected === 'spa' && actual === 'haircare')
      if (!isNear) off.push({ title: b.title, slug: b.slug, image_url: b.image_url, expected, actual })
    }
  }
  return off
}

export async function getUnusedImageCandidates(count = 4, topic?: string): Promise<string[]> {
  // trả về danh sách photoId chưa dùng để gợi ý tìm mới
  const { getUsedImageIds } = await import('./image-search')
  const used = await getUsedImageIds()
  const { FALLBACK_IMAGES } = await import('./fallback-images')
  const unused = FALLBACK_IMAGES.filter(u => !used.has(normalizeId(u)) && !used.has(u.split('?')[0].toLowerCase()))
  if (topic) {
    // ưu tiên pool theo topic
    const { getSuggestedImages } = await import('./image-suggestions')
    const suggested = getSuggestedImages(topic, count * 3)
    const filtered = suggested.images.filter(u => !used.has(normalizeId(u)))
    if (filtered.length >= count) return filtered.slice(0, count)
    return [...filtered, ...unused].slice(0, count)
  }
  return unused.slice(0, count)
}
