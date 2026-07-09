CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  is_master INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS one_master_account ON accounts (is_master) WHERE is_master = 1;

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (account_id, profile_id)
);

CREATE TABLE IF NOT EXISTS kill_switch_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  denylist TEXT NOT NULL DEFAULT '[]',
  allowlist TEXT NOT NULL DEFAULT '[]',
  privacy TEXT NOT NULL DEFAULT '{"blocklists":[],"disguisedTrackers":false,"allowAffiliate":true}',
  parental_control TEXT NOT NULL DEFAULT '{"services":[],"categories":[],"safeSearch":false,"youtubeRestrictedMode":false,"blockBypass":false}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO kill_switch_profile (id) VALUES (1);
