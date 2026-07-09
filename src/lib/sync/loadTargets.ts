import { accountsRepo, profilesRepo } from '../db/repo';
import { getProfile } from '../nextdns/endpoints';
import { computeProfileDiff, type SyncDiff } from './diffEngine';
import type { SyncTarget } from './executor';
import type { Profile } from '../nextdns/types';

export class SyncSourceError extends Error {
  status = 400;
}

/**
 * Diffs `sourceProfile` (the profile currently open in the editor, including any
 * unsaved edits) against each target account's default profile.
 */
export async function loadDiffsForTargets(
  sourceProfile: Profile,
  targetAccountIds: string[],
): Promise<(SyncTarget & { diff: SyncDiff })[]> {
  if (!targetAccountIds.length) throw new SyncSourceError('no target accounts selected');

  const targets: (SyncTarget & { diff: SyncDiff })[] = [];
  for (const accountId of targetAccountIds) {
    const account = accountsRepo.get(accountId);
    if (!account?.default_profile_id) continue;
    const row = profilesRepo.get(account.default_profile_id);
    if (!row) continue;
    const apiKey = accountsRepo.getDecryptedKey(row.account_id);
    const targetLive = await getProfile(apiKey, row.profile_id);
    const diff = computeProfileDiff(sourceProfile, { ...targetLive, id: row.id });
    targets.push({ profileId: row.profile_id, apiKey, diff });
  }
  return targets;
}
