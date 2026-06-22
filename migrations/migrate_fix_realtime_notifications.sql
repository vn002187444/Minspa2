-- Fix: Add notifications table to supabase_realtime publication
-- Notifications realtime was configured in code but never added to publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS notifications;
