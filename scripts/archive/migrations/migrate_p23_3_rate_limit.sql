CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 1,
  last_request TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_request ON rate_limits(last_request);
