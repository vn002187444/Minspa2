-- V3.9.4: Sổ quỹ tiền mặt (cash_register)
CREATE TABLE IF NOT EXISTS cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('THU', 'CHI')),
  category VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  description TEXT DEFAULT '',
  reference_type VARCHAR(30),
  reference_id UUID,
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cash_register' AND policyname = 'cash_register_admin_all'
  ) THEN
    CREATE POLICY cash_register_admin_all ON cash_register
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
