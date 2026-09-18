/**
 * Auto-enrich service thiếu hình / nội dung để hoàn thiện SEO + GEO + AEO
 * - Thiếu image_url -> tìm ảnh via searchImages (Unsplash/Pexels) song ngữ + GEO alt
 * - Thiếu description (<30 ký tự) -> Gemini sinh mô tả chuẩn SEO địa phương
 */
import { searchImages } from '@/lib/image-search'
import { generateServiceImageAlt, ensureGeoAlt } from '@/lib/image-alt'
import { callGemini } from '@/lib/ai/gemini'

const DESC_MIN_LEN = 30

export async function enrichServiceImage(
  name: string,
  category?: string
): Promise<{ image_url: string; image_alt: string } | null> {
  const topic = `${name} ${category || ''}`.trim()
  try {
    const res = await searchImages(topic, 1)
    if (res.images[0]) {
      return { image_url: res.images[0], image_alt: ensureGeoAlt(res.imageAlts[0] || topic, topic) }
    }
  } catch {}
  return null
}

export async function enrichServiceDescription(name: string, category?: string, price?: number, duration?: number): Promise<string | null> {
  const prompt = `Viết mô tả dịch vụ SEO cho: Tên="${name}", Nhóm="${category || 'làm đẹp'}", Giá=${price || ''}đ, Thời lượng=${duration || ''} phút. Địa điểm: Min Nail & Hair, TM14 Lavita Charm, Thủ Đức. Yêu cầu: 2-3 câu, 120-180 ký tự, tiếng Việt có dấu, giọng thân thiện, nhấn mạnh lợi ích + quy trình, chứa "Lavita Charm" hoặc "Thủ Đức", không tư vấn y tế. Chỉ trả về mô tả thuần.`
  try {
    const result = await callGemini({
      systemInstruction: 'Bạn là copywriter SEO cho spa nail/hair gội dưỡng sinh. Trả về JSON đúng schema.',
      prompt,
      jsonSchema: { type: 'object', properties: { description: { type: 'string', description: 'Mô tả dịch vụ 120-180 ký tự' } }, required: ['description'] },
      useCache: true,
      cacheKey: `svc-desc:${name}:${category}`,
    })
    if (result.text) {
      const parsed = JSON.parse(result.text)
      const d = (parsed.description || '').trim().normalize('NFC')
      if (d.length >= DESC_MIN_LEN) return d.slice(0, 500)
    }
  } catch {}
  // Fallback template GEO
  if (name) {
    return `${name} chuyên nghiệp tại Min Nail & Hair Lavita Charm Thủ Đức. Liệu trình ${duration || 60} phút, giá ${price ? Number(price).toLocaleString('vi-VN') + 'đ' : 'ưu đãi'} — dụng cụ tiệt trùng, kỹ thuật viên tay nghề cao, đặt online giảm 5%.`.normalize('NFC')
  }
  return null
}

export function isServiceDescriptionIncomplete(desc?: string | null): boolean {
  if (!desc?.trim()) return true
  return desc.trim().length < DESC_MIN_LEN
}

export function isServiceImageMissing(url?: string | null): boolean {
  return !url?.trim()
}
