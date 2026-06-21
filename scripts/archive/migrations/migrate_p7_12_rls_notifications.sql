-- ========================================
-- P7.12: RLS Policy cho notifications table
-- Chạy trong Supabase SQL Editor
-- ========================================

-- 1. Enable RLS trên notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users chỉ xem được notifications của chính mình
-- Lưu ý: Project dùng custom JWT cookie, KHÔNG dùng Supabase Auth
-- nên auth.uid() sẽ KHÔNG trả về đúng user ID.
-- Policy này hoạt động khi dùng Supabase client với JWT token từ Supabase Auth.
-- Hiện tại project dùng server-side với SERVICE_ROLE_KEY (bypass RLS),
-- nên policy này mainly cho tương lai nếu chuyển sang client-side queries.

CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    (recipient_type = 'user' AND recipient_id::text = auth.uid()::text)
    OR
    (recipient_type = 'customer' AND recipient_id::text = auth.uid()::text)
  );

-- 3. Policy: Chỉ server (service role) mới insert/update được
-- INSERT và UPDATE sẽ thông qua server actions với SERVICE_ROLE_KEY
-- nên policy này mặc định deny cho anon/authenticated

CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
  ON public.notifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Grant permissions cho service_role
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO authenticated;
