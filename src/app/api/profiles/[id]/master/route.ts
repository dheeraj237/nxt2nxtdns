import { NextRequest, NextResponse } from 'next/server';
import { profilesRepo } from '@/lib/db/repo';

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  profilesRepo.setRole(id, 'master');
  return NextResponse.json({ ok: true });
}
