import cron from 'node-cron';
import { schedulesRepo, scheduleSnapshotsRepo, accountsRepo, profilesRepo } from '@/lib/db/repo';
import { getProfile } from '@/lib/nextdns/endpoints';
import { computeProfileDiff } from '@/lib/sync/diffEngine';
import { executeSyncPlan } from '@/lib/sync/executor';
import type { SyncTarget } from '@/lib/sync/executor';

function isTodayMatch(lastExecutedAt: string | null): boolean {
  if (!lastExecutedAt) return false;
  const lastDate = new Date(lastExecutedAt).toDateString();
  const todayDate = new Date().toDateString();
  return lastDate === todayDate;
}

async function snapshotAndApply(scheduleId: string): Promise<void> {
  const schedule = schedulesRepo.get(scheduleId);
  if (!schedule) {
    console.error(`[Schedule] Schedule ${scheduleId} not found`);
    return;
  }

  if (!schedule.enabled) {
    console.log(`[Schedule] Schedule ${scheduleId} is disabled, skipping`);
    return;
  }

  if (isTodayMatch(schedule.last_executed_at)) {
    console.log(`[Schedule] Schedule ${scheduleId} already executed today, skipping`);
    return;
  }

  const targetProfile = profilesRepo.get(schedule.target_profile_id);
  if (!targetProfile) {
    console.error(`[Schedule] Target profile ${schedule.target_profile_id} not found for schedule ${scheduleId}`);
    return;
  }

  const accounts = accountsRepo.list();
  if (accounts.length === 0) {
    console.warn(`[Schedule] No accounts configured, skipping schedule ${scheduleId}`);
    schedulesRepo.updateLastExecutedAt(scheduleId);
    return;
  }

  console.log(`[Schedule] Starting snapshot for schedule ${scheduleId} (${schedule.name}), ${accounts.length} account(s)`);

  let snapshotSucceeded = false;
  const snapshotResults: { accountId: string; success: boolean; error?: string }[] = [];

  for (const account of accounts) {
    try {
      const apiKey = accountsRepo.getDecryptedKey(account.id);
      const defaultProfileId = account.default_profile_id;
      if (!defaultProfileId) {
        console.warn(`[Schedule] Account ${account.id} has no default profile, skipping snapshot`);
        snapshotResults.push({ accountId: account.id, success: false, error: 'no default profile' });
        continue;
      }

      const defaultProfile = profilesRepo.get(defaultProfileId);
      if (!defaultProfile) {
        console.warn(`[Schedule] Default profile ${defaultProfileId} for account ${account.id} not found`);
        snapshotResults.push({ accountId: account.id, success: false, error: 'profile not found' });
        continue;
      }

      const liveConfig = await getProfile(apiKey, defaultProfile.profile_id);
      const snapshotJson = JSON.stringify(liveConfig);
      scheduleSnapshotsRepo.create(scheduleId, account.id, defaultProfileId, snapshotJson);
      console.log(`[Schedule] Snapshot created for schedule ${scheduleId}, account ${account.id}`);
      snapshotResults.push({ accountId: account.id, success: true });
      snapshotSucceeded = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Schedule] Snapshot failed for schedule ${scheduleId}, account ${account.id}: ${message}`);
      snapshotResults.push({ accountId: account.id, success: false, error: message });
    }
  }

  if (!snapshotSucceeded) {
    console.error(`[Schedule] All snapshot attempts failed for schedule ${scheduleId}, aborting apply`);
    return;
  }

  console.log(`[Schedule] Starting apply for schedule ${scheduleId}, target profile ${schedule.target_profile_id}`);

  const targetProfileApiKey = accountsRepo.getDecryptedKey(targetProfile.account_id);
  const targetLiveProfile = await getProfile(targetProfileApiKey, targetProfile.profile_id);

  const syncTargets: SyncTarget[] = [];
  for (const account of accounts) {
    const defaultProfileId = account.default_profile_id;
    if (!defaultProfileId) continue;

    const defaultProfileRow = profilesRepo.get(defaultProfileId);
    if (!defaultProfileRow) continue;

    try {
      const apiKey = accountsRepo.getDecryptedKey(account.id);
      const currentProfile = await getProfile(apiKey, defaultProfileRow.profile_id);
      const diff = computeProfileDiff(targetLiveProfile, currentProfile);
      syncTargets.push({ profileId: defaultProfileRow.profile_id, apiKey, diff });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Schedule] Failed to fetch profile for apply on account ${account.id}: ${message}`);
    }
  }

  if (syncTargets.length === 0) {
    console.warn(`[Schedule] No valid sync targets for schedule ${scheduleId}`);
  } else {
    const results = await executeSyncPlan(syncTargets);
    for (const result of results) {
      if (result.success) {
        console.log(`[Schedule] Apply succeeded for schedule ${scheduleId}, profile ${result.profileId}: ${result.opsApplied} ops applied`);
      } else {
        console.error(`[Schedule] Apply failed for schedule ${scheduleId}, profile ${result.profileId}: ${result.error}`);
      }
    }
  }

  schedulesRepo.updateLastExecutedAt(scheduleId);
  console.log(`[Schedule] Completed apply for schedule ${scheduleId}`);
}

