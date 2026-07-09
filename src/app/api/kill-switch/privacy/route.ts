import { NextRequest, NextResponse } from 'next/server';
import { killSwitchRepo } from '@/lib/db/repo';
import type { PrivacySettings } from '@/lib/nextdns/types';

export async function PATCH(req: NextRequest) {
  const patch = (await req.json().catch(() => ({}))) as Partial<PrivacySettings>;
  const current = killSwitchRepo.get();
  killSwitchRepo.update({ privacy: { ...current.privacy, ...patch } });
  return NextResponse.json({ ok: true });
}
