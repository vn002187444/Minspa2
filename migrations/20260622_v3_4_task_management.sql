-- V3.4 — Task Management
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('daily', 'one_time')),
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assignee_type VARCHAR(20) NOT NULL DEFAULT 'specific' CHECK (assignee_type IN ('specific', 'all')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  deadline TIMESTAMP WITH TIME ZONE,
  time_slot VARCHAR(20),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  original_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_original ON tasks(original_task_id);

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS tasks;