async function restore(scheduleId: string): Promise<void> {
  const schedule = schedulesRepo.get(scheduleId);
  if (!schedule) {
    console.error(`[Schedule] Schedule ${scheduleId} not found`);
    return;
  }

  if (!schedule.enabled) {
    console.log(`[Schedule] Schedule ${scheduleId} is disabled, skipping restore`);
    return;
  }

  console.log(`[Schedule] Starting restore for schedule ${scheduleId}`);

  const snapshots = scheduleSnapshotsRepo.getSnapshotsForRestore(scheduleId);
  if (snapshots.length === 0) {
    console.warn(`[Schedule] No snapshots found for restore on schedule ${scheduleId}`);
    return;
  }

  const snapshotsByAccount = new Map<string, string>();
  for (const snapshot of snapshots) {
    if (!snapshotsByAccount.has(snapshot.account_id)) {
      snapshotsByAccount.set(snapshot.account_id, snapshot.snapshot_json);
    }
  }

  const syncTargets: SyncTarget[] = [];
  for (const [accountId, snapshotJson] of snapshotsByAccount) {
    try {
      const account = accountsRepo.get(accountId);
      if (!account || !account.default_profile_id) {
        console.warn(`[Schedule] Account ${accountId} not found or has no default profile, skipping restore`);
        continue;
      }

      const defaultProfileRow = profilesRepo.get(account.default_profile_id);
      if (!defaultProfileRow) {
        console.warn(`[Schedule] Default profile for account ${accountId} not found, skipping restore`);
        continue;
      }

      const snapshotProfile = JSON.parse(snapshotJson);
      const apiKey = accountsRepo.getDecryptedKey(accountId);
      const currentProfile = await getProfile(apiKey, defaultProfileRow.profile_id);
      const diff = computeProfileDiff(snapshotProfile, currentProfile);
      syncTargets.push({ profileId: defaultProfileRow.profile_id, apiKey, diff });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Schedule] Failed to prepare restore for account ${accountId}: ${message}`);
    }
  }

  if (syncTargets.length === 0) {
    console.warn(`[Schedule] No valid sync targets for restore on schedule ${scheduleId}`);
    return;
  }

  const results = await executeSyncPlan(syncTargets);
  for (const result of results) {
    if (result.success) {
      console.log(`[Schedule] Restore succeeded for schedule ${scheduleId}, profile ${result.profileId}: ${result.opsApplied} ops reverted`);
    } else {
      console.error(`[Schedule] Restore failed for schedule ${scheduleId}, profile ${result.profileId}: ${result.error}`);
    }
  }

  console.log(`[Schedule] Completed restore for schedule ${scheduleId}`);
}

function getCurrentTimeHHMM(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function initScheduledProfileSwapJob() {
  const job = cron.schedule('*/1 * * * *', async () => {
    const schedules = schedulesRepo.list().filter((s) => s.enabled);
    if (schedules.length === 0) return;

    const currentTime = getCurrentTimeHHMM();

    for (const schedule of schedules) {
      try {
        if (currentTime === schedule.start_time && !isTodayMatch(schedule.last_executed_at)) {
          console.log(`[Schedule] Time matched start_time for schedule ${schedule.id}`);
          await snapshotAndApply(schedule.id);
        }

        if (currentTime === schedule.end_time) {
          console.log(`[Schedule] Time matched end_time for schedule ${schedule.id}`);
          await restore(schedule.id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Schedule] Error evaluating schedule ${schedule.id}: ${message}`);
      }
    }
  });

  return job;
}

export { snapshotAndApply as runScheduleStart, restore as runScheduleEnd };
