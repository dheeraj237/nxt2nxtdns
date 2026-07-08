import { describe, expect, it } from 'vitest';
import { computeProfileDiff } from './diffEngine.js';
import type { Profile } from '../nextdns/types.js';

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'target1',
    denylist: [],
    allowlist: [],
    privacy: { blocklists: [], disguisedTrackers: false, allowAffiliate: true },
    parentalControl: {
      services: [],
      categories: [],
      safeSearch: false,
      youtubeRestrictedMode: false,
      blockBypass: false,
    },
    ...overrides,
  };
}

describe('computeProfileDiff', () => {
  it('produces no ops for identical profiles', () => {
    const master = makeProfile();
    const target = makeProfile();
    const diff = computeProfileDiff(master, target);
    expect(diff.ops).toHaveLength(0);
  });

  it('adds denylist entries present only in master', () => {
    const master = makeProfile({ denylist: [{ id: 'bad.com', active: true }] });
    const target = makeProfile();
    const diff = computeProfileDiff(master, target);
    expect(diff.ops).toEqual([
      { kind: 'denylist.add', payload: { id: 'bad.com', active: true }, description: expect.any(String) },
    ]);
    expect(diff.summary.toAdd).toBe(1);
  });

  it('removes denylist entries present only in target (mirror behavior)', () => {
    const master = makeProfile();
    const target = makeProfile({ denylist: [{ id: 'stale.com', active: true }] });
    const diff = computeProfileDiff(master, target);
    expect(diff.ops).toEqual([
      { kind: 'denylist.remove', payload: { id: 'stale.com' }, description: expect.any(String) },
    ]);
    expect(diff.summary.toRemove).toBe(1);
  });

  it('patches entries with differing active flag', () => {
    const master = makeProfile({ allowlist: [{ id: 'good.com', active: true }] });
    const target = makeProfile({ allowlist: [{ id: 'good.com', active: false }] });
    const diff = computeProfileDiff(master, target);
    expect(diff.ops).toEqual([
      { kind: 'allowlist.patch', payload: { id: 'good.com', active: true }, description: expect.any(String) },
    ]);
    expect(diff.summary.toUpdate).toBe(1);
  });

  it('replaces blocklists wholesale when the id sets differ', () => {
    const master = makeProfile({ privacy: { blocklists: [{ id: 'nextdns-recommended' }], disguisedTrackers: false, allowAffiliate: true } });
    const target = makeProfile({ privacy: { blocklists: [], disguisedTrackers: false, allowAffiliate: true } });
    const diff = computeProfileDiff(master, target);
    expect(diff.ops).toEqual([
      { kind: 'privacy.blocklists.put', payload: [{ id: 'nextdns-recommended' }], description: expect.any(String) },
    ]);
  });

  it('diffs parentalControl services/categories as a full replace patch', () => {
    const master = makeProfile({
      parentalControl: {
        services: [{ id: 'tiktok', active: true }],
        categories: [],
        safeSearch: false,
        youtubeRestrictedMode: false,
        blockBypass: false,
      },
    });
    const target = makeProfile();
    const diff = computeProfileDiff(master, target);
    expect(diff.ops).toEqual([
      {
        kind: 'parentalControl.patch',
        payload: { services: [{ id: 'tiktok', active: true }] },
        description: expect.any(String),
      },
    ]);
  });
});
