import { getSuggestedImages } from './image-suggestions'
import { ensureGeoAlt, translateAltToVietnamese } from './image-alt'

const TIMEOUT_MS = 5000

// --- DEDUP helpers ---
function normalizePhotoId(url: string): string {
  // Unsplash: https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800...
  // Pexels: https://images.pexels.com/photos/12345/...
  const m = url.match(/photo-[a-f0-9-]+/i)
  if (m) return m[0].toLowerCase()
  const m2 = url.match(/photos\/\d+/i)
  if (m2) return m2[0].toLowerCase()
  // fallback: base without query
  return url.split('?')[0].toLowerCase()
}

let usedCache: { ts: number; set: Set<string> } | null = null
const USED_CACHE_TTL = 5 * 60 * 1000 // 5 phút

export async function getUsedImageIds(): Promise<Set<string>> {
  const now = Date.now()
  if (usedCache && now - usedCache.ts < USED_CACHE_TTL) return usedCache.set
  const ids = new Set<string>()
  try {
    const { createServiceClient } = await import('@/utils/supabase/server')
    const supabase = await createServiceClient()
    const [blogsRes, servicesRes] = await Promise.all([
      supabase.from('blogs').select('image_url').limit(500),
      supabase.from('services').select('image_url').limit(200),
    ])
    const urls: string[] = []
    if (blogsRes.data) urls.push(...blogsRes.data.map((r: any) => r.image_url).filter(Boolean))
    if (servicesRes.data) urls.push(...servicesRes.data.map((r: any) => r.image_url).filter(Boolean))
    urls.forEach(u => ids.add(normalizePhotoId(u)))
    // also include raw urls for exact match
    urls.forEach(u => ids.add(u.toLowerCase().split('?')[0]))
  } catch {}
  usedCache = { ts: now, set: ids }
  return ids
}

function filterUnused(images: string[], alts: string[], used: Set<string>): { images: string[]; alts: string[] } {
  const outImgs: string[] = []
  const outAlts: string[] = []
  for (let i = 0; i < images.length; i++) {
    const id = normalizePhotoId(images[i])
    const base = images[i].split('?')[0].toLowerCase()
    if (!used.has(id) && !used.has(base)) {
      outImgs.push(images[i])
      outAlts.push(alts[i])
    }
  }
  return { images: outImgs, alts: outAlts }
}

export async function searchUnsplash(query: string, page: number = 1, perPage: number = 8): Promise<{ images: string[]; alts: string[] } | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const resp = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(TIMEOUT_MS) }
    )
    if (!resp.ok) return null
    const data: { results?: { urls: { raw: string; full: string; regular: string; small: string; thumb: string }; alt_description: string | null; description: string | null }[] } = await resp.json()
    if (!data.results?.length) return null
    const images = data.results.map(r => r.urls.small)
    const alts = data.results.map(r => r.alt_description || r.description || query.substring(0, 100))
    return { images, alts }
  } catch {
    return null
  }
}

export async function searchPexels(query: string, page: number = 1, perPage: number = 8): Promise<{ images: string[]; alts: string[] } | null> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  try {
    const resp = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(TIMEOUT_MS) }
    )
    if (!resp.ok) return null
    const data: { photos?: { src: { medium: string }; alt: string | null }[] } = await resp.json()
    if (!data.photos?.length) return null
    const images = data.photos.map(p => p.src.medium)
    const alts = data.photos.map(p => p.alt || query.substring(0, 100))
    return { images, alts }
  } catch {
    return null
  }
}

// Map Vietnamese beauty topics to English Unsplash queries for better results
function toUnsplashQuery(topic: string): string {
  const t = topic.toLowerCase()
  if (/nail|móng|sơn gel|pedicure|manicure|nail art/gi.test(t)) return 'nail art manicure'
  if (/gội.*dưỡng sinh|dưỡng sinh|gội đầu/gi.test(t)) return 'hair wash head spa massage'
  if (/tóc|hair|uốn tóc|duỗi|nhuộm tóc|tạo kiểu/gi.test(t)) return 'hair salon haircut'
  if (/massage|bấm huyệt|vai gáy|body/gi.test(t)) return 'massage spa hot stone'
  if (/spa|xông hơi|tắm bùn/gi.test(t)) return 'spa wellness beauty'
  if (/da mặt|mụn|nám|facial|dưỡng da|serum/gi.test(t)) return 'facial skincare beauty'
  if (/trang điểm|makeup|mỹ phẩm|son môi|cô dâu/gi.test(t)) return 'makeup beauty cosmetics'
  // fallback: strip diacritics and use first 3 keywords + beauty context
  const plain = topic.replace(/[^a-zA-Z0-9À-ỹ ]/g, '').trim().substring(0, 60)
  return plain || 'beauty salon spa'
}

