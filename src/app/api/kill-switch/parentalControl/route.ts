import { NextRequest, NextResponse } from 'next/server';
import { killSwitchRepo } from '@/lib/db/repo';
import type { ParentalControlSettings } from '@/lib/nextdns/types';

export async function PATCH(req: NextRequest) {
  const patch = (await req.json().catch(() => ({}))) as Partial<ParentalControlSettings>;
  const current = killSwitchRepo.get();
  killSwitchRepo.update({ parentalControl: { ...current.parentalControl, ...patch } });
  return NextResponse.json({ ok: true });
}
