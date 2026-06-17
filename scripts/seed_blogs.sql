-- Seed blogs table với 10 bài viết SEO
-- Chạy trong Supabase SQL Editor
INSERT INTO public.blogs (title, slug, summary, content, image_url) VALUES
(
  N'Gội Đầu Dưỡng Sinh Tại Thủ Đức – Trải Nghiệm Thư Giãn Đỉnh Cao',
  'goi-dau-duong-sinh-tai-thu-duc',
  N'Khám phá dịch vụ gội đầu dưỡng sinh thảo dược tại Min Nail & Hair – Lavita Charm Thủ Đức. Combo thư giãn, massage ấn huyệt, giá chỉ từ 65.000đ.',
  N'# Gội Đầu Dưỡng Sinh Tại Thủ Đức – Trải Nghiệm Thư Giãn Đỉnh Cao\n\n## Gội Đầu Dưỡng Sinh Là Gì?\nGội đầu dưỡng sinh là phương pháp chăm sóc tóc và da đầu kết hợp massage ấn huyệt, sử dụng thảo dược thiên nhiên. Không chỉ làm sạch tóc, còn giúp lưu thông khí huyết, giảm căng thẳng.\n\n## Các Combo Gội Đầu Dưỡng Sinh Tại Min\n- Gội nhanh (30 ph – 65.000đ)\n- Gội thư giãn (30 ph – 69.000đ)\n- Combo 1 – An Yên (60 ph – 149.000đ)\n- Combo 2 – Tầm Trung (70 ph – 199.000đ)\n- Combo 3 – Chuyên Sâu (80 ph – 279.000đ)\n- Combo 4 – Thượng Hạng (90 ph – 379.000đ)\n\nĐặt lịch online ngay để nhận ưu đãi giảm 5%!',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop'
);',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop')
ON CONFLICT (slug) DO NOTHING;