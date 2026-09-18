/**
 * Chuẩn hóa URL tiếng Việt — xử lý triệt để ký tự "đ/Đ"
 * Cơ chế: NFD bóc tách dấu -> xóa diacritics -> replace đĐ -> lowercase -> slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugifyUpperAware(text: string): string {
  // Variant giữ nguyên logic spec: replace đĐ trước khi xóa ký tự đặc biệt
  // Dùng khi cần phân biệt hoa thường (không lowercase ngay)
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default slugify;
