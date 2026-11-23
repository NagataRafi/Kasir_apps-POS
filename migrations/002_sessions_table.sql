-- Migration 002: Create sessions table for authenticated users
-- Stores session data with httpOnly cookie support
-- Uses SQLite schema for session management

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'kasir', 'dapur')),
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Index for fast session lookup by user and expiry
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON expires_at;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_role, expires_at;