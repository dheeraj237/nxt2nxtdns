import { NextRequest, NextResponse } from 'next/server';
import { killSwitchRepo } from '@/lib/db/repo';

export async function PUT(req: NextRequest) {
  const blocklists = (await req.json().catch(() => [])) as { id: string }[];
  const current = killSwitchRepo.get();
  killSwitchRepo.update({ privacy: { ...current.privacy, blocklists } });
  return NextResponse.json({ ok: true });
}
