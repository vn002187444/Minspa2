-- Migration v314: Add published & published_at columns to blogs table
-- Cho phép lưu nháp (draft) và đăng bài viết (publish) riêng biệt

ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Set existing posts as published (backward compatibility)
UPDATE blogs SET published = true WHERE published IS NULL;

-- Set published_at for existing published posts
UPDATE blogs SET published_at = created_at WHERE published = true AND published_at IS NULL;
