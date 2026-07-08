import type { SyncDiff, SyncOp } from './diffEngine.js';
import {
  addAllowlistEntry,
  addDenylistEntry,
  patchAllowlistEntry,
  patchDenylistEntry,
  patchParentalControl,
  patchPrivacy,
  putBlocklists,
  removeAllowlistEntry,
  removeDenylistEntry,
} from '../nextdns/endpoints.js';

export interface SyncTarget {
  profileId: string;
  apiKey: string;
  diff: SyncDiff;
}

export interface SyncResult {
  profileId: string;
  success: boolean;
  opsApplied: number;
  error?: string;
}

async function applyOp(apiKey: string, profileId: string, op: SyncOp): Promise<void> {
  switch (op.kind) {
    case 'denylist.remove':
      return removeDenylistEntry(apiKey, profileId, (op.payload as { id: string }).id);
    case 'denylist.add':
      return addDenylistEntry(apiKey, profileId, op.payload as { id: string; active: boolean });
    case 'denylist.patch': {
      const p = op.payload as { id: string; active: boolean };
      return patchDenylistEntry(apiKey, profileId, p.id, p.active);
    }
    case 'allowlist.remove':
      return removeAllowlistEntry(apiKey, profileId, (op.payload as { id: string }).id);
    case 'allowlist.add':
      return addAllowlistEntry(apiKey, profileId, op.payload as { id: string; active: boolean });
    case 'allowlist.patch': {
      const p = op.payload as { id: string; active: boolean };
      return patchAllowlistEntry(apiKey, profileId, p.id, p.active);
    }
    case 'privacy.blocklists.put':
      return putBlocklists(apiKey, profileId, op.payload as { id: string }[]);
    case 'privacy.patch':
      return patchPrivacy(apiKey, profileId, op.payload as never);
    case 'parentalControl.patch':
      return patchParentalControl(apiKey, profileId, op.payload as never);
  }
}

// removes are ordered before adds/patches to avoid transient duplicate-id conflicts
function orderOps(ops: SyncOp[]): SyncOp[] {
  const removes = ops.filter((o) => o.kind.endsWith('.remove'));
  const rest = ops.filter((o) => !o.kind.endsWith('.remove'));
  return [...removes, ...rest];
}

async function applyTarget(target: SyncTarget): Promise<SyncResult> {
  let applied = 0;
  try {
    for (const op of orderOps(target.diff.ops)) {
      await applyOp(target.apiKey, target.profileId, op);
      applied++;
    }
    return { profileId: target.profileId, success: true, opsApplied: applied };
  } catch (err) {
    return {
      profileId: target.profileId,
      success: false,
      opsApplied: applied,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export async function executeSyncPlan(targets: SyncTarget[], concurrency = 3): Promise<SyncResult[]> {
  return runPool(targets, concurrency, applyTarget);
}
