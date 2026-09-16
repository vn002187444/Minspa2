import { getSuggestedImages } from './image-suggestions'

const TIMEOUT_MS = 5000

export async function searchUnsplash(query: string): Promise<{ images: string[]; alts: string[] } | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const resp = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=4&orientation=landscape`,
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

export async function searchPexels(query: string): Promise<{ images: string[]; alts: string[] } | null> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  try {
    const resp = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=4&orientation=landscape`,
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

export async function searchImages(topic: string, count = 4): Promise<{ images: string[]; imageAlts: string[] }> {
  // Try English-mapped query on Unsplash first (better relevance than raw Vietnamese)
  const englishQuery = toUnsplashQuery(topic)
  const unsplashEn = await searchUnsplash(englishQuery)
  if (unsplashEn) {
    return { images: unsplashEn.images.slice(0, count), imageAlts: unsplashEn.alts.slice(0, count) }
  }

  // Fallback: raw topic (Unsplash does handle Vietnamese but less relevant)
  const rawQuery = topic.replace(/[^a-zA-Z0-9À-ỹ ]/g, '').trim().substring(0, 100)
  if (rawQuery !== englishQuery) {
    const unsplashRaw = await searchUnsplash(rawQuery)
    if (unsplashRaw) {
      return { images: unsplashRaw.images.slice(0, count), imageAlts: unsplashRaw.alts.slice(0, count) }
    }
  }

  const pexels = await searchPexels(englishQuery)
  if (pexels) {
    return { images: pexels.images.slice(0, count), imageAlts: pexels.alts.slice(0, count) }
  }

  return getSuggestedImages(topic, count)
}
