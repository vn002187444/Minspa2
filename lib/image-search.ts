import { getSuggestedImages } from './image-suggestions'

const TIMEOUT_MS = 5000

async function searchUnsplash(query: string): Promise<{ images: string[]; alts: string[] } | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const resp = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=4&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(TIMEOUT_MS) }
    )
    if (!resp.ok) return null
    const data: { results?: { urls: { regular: string }; alt_description: string | null; description: string | null }[] } = await resp.json()
    if (!data.results?.length) return null
    const images = data.results.map(r => r.urls.regular + '?w=800&auto=format&fit=crop')
    const alts = data.results.map(r => r.alt_description || r.description || query.substring(0, 100))
    return { images, alts }
  } catch {
    return null
  }
}

async function searchPexels(query: string): Promise<{ images: string[]; alts: string[] } | null> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  try {
    const resp = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=4&orientation=landscape`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(TIMEOUT_MS) }
    )
    if (!resp.ok) return null
    const data: { photos?: { src: { large: string }; alt: string | null }[] } = await resp.json()
    if (!data.photos?.length) return null
    const images = data.photos.map(p => p.src.large)
    const alts = data.photos.map(p => p.alt || query.substring(0, 100))
    return { images, alts }
  } catch {
    return null
  }
}

export async function searchImages(topic: string, count = 4): Promise<{ images: string[]; imageAlts: string[] }> {
  const query = topic.replace(/[^a-zA-Z0-9À-ỹ ]/g, '').trim().substring(0, 100)

  const unsplash = await searchUnsplash(query)
  if (unsplash) {
    return { images: unsplash.images.slice(0, count), imageAlts: unsplash.alts.slice(0, count) }
  }

  const pexels = await searchPexels(query)
  if (pexels) {
    return { images: pexels.images.slice(0, count), imageAlts: pexels.alts.slice(0, count) }
  }

  return getSuggestedImages(topic, count)
}
