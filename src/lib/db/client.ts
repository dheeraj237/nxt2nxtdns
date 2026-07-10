import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../env';

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
export const db = new Database(env.dbPath);
db.pragma('busy_timeout = 5000');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(process.cwd(), 'src/lib/db/schema.sql'), 'utf8');
db.exec(schema);

/**
 * `accounts` used to have a nullable single `is_master` flag with no notion of a
 * per-account default profile, and a standalone `kill_switch_profile` table. Both
 * concepts were removed in favor of every account having its own `default_profile_id`.
 * This migrates any pre-existing local database in place instead of assuming a fresh one.
 */
function migrateLegacyMasterAndKillSwitch() {
  const columns = db.prepare("PRAGMA table_info(accounts)").all() as { name: string }[];
  const hasDefaultProfileId = columns.some((c) => c.name === 'default_profile_id');
  const hasIsMaster = columns.some((c) => c.name === 'is_master');

  if (!hasDefaultProfileId) {
    db.exec('ALTER TABLE accounts ADD COLUMN default_profile_id TEXT REFERENCES profiles(id)');
    const accountsWithoutDefault = db.prepare('SELECT id FROM accounts WHERE default_profile_id IS NULL').all() as { id: string }[];
    for (const { id } of accountsWithoutDefault) {
      const firstProfile = db
        .prepare('SELECT id FROM profiles WHERE account_id = ? ORDER BY created_at LIMIT 1')
        .get(id) as { id: string } | undefined;
      if (firstProfile) {
        db.prepare('UPDATE accounts SET default_profile_id = ? WHERE id = ?').run(firstProfile.id, id);
      }
    }
  }

  if (hasIsMaster) {
    db.exec('DROP INDEX IF EXISTS one_master_account');
    db.exec('ALTER TABLE accounts DROP COLUMN is_master');
  }

  const hasKillSwitchTable = (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'kill_switch_profile'").get() as
      | { name: string }
      | undefined
  ) !== undefined;
  if (hasKillSwitchTable) db.exec('DROP TABLE kill_switch_profile');
}

migrateLegacyMasterAndKillSwitch();

function migrateAddLinkedIpColumn() {
  const columns = db.prepare("PRAGMA table_info(profiles)").all() as { name: string }[];
  const hasAutoRefreshLinkedIp = columns.some((c) => c.name === 'auto_refresh_linked_ip');

  if (!hasAutoRefreshLinkedIp) {
    db.exec('ALTER TABLE profiles ADD COLUMN auto_refresh_linked_ip BOOLEAN DEFAULT FALSE');
  }
}

migrateAddLinkedIpColumn();

function migrateAddSchedulesTables() {
  const scheduleTableExists = (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schedules'").get() as
      | { name: string }
      | undefined
  ) !== undefined;

  if (!scheduleTableExists) {
    db.exec(`
      CREATE TABLE schedules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        target_profile_id TEXT NOT NULL REFERENCES profiles(id),
        enabled BOOLEAN DEFAULT TRUE,
        last_executed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE schedule_snapshots (
        id TEXT PRIMARY KEY,
        schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        profile_id TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
}

migrateAddSchedulesTables();

export function newId(): string {
  return crypto.randomUUID();
}
