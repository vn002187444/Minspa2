-- Migration: Thêm columns cho marketing campaign (P2.12 / P4.18)
-- Thêm email, birthday, last_booking_date vào bảng customers

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS last_booking_date TIMESTAMP WITH TIME ZONE;

-- Index cho query marketing campaign
CREATE INDEX IF NOT EXISTS idx_customers_last_booking_date ON customers(last_booking_date);
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birthday);

-- Trigger: cập nhật last_booking_date khi tạo appointment mới
CREATE OR REPLACE FUNCTION update_customer_last_booking()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET last_booking_date = NEW.appointment_date + NEW.appointment_time::time
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_customer_last_booking ON appointments;
CREATE TRIGGER trg_update_customer_last_booking
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_last_booking();
