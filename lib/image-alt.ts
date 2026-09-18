/**
 * Helper sinh alt ảnh chuẩn GEO/AEO cho services & blogs
 * Quy tắc: luôn NFC, 30-120 ký tự, chứa geo "Lavita Charm" hoặc "Thủ Đức"
 */

const GEO_SUFFIX = ' tại Min Nail & Hair Lavita Charm Thủ Đức';
const HAS_GEO_RE = /lavita|thủ đức|trường thọ/i;

export function generateServiceImageAlt(name: string, category?: string): string {
  const cat = category ? ` - ${category}` : '';
  const base = `${name}${cat}${GEO_SUFFIX}`;
  return base.normalize('NFC').slice(0, 120);
}

export function generateBlogImageAlt(titleOrTopic: string): string {
  const base = `${titleOrTopic}${GEO_SUFFIX}`;
  return base.normalize('NFC').slice(0, 120);
}

export function ensureGeoAlt(alt: string, fallbackName: string): string {
  const trimmed = alt?.trim();
  if (!trimmed) return generateServiceImageAlt(fallbackName);
  const normalized = trimmed.normalize('NFC').slice(0, 120);
  if (HAS_GEO_RE.test(normalized)) return normalized;
  // Append geo, keep within 120
  const withGeo = `${normalized}${GEO_SUFFIX}`;
  return withGeo.normalize('NFC').slice(0, 120);
}

/**
 * Việt hoá alt tiếng Anh bằng Gemini (song ngữ). Fallback giữ nguyên alt nếu không dịch được.
 * Cache qua lib/ai-cache để tránh tốn token lặp.
 */
export async function translateAltToVietnamese(altEn: string, topicFallback: string): Promise<string> {
  if (!altEn?.trim()) return generateServiceImageAlt(topicFallback);
  // If already contains Vietnamese diacritics, assume already vi
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/i.test(altEn) && HAS_GEO_RE.test(altEn)) {
    return altEn.normalize('NFC').slice(0, 120);
  }
  try {
    const { callGemini } = await import('@/lib/ai/gemini');
    const prompt = `Dịch alt ảnh sang tiếng Việt tự nhiên, giữ ý gốc. Alt gốc: "${altEn}". Chủ đề gợi ý: "${topicFallback}". Yêu cầu: <=90 ký tự, tiếng Việt có dấu, hướng spa/nail/hair. Chỉ trả về chuỗi dịch, không giải thích.`;
    const res = await callGemini({
      systemInstruction: 'Bạn là dịch giả alt ảnh SEO cho spa nail hair tại Thủ Đức. Trả về JSON.',
      prompt,
      jsonSchema: { type: 'object', properties: { alt: { type: 'string', description: 'Alt tiếng Việt đã dịch' } }, required: ['alt'] },
      useCache: true,
      cacheKey: `alt-vi:${altEn}:${topicFallback}`,
    });
    if (res.text) {
      const parsed = JSON.parse(res.text);
      const vi = (parsed.alt || '').trim();
      if (vi) return ensureGeoAlt(vi, topicFallback);
    }
  } catch {
    // ignore, fallback below
  }
  return ensureGeoAlt(altEn, topicFallback);
}
