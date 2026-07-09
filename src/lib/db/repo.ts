import { db, newId } from './client';
import { decrypt, encrypt } from '../crypto';

export class ProfileDeletionError extends Error {
  status = 409;
}

export interface AccountRow {
  id: string;
  label: string;
  encrypted_api_key: string;
  iv: string;
  default_profile_id: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  account_id: string;
  profile_id: string;
  display_name: string | null;
  auto_refresh_linked_ip: boolean;
  created_at: string;
}

export const accountsRepo = {
  list(): Omit<AccountRow, 'encrypted_api_key' | 'iv'>[] {
    return db.prepare('SELECT id, label, default_profile_id, created_at FROM accounts ORDER BY created_at').all() as never;
  },
  get(id: string): Omit<AccountRow, 'encrypted_api_key' | 'iv'> | undefined {
    return db.prepare('SELECT id, label, default_profile_id, created_at FROM accounts WHERE id = ?').get(id) as never;
  },
  /** Creates an account together with its NextDNS profiles and default profile in one transaction. */
  createWithProfiles(
    label: string,
    apiKey: string,
    profiles: { profileId: string; displayName: string | null }[],
    defaultProfileIndex: number,
  ): { account: AccountRow; profiles: ProfileRow[] } {
    const { ciphertext, iv } = encrypt(apiKey);
    const account: AccountRow = {
      id: newId(),
      label,
      encrypted_api_key: ciphertext,
      iv,
      default_profile_id: null,
      created_at: new Date().toISOString(),
    };

    const tx = db.transaction(() => {
      db.prepare(
        'INSERT INTO accounts (id, label, encrypted_api_key, iv, default_profile_id, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
      ).run(account.id, account.label, account.encrypted_api_key, account.iv, account.created_at);

      const profileRows: ProfileRow[] = profiles.map((p) => ({
        id: newId(),
        account_id: account.id,
        profile_id: p.profileId,
        display_name: p.displayName,
        auto_refresh_linked_ip: false,
        created_at: new Date().toISOString(),
      }));
      for (const row of profileRows) {
        db.prepare(
          'INSERT INTO profiles (id, account_id, profile_id, display_name, auto_refresh_linked_ip, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        ).run(row.id, row.account_id, row.profile_id, row.display_name, row.auto_refresh_linked_ip, row.created_at);
      }

      const defaultProfile = profileRows[defaultProfileIndex];
      db.prepare('UPDATE accounts SET default_profile_id = ? WHERE id = ?').run(defaultProfile.id, account.id);
      account.default_profile_id = defaultProfile.id;

      return profileRows;
    });

    const profileRows = tx();
    return { account, profiles: profileRows };
  },
  updateLabel(id: string, label: string): void {
    db.prepare('UPDATE accounts SET label = ? WHERE id = ?').run(label, id);
  },
  setDefaultProfile(accountId: string, profileId: string): void {
    const row = profilesRepo.get(profileId);
    if (!row || row.account_id !== accountId) throw new Error('profile does not belong to this account');
    db.prepare('UPDATE accounts SET default_profile_id = ? WHERE id = ?').run(profileId, accountId);
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
  /** Any onboarded account's key - used for read-only NextDNS catalog lookups that aren't account-specific. */
  getAnyKey(): string | undefined {
    const row = db.prepare('SELECT encrypted_api_key, iv FROM accounts ORDER BY created_at LIMIT 1').get() as
      | Pick<AccountRow, 'encrypted_api_key' | 'iv'>
      | undefined;
    return row ? decrypt(row.encrypted_api_key, row.iv) : undefined;
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
  countForAccount(accountId: string): number {
    return (db.prepare('SELECT COUNT(*) as c FROM profiles WHERE account_id = ?').get(accountId) as { c: number }).c;
  },
  get(id: string): ProfileRow | undefined {
    return db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as ProfileRow | undefined;
  },
  /** Refuses to delete an account's last profile or its current default profile. */
  delete(id: string): void {
    const row = profilesRepo.get(id);
    if (!row) return;
    const account = accountsRepo.get(row.account_id);
    if (account?.default_profile_id === id) {
      throw new ProfileDeletionError('cannot delete the account\'s default profile - set a different default first');
    }
    if (profilesRepo.countForAccount(row.account_id) <= 1) {
      throw new ProfileDeletionError('an account must always have at least one profile');
    }
    db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  },
  getByAutoRefresh(): (ProfileRow & { account_label: string })[] {
    return db
      .prepare(
        `SELECT p.*, a.label as account_label FROM profiles p
         JOIN accounts a ON a.id = p.account_id
         WHERE p.auto_refresh_linked_ip = TRUE
         ORDER BY p.created_at`,
      )
      .all() as never;
  },
  updateAutoRefresh(id: string, enabled: boolean): void {
    db.prepare('UPDATE profiles SET auto_refresh_linked_ip = ? WHERE id = ?').run(enabled, id);
  },
};
