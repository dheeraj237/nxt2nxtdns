import { NextRequest, NextResponse } from 'next/server';
import { killSwitchRepo } from '@/lib/db/repo';

export async function POST(req: NextRequest) {
  const { id: entryId, active } = (await req.json().catch(() => ({}))) as { id?: string; active?: boolean };
  if (!entryId) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const current = killSwitchRepo.get();
  const allowlist = [...current.allowlist.filter((e) => e.id !== entryId), { id: entryId, active: active ?? true }];
  killSwitchRepo.update({ allowlist });
  return NextResponse.json({ ok: true }, { status: 201 });
}
