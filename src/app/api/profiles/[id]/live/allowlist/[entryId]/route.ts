import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { removeAllowlistEntry } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
    await removeAllowlistEntry(apiKey, profile.profile_id, entryId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
