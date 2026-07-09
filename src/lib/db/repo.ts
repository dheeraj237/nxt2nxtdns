import { db, newId } from './client';
import { decrypt, encrypt } from '../crypto';

export type SourceRole = 'master' | 'basic';

export interface AccountRow {
  id: string;
  label: string;
  encrypted_api_key: string;
  iv: string;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  account_id: string;
  profile_id: string;
  display_name: string | null;
  is_master: 0 | 1;
  is_basic: 0 | 1;
  created_at: string;
}

export const accountsRepo = {
  list(): Omit<AccountRow, 'encrypted_api_key' | 'iv'>[] {
    return db.prepare('SELECT id, label, created_at FROM accounts ORDER BY created_at').all() as never;
  },
  create(label: string, apiKey: string): AccountRow {
    const { ciphertext, iv } = encrypt(apiKey);
    const row: AccountRow = { id: newId(), label, encrypted_api_key: ciphertext, iv, created_at: new Date().toISOString() };
    db.prepare('INSERT INTO accounts (id, label, encrypted_api_key, iv, created_at) VALUES (?, ?, ?, ?, ?)').run(
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
};

const roleColumn: Record<SourceRole, 'is_master' | 'is_basic'> = {
  master: 'is_master',
  basic: 'is_basic',
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
  get(id: string): ProfileRow | undefined {
    return db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as ProfileRow | undefined;
  },
  create(accountId: string, profileId: string, displayName: string | null): ProfileRow {
    const row: ProfileRow = {
      id: newId(),
      account_id: accountId,
      profile_id: profileId,
      display_name: displayName,
      is_master: 0,
      is_basic: 0,
      created_at: new Date().toISOString(),
    };
    db.prepare(
      'INSERT INTO profiles (id, account_id, profile_id, display_name, is_master, is_basic, created_at) VALUES (?, ?, ?, ?, 0, 0, ?)',
    ).run(row.id, row.account_id, row.profile_id, row.display_name, row.created_at);
    return row;
  },
  delete(id: string): void {
    db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  },
  setRole(id: string, role: SourceRole): void {
    const column = roleColumn[role];
    const tx = db.transaction(() => {
      db.prepare(`UPDATE profiles SET ${column} = 0 WHERE ${column} = 1`).run();
      db.prepare(`UPDATE profiles SET ${column} = 1 WHERE id = ?`).run(id);
    });
    tx();
  },
  getByRole(role: SourceRole): ProfileRow | undefined {
    const column = roleColumn[role];
    return db.prepare(`SELECT * FROM profiles WHERE ${column} = 1`).get() as ProfileRow | undefined;
  },
};
