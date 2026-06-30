-- Migration: Tạo bảng ai_cache
CREATE TABLE IF NOT EXISTS ai_cache (
    id TEXT PRIMARY KEY,
    response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_created_at ON ai_cache(created_at);
