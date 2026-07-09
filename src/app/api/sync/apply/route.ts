import { NextRequest, NextResponse } from 'next/server';
import { loadDiffsForTargets, SyncSourceError } from '@/lib/sync/loadTargets';
import { executeSyncPlan } from '@/lib/sync/executor';
import type { Profile } from '@/lib/nextdns/types';

export async function POST(req: NextRequest) {
  const { sourceProfile, targetAccountIds } = (await req.json().catch(() => ({}))) as {
    sourceProfile?: Profile;
    targetAccountIds?: string[];
  };
  if (!sourceProfile || !targetAccountIds) {
    return NextResponse.json({ error: 'sourceProfile and targetAccountIds required' }, { status: 400 });
  }

  try {
    const targets = await loadDiffsForTargets(sourceProfile, targetAccountIds);
    const results = await executeSyncPlan(targets);
    return NextResponse.json(results);
  } catch (err) {
    const status = err instanceof SyncSourceError ? err.status : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status });
  }
}
