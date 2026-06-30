-- P3.10: Enable Supabase Realtime on schedule-related tables
-- Run this in Supabase SQL Editor

-- Enable Realtime for appointments (main table for schedule sync)
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Enable Realtime for time_slot_locks (for lock/unlock sync)
ALTER PUBLICATION supabase_realtime ADD TABLE time_slot_locks;

-- Enable Realtime for attendance (for staff presence sync)
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
