-- ========================================
-- Fix: Bài AI đã tạo nhưng blogs.published=false nên không hiện ở /blog
-- Chạy 1 lần trong Supabase SQL Editor
-- ========================================

-- 1. Đảm bảo cột published tồn tại (idempotent, cho DB chưa chạy v314)
ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 2. Vá tất cả bài auto_seo đang bị nháp -> published=true
UPDATE blogs
SET published = true,
    published_at = COALESCE(published_at, created_at, NOW()),
    updated_at = NOW()
WHERE published = false
  AND slug IN (
    SELECT blog_slug FROM seo_articles
    WHERE topic_source = 'auto_seo' AND blog_slug IS NOT NULL
  );

-- 3. (Optional) Log kiểm tra
-- SELECT slug, title, published, published_at, created_at FROM blogs
-- WHERE slug IN (SELECT blog_slug FROM seo_articles WHERE topic_source='auto_seo')
-- ORDER BY created_at DESC LIMIT 20;

-- 4. Thống kê
-- SELECT published, COUNT(*) FROM blogs GROUP BY published;
