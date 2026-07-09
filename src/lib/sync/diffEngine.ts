import type { ListItem, ParentalControlSettings, PrivacySettings, Profile } from '../nextdns/types';

export type SyncOpKind =
  | 'denylist.add'
  | 'denylist.remove'
  | 'denylist.patch'
  | 'allowlist.add'
  | 'allowlist.remove'
  | 'allowlist.patch'
  | 'privacy.blocklists.put'
  | 'privacy.patch'
  | 'parentalControl.patch';

export interface SyncOp {
  kind: SyncOpKind;
  payload: unknown;
  description: string;
}

export interface SyncDiff {
  targetProfileId: string;
  ops: SyncOp[];
  summary: { toAdd: number; toRemove: number; toUpdate: number };
}

function diffListEntries(master: ListItem[], target: ListItem[], kind: 'denylist' | 'allowlist'): SyncOp[] {
  const masterMap = new Map(master.map((e) => [e.id, e.active]));
  const targetMap = new Map(target.map((e) => [e.id, e.active]));
  const ops: SyncOp[] = [];

  for (const [id, active] of masterMap) {
    if (!targetMap.has(id)) {
      ops.push({ kind: `${kind}.add`, payload: { id, active }, description: `Add ${kind} entry: ${id}` });
    } else if (targetMap.get(id) !== active) {
      ops.push({ kind: `${kind}.patch`, payload: { id, active }, description: `Update ${kind} entry: ${id} -> active=${active}` });
    }
  }
  for (const id of targetMap.keys()) {
    if (!masterMap.has(id)) {
      ops.push({ kind: `${kind}.remove`, payload: { id }, description: `Remove ${kind} entry: ${id}` });
    }
  }
  return ops;
}

function diffBlocklists(master: { id: string }[], target: { id: string }[]): SyncOp[] {
  const masterIds = master.map((b) => b.id).sort();
  const targetIds = target.map((b) => b.id).sort();
  if (JSON.stringify(masterIds) === JSON.stringify(targetIds)) return [];
  return [
    {
      kind: 'privacy.blocklists.put',
      payload: master.map((b) => ({ id: b.id })),
      description: `Replace blocklists with: ${masterIds.join(', ') || '(none)'}`,
    },
  ];
}

function diffPrivacyFlags(master: PrivacySettings, target: PrivacySettings): SyncOp[] {
  if (master.disguisedTrackers === target.disguisedTrackers) return [];
  return [
    {
      kind: 'privacy.patch',
      payload: { disguisedTrackers: master.disguisedTrackers },
      description: `Set privacy.disguisedTrackers = ${master.disguisedTrackers}`,
    },
  ];
}

function diffIdActiveArray(master: ListItem[], target: ListItem[]): ListItem[] | null {
  const masterSorted = [...master].sort((a, b) => a.id.localeCompare(b.id));
  const targetSorted = [...target].sort((a, b) => a.id.localeCompare(b.id));
  if (JSON.stringify(masterSorted) === JSON.stringify(targetSorted)) return null;
  return masterSorted;
}

function diffParentalControl(master: ParentalControlSettings, target: ParentalControlSettings): SyncOp[] {
  const patch: Partial<ParentalControlSettings> = {};
  const services = diffIdActiveArray(master.services, target.services);
  if (services) patch.services = services;
  const categories = diffIdActiveArray(master.categories, target.categories);
  if (categories) patch.categories = categories;

  if (Object.keys(patch).length === 0) return [];
  return [
    {
      kind: 'parentalControl.patch',
      payload: patch,
      description: `Update parentalControl: ${Object.keys(patch).join(', ')}`,
    },
  ];
}

export function computeProfileDiff(master: Profile, target: Profile): SyncDiff {
  const ops = [
    ...diffListEntries(master.denylist, target.denylist, 'denylist'),
    ...diffListEntries(master.allowlist, target.allowlist, 'allowlist'),
    ...diffBlocklists(master.privacy.blocklists, target.privacy.blocklists),
    ...diffPrivacyFlags(master.privacy, target.privacy),
    ...diffParentalControl(master.parentalControl, target.parentalControl),
  ];

  const summary = ops.reduce(
    (acc, op) => {
      if (op.kind.endsWith('.add')) acc.toAdd++;
      else if (op.kind.endsWith('.remove')) acc.toRemove++;
      else acc.toUpdate++;
      return acc;
    },
    { toAdd: 0, toRemove: 0, toUpdate: 0 },
  );

  return { targetProfileId: target.id, ops, summary };
}
