const SECTION_KEYWORDS: Record<string, string[]> = {
  'Làm đẹp & Sức khỏe': ['spa', 'dưỡng sinh', 'gội đầu', 'massage', 'thư giãn', 'chăm sóc da', 'da mặt', 'body', 'sức khỏe', 'thảo dược'],
  'Nail & Móng': ['móng', 'nail', 'sơn gel', 'sơn móng', 'vẽ móng', 'úp móng', 'gắn móng', 'nail art', 'pedicure', 'chăm sóc móng'],
  'Tóc & Da đầu': ['tóc', 'gội', 'uốn tóc', 'nhuộm tóc', 'duỗi tóc', 'dưỡng tóc', 'da đầu', 'gàu', 'rụng tóc', 'dầu gội'],
  'Mi & Chân mày': ['mi', 'lông mi', 'nối mi', 'chân mày', 'phun mày', 'xăm mày', 'điêu khắc mày'],
  'Dịch vụ làm đẹp': ['combo', 'ưu đãi', 'khuyến mãi', 'gói dịch vụ', 'bảng giá', 'đặt lịch', 'booking', 'trải nghiệm'],
};

export function detectArticleSection(keywords?: string, content?: string): string {
  const searchText = [
    keywords || '',
    content ? content.replace(/<[^>]*>/g, '').substring(0, 500) : '',
  ].join(' ').toLowerCase();

  let bestSection = 'Làm đẹp & Sức khỏe';
  let bestScore = 0;

  for (const [section, kws] of Object.entries(SECTION_KEYWORDS)) {
    let score = 0;
    for (const kw of kws) {
      if (searchText.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSection = section;
    }
  }

  return bestSection;
}
