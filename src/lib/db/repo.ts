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
        ).run(row.id, row.account_id, row.profile_id, row.display_name, row.auto_refresh_linked_ip ? 1 : 0, row.created_at);
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
    db.prepare('UPDATE profiles SET auto_refresh_linked_ip = ? WHERE id = ?').run(enabled ? 1 : 0, id);
  },
};

export interface ScheduleRow {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  target_profile_id: string;
  enabled: boolean;
  last_executed_at: string | null;
  created_at: string;
}

export interface ScheduleSnapshotRow {
  id: string;
  schedule_id: string;
  account_id: string;
  profile_id: string;
  snapshot_json: string;
  created_at: string;
}

export const schedulesRepo = {
  list(): ScheduleRow[] {
    return db.prepare('SELECT * FROM schedules ORDER BY created_at').all() as ScheduleRow[];
  },
  get(id: string): ScheduleRow | undefined {
    return db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as ScheduleRow | undefined;
  },
  create(name: string, startTime: string, endTime: string, targetProfileId: string): ScheduleRow {
    const id = newId();
    const createdAt = new Date().toISOString();
    db.prepare(
      'INSERT INTO schedules (id, name, start_time, end_time, target_profile_id, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(id, name, startTime, endTime, targetProfileId, 1, createdAt);
    return { id, name, start_time: startTime, end_time: endTime, target_profile_id: targetProfileId, enabled: true, last_executed_at: null, created_at: createdAt };
  },
  update(id: string, patch: Partial<Omit<ScheduleRow, 'id' | 'created_at'>>): void {
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    if ('name' in patch && patch.name !== undefined) {
      updates.push('name = ?');
      values.push(patch.name);
    }
    if ('start_time' in patch && patch.start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(patch.start_time);
    }
    if ('end_time' in patch && patch.end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(patch.end_time);
    }
    if ('target_profile_id' in patch && patch.target_profile_id !== undefined) {
      updates.push('target_profile_id = ?');
      values.push(patch.target_profile_id);
    }
    if ('enabled' in patch && patch.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(patch.enabled ? 1 : 0);
    }
    if ('last_executed_at' in patch) {
      updates.push('last_executed_at = ?');
      values.push(patch.last_executed_at ?? null);
    }
    if (updates.length === 0) return;
    values.push(id);
    db.prepare(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  },
  delete(id: string): void {
    db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  },
  updateLastExecutedAt(id: string): void {
    db.prepare('UPDATE schedules SET last_executed_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  },
};

export const scheduleSnapshotsRepo = {
  create(scheduleId: string, accountId: string, profileId: string, snapshotJson: string): ScheduleSnapshotRow {
    const id = newId();
    const createdAt = new Date().toISOString();
    db.prepare(
      'INSERT INTO schedule_snapshots (id, schedule_id, account_id, profile_id, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, scheduleId, accountId, profileId, snapshotJson, createdAt);
    return { id, schedule_id: scheduleId, account_id: accountId, profile_id: profileId, snapshot_json: snapshotJson, created_at: createdAt };
  },
  getLatestByScheduleAndAccount(scheduleId: string, accountId: string): ScheduleSnapshotRow | undefined {
    return db
      .prepare('SELECT * FROM schedule_snapshots WHERE schedule_id = ? AND account_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(scheduleId, accountId) as ScheduleSnapshotRow | undefined;
  },
  deleteByScheduleId(scheduleId: string): void {
    db.prepare('DELETE FROM schedule_snapshots WHERE schedule_id = ?').run(scheduleId);
  },
  getSnapshotsForRestore(scheduleId: string): ScheduleSnapshotRow[] {
    return db.prepare('SELECT * FROM schedule_snapshots WHERE schedule_id = ? ORDER BY created_at DESC').all(scheduleId) as ScheduleSnapshotRow[];
  },
};
