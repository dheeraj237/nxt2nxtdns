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

export function newId(): string {
  return crypto.randomUUID();
}
