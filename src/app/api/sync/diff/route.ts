import { NextRequest, NextResponse } from 'next/server';
import { loadDiffsForTargets, SyncSourceError } from '@/lib/sync/loadTargets';

export async function POST(req: NextRequest) {
  const { targetProfileIds, source } = (await req.json().catch(() => ({}))) as {
    targetProfileIds?: string[];
    source?: 'master' | 'basic';
  };

  try {
    const targets = await loadDiffsForTargets(source ?? 'master', targetProfileIds);
    return NextResponse.json(targets.map((t) => t.diff));
  } catch (err) {
    const status = err instanceof SyncSourceError ? err.status : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status });
  }
}
