CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  display_name TEXT,
  is_master INTEGER NOT NULL DEFAULT 0,
  is_basic INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (account_id, profile_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_master ON profiles (is_master) WHERE is_master = 1;
CREATE UNIQUE INDEX IF NOT EXISTS one_basic ON profiles (is_basic) WHERE is_basic = 1;
