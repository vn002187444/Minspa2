# Min Nail & Hair — Brand Guide v1.0

> Nature Distilled + Soft UI Evolution. Warm wellness, thủ đức local. Dùng `app/globals.css` làm nguồn truth.

## 1. Màu
- **Core** (light): `bg #FAF6F0`, `border #EADDCD`, `text #3A2E2B / #8D6E53`, `accent #5C4033`, `accentDark #3A2E2B`, `gold #B49678` — xem `docs/brand/tokens.json`
- **Seasonal** 12 theme via `[data-theme]` — đổi token tự động, không cần sửa component.
- **Quy tắc**: CTA chính `bg-[#3A2E2B] text-white` (đã fix contrast U6). Không dùng `unsafe-eval`, không dùng neon.

## 2. Chữ
- `Playfair Display` cho heading/hero, `Inter` cho body/UI, `JetBrains Mono` cho mã. Load qua `next/font` trong `app/layout.tsx:12-24`.
- Scale: hero `clamp(2rem,5vw,3rem)`, h2 `1.5rem`, body `14px`.

## 3. Logo
- Hiện tại: vòng tròn `#C08063` + chữ `M` trắng. Đã tạo 3 variants trong `public/brand/logo/` (monogram/wordmark/badge) — xem todo 2.
- Clear space 0.5×M, min 24px, nền trắng bắt buộc khi xuất ảnh.

## 4. Icon
- `lucide-react` cho UI, custom outlined 3 icon dịch vụ (todo 3) cho card Service.

## 5. Ứng dụng
- Tailwind: dùng `.theme-bg`, `.theme-text` ... để tự đổi theo mùa.
- In ấn: export 300DPI CMYK, bleed 3-5mm (CIP todo 4).

## 6. File liên quan
- `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`, `public/brand/logo/*`, `public/icons/custom/*`