async function enrichAlts(alts: string[], topic: string): Promise<string[]> {
  // Song ngữ + Việt hoá: dịch EN sang VI (cached) rồi enforce GEO
  const enriched = await Promise.all(
    alts.map(async (a) => {
      const vi = await translateAltToVietnamese(a, topic)
      return ensureGeoAlt(vi, topic)
    })
  )
  return enriched
}

export async function searchImages(topic: string, count = 4, opts?: { excludeUsed?: boolean }): Promise<{ images: string[]; imageAlts: string[] }> {
  const excludeUsed = opts?.excludeUsed !== false // mặc định bật dedup
  const used = excludeUsed ? await getUsedImageIds() : new Set<string>()
  const need = count

  // Helper thử Unsplash với paging + lọc trùng, trả về đủ số lượng
  async function tryUnsplash(query: string): Promise<{ images: string[]; alts: string[] } | null> {
    // random page 1-5 để tránh luôn trả về top 4 ảnh hot
    const pages = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5)
    for (const page of pages.slice(0, 3)) { // thử tối đa 3 page
      const res = await searchUnsplash(query, page, 12)
      if (!res) continue
      let filtered = excludeUsed ? filterUnused(res.images, res.alts, used) : res
      if (filtered.images.length >= need) {
        // shuffle sau khi lọc để không luôn lấy cùng thứ tự
        const idxs = filtered.images.map((_, i) => i).sort(() => Math.random() - 0.5)
        const pickedImgs = idxs.slice(0, need).map(i => filtered.images[i])
        const pickedAlts = idxs.slice(0, need).map(i => filtered.alts[i])
        return { images: pickedImgs, alts: pickedAlts }
      }
      if (filtered.images.length > 0 && page === pages[1]) {
        // nếu sau 2 page vẫn không đủ, trả những gì có (sẽ bổ sung từ fallback)
        return filtered
      }
    }
    return null
  }

  const englishQuery = toUnsplashQuery(topic)

  // 1. Unsplash với query tiếng Anh (relevance cao nhất)
  const unsplashEn = await tryUnsplash(englishQuery)
  if (unsplashEn && unsplashEn.images.length >= need) {
    const alts = await enrichAlts(unsplashEn.alts.slice(0, need), topic)
    return { images: unsplashEn.images.slice(0, need), imageAlts: alts }
  }
  // nếu thu được 1 phần, giữ lại để bổ sung
  let collectedImgs: string[] = unsplashEn?.images || []
  let collectedAlts: string[] = unsplashEn?.alts || []

  // 2. Unsplash với raw query (nếu khác)
  const rawQuery = topic.replace(/[^a-zA-Z0-9À-ỹ ]/g, '').trim().substring(0, 100)
  if (rawQuery !== englishQuery) {
    const unsplashRaw = await tryUnsplash(rawQuery)
    if (unsplashRaw) {
      const filt = filterUnused(unsplashRaw.images, unsplashRaw.alts, new Set([...used, ...collectedImgs.map(normalizePhotoId)]))
      collectedImgs.push(...filt.images)
      collectedAlts.push(...filt.alts)
      if (collectedImgs.length >= need) {
        const alts = await enrichAlts(collectedAlts.slice(0, need), topic)
        return { images: collectedImgs.slice(0, need), imageAlts: alts }
      }
    }
  }

  // 3. Pexels fallback (nếu có key)
  const pexels = await searchPexels(englishQuery, Math.floor(Math.random() * 5) + 1, 12)
  if (pexels) {
    const filt = filterUnused(pexels.images, pexels.alts, new Set([...used, ...collectedImgs.map(normalizePhotoId)]))
    collectedImgs.push(...filt.images)
    collectedAlts.push(...filt.alts)
    if (collectedImgs.length >= need) {
      const alts = await enrichAlts(collectedAlts.slice(0, need), topic)
      return { images: collectedImgs.slice(0, need), imageAlts: alts }
    }
  }

  // 4. Fallback pool local (đã dedup + lọc trùng)
  const fallback = getSuggestedImages(topic, need * 2, excludeUsed ? used : undefined)
  // lọc tiếp những gì đã thu thập
  const filtFb = filterUnused(fallback.images, fallback.imageAlts, new Set([...used, ...collectedImgs.map(normalizePhotoId)]))
  collectedImgs.push(...filtFb.images)
  collectedAlts.push(...filtFb.alts)

  const finalImgs = collectedImgs.slice(0, need)
  const finalAltsRaw = collectedAlts.slice(0, need)
  // nếu vẫn thiếu, bổ sung từ fallback không lọc (đảm bảo luôn đủ ảnh)
  if (finalImgs.length < need) {
    const extra = getSuggestedImages(topic, need - finalImgs.length)
    finalImgs.push(...extra.images.slice(0, need - finalImgs.length))
    finalAltsRaw.push(...extra.imageAlts.slice(0, need - finalAltsRaw.length))
  }

  const alts = await enrichAlts(finalAltsRaw.slice(0, need), topic)
  return { images: finalImgs.slice(0, need), imageAlts: alts }
}

export function clearUsedImageCache() {
  usedCache = null
}
