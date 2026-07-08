import { Router } from 'express';
import { accountsRepo, profilesRepo } from '../db/repo.js';
import { getProfile } from '../nextdns/endpoints.js';
import { computeProfileDiff, type SyncDiff } from '../sync/diffEngine.js';
import { executeSyncPlan, type SyncTarget } from '../sync/executor.js';

export const syncRouter = Router();

async function loadDiffsForTargets(targetProfileRowIds: string[]) {
  const master = profilesRepo.getMaster();
  if (!master) throw Object.assign(new Error('no master profile set'), { status: 400 });

  const masterApiKey = accountsRepo.getDecryptedKey(master.account_id);
  const masterLive = await getProfile(masterApiKey, master.profile_id);

  const targets: (SyncTarget & { diff: SyncDiff })[] = [];
  for (const rowId of targetProfileRowIds) {
    const row = profilesRepo.get(rowId);
    if (!row || row.is_master) continue;
    const apiKey = accountsRepo.getDecryptedKey(row.account_id);
    const targetLive = await getProfile(apiKey, row.profile_id);
    const diff = computeProfileDiff(masterLive, { ...targetLive, id: row.id });
    targets.push({ profileId: row.profile_id, apiKey, diff });
  }
  return targets;
}

syncRouter.post('/diff', async (req, res) => {
  const { targetProfileIds } = req.body as { targetProfileIds?: string[] };
  if (!targetProfileIds?.length) return res.status(400).json({ error: 'targetProfileIds required' });

  try {
    const targets = await loadDiffsForTargets(targetProfileIds);
    res.json(targets.map((t) => t.diff));
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: err instanceof Error ? err.message : 'unknown error' });
  }
});

syncRouter.post('/apply', async (req, res) => {
  const { targetProfileIds } = req.body as { targetProfileIds?: string[] };
  if (!targetProfileIds?.length) return res.status(400).json({ error: 'targetProfileIds required' });

  try {
    const targets = await loadDiffsForTargets(targetProfileIds);
    const results = await executeSyncPlan(targets);
    res.json(results);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: err instanceof Error ? err.message : 'unknown error' });
  }
});
