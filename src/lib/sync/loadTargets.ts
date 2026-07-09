import { accountsRepo, profilesRepo, type SourceRole } from '../db/repo';
import { getProfile } from '../nextdns/endpoints';
import { computeProfileDiff, type SyncDiff } from './diffEngine';
import type { SyncTarget } from './executor';

export class SyncSourceError extends Error {
  status = 400;
}

export async function loadDiffsForTargets(
  role: SourceRole,
  targetProfileIds: string[] | undefined,
): Promise<(SyncTarget & { diff: SyncDiff })[]> {
  const source = profilesRepo.getByRole(role);
  if (!source) throw new SyncSourceError(`no ${role} profile set`);

  const sourceApiKey = accountsRepo.getDecryptedKey(source.account_id);
  const sourceLive = await getProfile(sourceApiKey, source.profile_id);

  const rowIds = targetProfileIds?.length ? targetProfileIds : profilesRepo.listIds().filter((id) => id !== source.id);

  const targets: (SyncTarget & { diff: SyncDiff })[] = [];
  for (const rowId of rowIds) {
    const row = profilesRepo.get(rowId);
    if (!row || row.id === source.id) continue;
    const apiKey = accountsRepo.getDecryptedKey(row.account_id);
    const targetLive = await getProfile(apiKey, row.profile_id);
    const diff = computeProfileDiff(sourceLive, { ...targetLive, id: row.id });
    targets.push({ profileId: row.profile_id, apiKey, diff });
  }
  return targets;
}
