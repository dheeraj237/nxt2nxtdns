import { NextRequest, NextResponse } from 'next/server';
import { killSwitchRepo } from '@/lib/db/repo';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const current = killSwitchRepo.get();
  killSwitchRepo.update({ allowlist: current.allowlist.filter((e) => e.id !== entryId) });
  return new NextResponse(null, { status: 204 });
}
