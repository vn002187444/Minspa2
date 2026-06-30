-- ========================================
-- P2.18: Storage quota — Update bucket policy + cleanup unused images
-- Chạy trong Supabase SQL Editor
-- ========================================

-- 1. Cập nhật bucket policy: giới hạn file size còn 1MB, chỉ cho phép image/webp
UPDATE storage.buckets
SET file_size_limit = 1048576,  -- 1MB (đủ cho WebP chất lượng 80)
    allowed_mime_types = '{image/webp,image/jpeg,image/png}'
WHERE id = 'seo-images';

-- 2. Tạo function cleanup unused images
-- So sánh tất cả object trong storage.seo-images với các URL trong DB
CREATE OR REPLACE FUNCTION public.cleanup_unused_images()
RETURNS TABLE(deleted_name text, deleted_age interval)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  obj RECORD;
  ref_count INT;
  age INTERVAL;
BEGIN
  FOR obj IN
    SELECT id, name, bucket_id, created_at
    FROM storage.objects
    WHERE bucket_id = 'seo-images'
      AND name LIKE 'seo-%'
  LOOP
    -- Kiểm tra xem URL này có được tham chiếu trong DB không
    SELECT COUNT(*) INTO ref_count
    FROM (
      SELECT image_url FROM public.services WHERE image_url LIKE '%' || obj.name
      UNION ALL
      SELECT image_url FROM public.blogs WHERE image_url LIKE '%' || obj.name
      UNION ALL
      SELECT image_url FROM public.seo_articles WHERE image_url LIKE '%' || obj.name
      UNION ALL
      SELECT og_image_url FROM public.seo_settings WHERE og_image_url LIKE '%' || obj.name
    ) refs;

    IF ref_count = 0 THEN
      age := now() - obj.created_at;
      DELETE FROM storage.objects WHERE id = obj.id;
      deleted_name := obj.name;
      deleted_age := age;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- 3. Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.cleanup_unused_images() TO service_role;

-- 4. Schedule weekly cleanup via pg_cron (every Sunday 3AM UTC = 10AM VN)
SELECT cron.schedule(
  'cleanup-unused-images',
  '0 3 * * 0',
  $$SELECT public.cleanup_unused_images()$$
);
