import { accountsRepo, killSwitchRepo, profilesRepo } from '../db/repo';
import { getProfile } from '../nextdns/endpoints';
import { computeProfileDiff, type SyncDiff } from './diffEngine';
import type { SyncTarget } from './executor';
import type { Profile } from '../nextdns/types';

export type SyncSource = 'master' | 'kill-switch';

export class SyncSourceError extends Error {
  status = 400;
}

async function resolveMasterSource(): Promise<{ source: Profile; excludeRowId: string }> {
  const masterProfile = accountsRepo.getMasterProfile();
  if (!masterProfile) throw new SyncSourceError('no master account set');
  const apiKey = accountsRepo.getDecryptedKey(masterProfile.account_id);
  const source = await getProfile(apiKey, masterProfile.profile_id);
  return { source, excludeRowId: masterProfile.id };
}

function resolveKillSwitchSource(): { source: Profile; excludeRowId: undefined } {
  return { source: killSwitchRepo.asProfile(), excludeRowId: undefined };
}

export async function loadDiffsForTargets(
  role: SyncSource,
  targetProfileIds: string[] | undefined,
): Promise<(SyncTarget & { diff: SyncDiff })[]> {
  const { source, excludeRowId } = role === 'master' ? await resolveMasterSource() : resolveKillSwitchSource();

  const rowIds = targetProfileIds?.length ? targetProfileIds : profilesRepo.listIds().filter((id) => id !== excludeRowId);

  const targets: (SyncTarget & { diff: SyncDiff })[] = [];
  for (const rowId of rowIds) {
    if (rowId === excludeRowId) continue;
    const row = profilesRepo.get(rowId);
    if (!row) continue;
    const apiKey = accountsRepo.getDecryptedKey(row.account_id);
    const targetLive = await getProfile(apiKey, row.profile_id);
    const diff = computeProfileDiff(source, { ...targetLive, id: row.id });
    targets.push({ profileId: row.profile_id, apiKey, diff });
  }
  return targets;
}
