type ImageEntry = {
  url: string
  alt: string
}

// All URLs verified via HEAD 200 on 2026-09-16
const NAILS: ImageEntry[] = [
  { url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop', alt: 'Bộ dụng cụ làm nail chuyên nghiệp tại salon' },
  { url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop', alt: 'Mẫu nail hồng nghệ thuật cận cảnh' },
  { url: 'https://images.unsplash.com/photo-1604654894611-6973b376cbde?w=800&auto=format&fit=crop', alt: 'Móng đen với nhẫn bạc sang trọng' },
  { url: 'https://images.unsplash.com/photo-1735236007245-9dc6e28bbe56?w=800&auto=format&fit=crop', alt: 'Mẫu nail xanh trắng họa tiết nghệ thuật' },
  { url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop', alt: 'Dịch vụ chăm sóc móng tay móng chân tại spa' },
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop', alt: 'Chăm sóc móng tay chuyên nghiệp tại salon' },
  { url: 'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&auto=format&fit=crop', alt: 'Mẫu nail đẹp hiện đại tại Min Salon' },
  { url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop', alt: 'Mẫu nail Pháp thanh lịch cho phái nữ' },
]

const HAIRCARE: ImageEntry[] = [
  { url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop', alt: 'Dịch vụ gội đầu dưỡng sinh thư giãn tại salon' },
  { url: 'https://images.unsplash.com/photo-1717160675643-53a7a2ebaa9f?w=800&auto=format&fit=crop', alt: 'Gội đầu dưỡng sinh thảo dược tại salon' },
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop', alt: 'Dưỡng sinh tóc với thảo dược thiên nhiên' },
  { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop', alt: 'Dịch vụ cắt tóc và tạo kiểu chuyên nghiệp' },
  { url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop', alt: 'Chăm sóc tóc hư tổn bằng tinh dầu thiên nhiên' },
  { url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop', alt: 'Trị liệu tóc hư tổn chuyên sâu tại salon' },
  { url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop', alt: 'Trị gàu và chăm sóc da đầu tại salon uy tín' },
  { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop', alt: 'Dịch vụ tóc nam nữ tại Min Nail & Hair' },
]

const MASSAGE: ImageEntry[] = [
  { url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&auto=format&fit=crop', alt: 'Massage body thư giãn toàn thân tại spa' },
  { url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&auto=format&fit=crop', alt: 'Liệu trình massage đá nóng với hoa trắng' },
  { url: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&auto=format&fit=crop', alt: 'Massage lưng thư giãn chuyên sâu' },
  { url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop', alt: 'Massage vai gáy giảm đau mỏi văn phòng' },
  { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop', alt: 'Phòng massage cao cấp với không gian thư giãn' },
  { url: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800&auto=format&fit=crop', alt: 'Liệu pháp massage tinh dầu thơm aromatherapy' },
  { url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&auto=format&fit=crop', alt: 'Massage bấm huyệt chăm sóc sức khỏe' },
  { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop', alt: 'Kỹ thuật massage trị liệu chuyên sâu' },
]

const SPA: ImageEntry[] = [
  { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop', alt: 'Không gian spa sang trọng thư giãn tại Thủ Đức' },
  { url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&auto=format&fit=crop', alt: 'Xông hơi thư giãn tại spa cao cấp' },
  { url: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&auto=format&fit=crop', alt: 'Liệu trình spa thư giãn cuối tuần' },
  { url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop', alt: 'Dịch vụ spa chăm sóc sắc đẹp toàn diện' },
  { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop', alt: 'Gói spa dưỡng da chuyên sâu cho phái nữ' },
  { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop', alt: 'Min Nail & Hair Spa dịch vụ làm đẹp uy tín' },
]

const FACIAL: ImageEntry[] = [
  { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop', alt: 'Dịch vụ chăm sóc da mặt chuyên sâu tại spa' },
  { url: 'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&auto=format&fit=crop', alt: 'Liệu trình dưỡng da trắng sáng mịn màng' },
  { url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop', alt: 'Mặt nạ dưỡng da thiên nhiên cho làn da khỏe' },
  { url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop', alt: 'Chăm sóc da mặt công nghệ cao tại Thủ Đức' },
  { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop', alt: 'Massage mặt thư giãn và trẻ hóa làn da' },
  { url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop', alt: 'Dưỡng da collagen cho da săn chắc đàn hồi' },
  { url: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&auto=format&fit=crop', alt: 'Chăm sóc da mặt thảo dược tại Min Spa Thủ Đức' },
  { url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&auto=format&fit=crop', alt: 'Liệu trình facial trẻ hóa tại Lavita Charm' },
]

const MAKEUP: ImageEntry[] = [
  { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop', alt: 'Dịch vụ trang điểm chuyên nghiệp cho cô dâu' },
  { url: 'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&auto=format&fit=crop', alt: 'Bộ mỹ phẩm trang điểm cao cấp tại salon' },
  { url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop', alt: 'Makeup dự tiệc và sự kiện sang trọng' },
  { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop', alt: 'Trang điểm cô dâu tại Thủ Đức giá tốt' },
]

const GENERAL: ImageEntry[] = [
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop', alt: 'Salon làm đẹp hiện đại tại Thủ Đức' },
  { url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop', alt: 'Không gian salon sang trọng và chuyên nghiệp' },
  { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop', alt: 'Min Nail & Hair Lavita Charm Thủ Đức' },
  { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop', alt: 'Dịch vụ làm đẹp toàn diện tại Min Nail & Hair' },
  { url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&auto=format&fit=crop', alt: 'Quy trình làm đẹp chuẩn salon chuyên nghiệp' },
  { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop', alt: 'Sản phẩm chăm sóc sắc đẹp thiên nhiên' },
  { url: 'https://images.unsplash.com/photo-1522335789208-94e3d8b9a5b6?w=800&auto=format&fit=crop', alt: 'Không gian làm đẹp thư giãn tại Lavita Charm' },
  { url: 'https://images.unsplash.com/photo-1515688594390-b649af70d282?w=800&auto=format&fit=crop', alt: 'Dịch vụ chăm sóc sắc đẹp tổng hợp' },
]

const TOPIC_CATEGORIES: [RegExp, ImageEntry[]][] = [
  [/nail|móng|sơn gel|acrylic|pedicure|manicure|vẽ móng|nail art/gi, NAILS],
  [/tóc|gội đầu|gội|dưỡng sinh|hair|dầu gội|ủ tóc|dưỡng tóc|trị tóc|gàu|tóc dầu|tóc khô|tạo kiểu|uốn tóc|duỗi/gi, HAIRCARE],
  [/massage|bấm huyệt|vai gáy|body|thư giãn toàn thân|xoa bóp/gi, MASSAGE],
  [/spa|xông hơi|tắm bùn|tắm trắng|chăm sóc da|dưỡng da/gi, SPA],
  [/da mặt|mặt|trị mụn|nám|tàn nhang|lỗ chân lông|dưỡng ẩm|serum|facial/gi, FACIAL],
  [/trang điểm|makeup|make up|mỹ phẩm|son môi|cô dâu|dự tiệc/gi, MAKEUP],
]

function normalizeId(url: string): string {
  const m = url.match(/photo-[a-f0-9-]+/i)
  if (m) return m[0].toLowerCase()
  return url.split('?')[0].toLowerCase()
}

function shufflePick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function filterByUsed(pool: ImageEntry[], used?: Set<string>): ImageEntry[] {
  if (!used || used.size === 0) return pool
  return pool.filter(e => {
    const id = normalizeId(e.url)
    const base = e.url.split('?')[0].toLowerCase()
    return !used.has(id) && !used.has(base)
  })
}

export function getSuggestedImages(topic: string, count = 4, used?: Set<string>): { images: string[]; imageAlts: string[] } {
  const lower = topic.toLowerCase()

  for (const [regex, pool] of TOPIC_CATEGORIES) {
    if (regex.test(lower)) {
      let candidates = filterByUsed(pool, used)
      // nếu lọc xong không đủ, bổ sung từ pool gốc đã dedup
      if (candidates.length < count) {
        const remaining = pool.filter(e => !candidates.includes(e))
        const dedupedRemaining = remaining.filter(e => !candidates.some(c => normalizeId(c.url) === normalizeId(e.url)))
        candidates = [...candidates, ...shufflePick(dedupedRemaining, count - candidates.length)]
      }
      if (candidates.length < count) {
        // vẫn thiếu thì lấy từ GENERAL chưa dùng
        const generalUnused = filterByUsed(GENERAL, used).filter(g => !candidates.some(c => normalizeId(c.url) === normalizeId(g.url)))
        candidates = [...candidates, ...shufflePick(generalUnused, count - candidates.length)]
      }
      const picked = shufflePick(candidates, Math.min(count, candidates.length))
      // nếu vẫn thiếu do pool nhỏ, cho phép lặp nhưng đã cố gắng tránh
      if (picked.length < count) {
        const extra = shufflePick(pool, count - picked.length)
        picked.push(...extra)
      }
      return {
        images: picked.map(e => e.url),
        imageAlts: picked.map(e => e.alt),
      }
    }
  }

  let candidates = filterByUsed(GENERAL, used)
  if (candidates.length < count) {
    const remaining = GENERAL.filter(e => !candidates.includes(e))
    candidates = [...candidates, ...shufflePick(remaining, count - candidates.length)]
  }
  const picked = shufflePick(candidates, Math.min(count, candidates.length))
  return {
    images: picked.map(e => e.url),
    imageAlts: picked.map(e => e.alt),
  }
}

export function getImageTheme(topic: string): string {
  const lower = topic.toLowerCase()
  if (/nail|móng|sơn|gel/.test(lower)) return 'nails'
  if (/tóc|gội|dưỡng sinh|hair|gàu/.test(lower)) return 'haircare'
  if (/massage|spa|thư giãn|body/.test(lower)) return 'spa'
  return 'general'
}
