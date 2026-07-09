import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { patchDenylistEntry, removeDenylistEntry } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  const { active } = (await req.json().catch(() => ({}))) as { active?: boolean };
  if (active === undefined) return NextResponse.json({ error: 'active required' }, { status: 400 });
  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
    await patchDenylistEntry(apiKey, profile.profile_id, entryId, active);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
    await removeDenylistEntry(apiKey, profile.profile_id, entryId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
