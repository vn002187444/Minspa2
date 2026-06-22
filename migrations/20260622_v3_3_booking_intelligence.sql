-- V3.3 — Booking Intelligence
-- Staff skills & certificate tracking
CREATE TABLE IF NOT EXISTS staff_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  skill_level INT DEFAULT 3 CHECK (skill_level BETWEEN 1 AND 5),
  certificate_name VARCHAR(255),
  certificate_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(staff_id, service_id)
);

CREATE INDEX idx_staff_skills_staff ON staff_skills(staff_id);
CREATE INDEX idx_staff_skills_service ON staff_skills(service_id);

-- Auto-assign history logs
CREATE TABLE IF NOT EXISTS auto_assign_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  previous_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_auto_assign_logs_appointment ON auto_assign_logs(appointment_id);
CREATE INDEX idx_auto_assign_logs_staff ON auto_assign_logs(assigned_staff_id);

-- Slot booking limit for tomorrow
CREATE TABLE IF NOT EXISTS slot_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lock_date DATE NOT NULL,
  time_slot VARCHAR(5) NOT NULL,
  max_bookings INT NOT NULL DEFAULT 1,
  current_bookings INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(lock_date, time_slot)
);

CREATE INDEX idx_slot_limits_date ON slot_limits(lock_date);

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS staff_skills;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS auto_assign_logs;
