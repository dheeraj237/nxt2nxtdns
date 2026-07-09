import { db, newId } from './client';
import { decrypt, encrypt } from '../crypto';
import type { ParentalControlSettings, PrivacySettings, Profile, ListItem } from '../nextdns/types';

export class MasterValidationError extends Error {
  status = 422;
}

export interface AccountRow {
  id: string;
  label: string;
  encrypted_api_key: string;
  iv: string;
  is_master: 0 | 1;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  account_id: string;
  profile_id: string;
  display_name: string | null;
  created_at: string;
}

export const accountsRepo = {
  list(): Omit<AccountRow, 'encrypted_api_key' | 'iv'>[] {
    return db.prepare('SELECT id, label, is_master, created_at FROM accounts ORDER BY created_at').all() as never;
  },
  create(label: string, apiKey: string): AccountRow {
    const { ciphertext, iv } = encrypt(apiKey);
    const row: AccountRow = {
      id: newId(),
      label,
      encrypted_api_key: ciphertext,
      iv,
      is_master: 0,
      created_at: new Date().toISOString(),
    };
    db.prepare('INSERT INTO accounts (id, label, encrypted_api_key, iv, is_master, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(
      row.id,
      row.label,
      row.encrypted_api_key,
      row.iv,
      row.created_at,
    );
    return row;
  },
  updateApiKey(id: string, apiKey: string): void {
    const { ciphertext, iv } = encrypt(apiKey);
    db.prepare('UPDATE accounts SET encrypted_api_key = ?, iv = ? WHERE id = ?').run(ciphertext, iv, id);
  },
  delete(id: string): void {
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  },
  getDecryptedKey(id: string): string {
    const row = db.prepare('SELECT encrypted_api_key, iv FROM accounts WHERE id = ?').get(id) as
      | Pick<AccountRow, 'encrypted_api_key' | 'iv'>
      | undefined;
    if (!row) throw new Error('account not found');
    return decrypt(row.encrypted_api_key, row.iv);
  },
  getAnyKey(): string | undefined {
    const row = db.prepare('SELECT encrypted_api_key, iv FROM accounts ORDER BY is_master DESC, created_at LIMIT 1').get() as
      | Pick<AccountRow, 'encrypted_api_key' | 'iv'>
      | undefined;
    return row ? decrypt(row.encrypted_api_key, row.iv) : undefined;
  },
  setMaster(id: string): void {
    const { c } = db.prepare('SELECT COUNT(*) as c FROM profiles WHERE account_id = ?').get(id) as { c: number };
    if (c !== 1) throw new MasterValidationError('account must have exactly one profile to be set as master');
    const tx = db.transaction(() => {
      db.prepare('UPDATE accounts SET is_master = 0 WHERE is_master = 1').run();
      db.prepare('UPDATE accounts SET is_master = 1 WHERE id = ?').run(id);
    });
    tx();
  },
  getMaster(): AccountRow | undefined {
    return db.prepare('SELECT * FROM accounts WHERE is_master = 1').get() as AccountRow | undefined;
  },
  getMasterProfile(): ProfileRow | undefined {
    return db
      .prepare('SELECT p.* FROM profiles p JOIN accounts a ON a.id = p.account_id WHERE a.is_master = 1')
      .get() as ProfileRow | undefined;
  },
};

export const profilesRepo = {
  list(): (ProfileRow & { account_label: string })[] {
    return db
      .prepare(
        `SELECT p.*, a.label as account_label FROM profiles p
         JOIN accounts a ON a.id = p.account_id
         ORDER BY p.created_at`,
      )
      .all() as never;
  },
  listIds(): string[] {
    return (db.prepare('SELECT id FROM profiles').all() as { id: string }[]).map((r) => r.id);
  },
  countForAccount(accountId: string): number {
    return (db.prepare('SELECT COUNT(*) as c FROM profiles WHERE account_id = ?').get(accountId) as { c: number }).c;
  },
  get(id: string): ProfileRow | undefined {
    return db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as ProfileRow | undefined;
  },
  create(accountId: string, profileId: string, displayName: string | null): ProfileRow {
    const row: ProfileRow = {
      id: newId(),
      account_id: accountId,
      profile_id: profileId,
      display_name: displayName,
      created_at: new Date().toISOString(),
    };
    db.prepare(
      'INSERT INTO profiles (id, account_id, profile_id, display_name, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(row.id, row.account_id, row.profile_id, row.display_name, row.created_at);
    return row;
  },
  delete(id: string): void {
    db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  },
};

interface KillSwitchProfile {
  denylist: ListItem[];
  allowlist: ListItem[];
  privacy: PrivacySettings;
  parentalControl: ParentalControlSettings;
}

interface KillSwitchRow {
  denylist: string;
  allowlist: string;
  privacy: string;
  parental_control: string;
}

export const killSwitchRepo = {
  get(): KillSwitchProfile {
    const row = db.prepare('SELECT denylist, allowlist, privacy, parental_control FROM kill_switch_profile WHERE id = 1').get() as KillSwitchRow;
    return {
      denylist: JSON.parse(row.denylist),
      allowlist: JSON.parse(row.allowlist),
      privacy: JSON.parse(row.privacy),
      parentalControl: JSON.parse(row.parental_control),
    };
  },
  update(patch: Partial<KillSwitchProfile>): KillSwitchProfile {
    const next = { ...killSwitchRepo.get(), ...patch };
    db.prepare(
      'UPDATE kill_switch_profile SET denylist = ?, allowlist = ?, privacy = ?, parental_control = ?, updated_at = ? WHERE id = 1',
    ).run(
      JSON.stringify(next.denylist),
      JSON.stringify(next.allowlist),
      JSON.stringify(next.privacy),
      JSON.stringify(next.parentalControl),
      new Date().toISOString(),
    );
    return next;
  },
  asProfile(): Profile {
    return { id: '__kill-switch__', name: 'Kill switch', ...killSwitchRepo.get() };
  },
};
