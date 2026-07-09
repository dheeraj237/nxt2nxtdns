import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { addAllowlistEntry } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  const { id: entryId, active } = (await req.json().catch(() => ({}))) as { id?: string; active?: boolean };
  if (!entryId) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
    await addAllowlistEntry(apiKey, profile.profile_id, { id: entryId, active: active ?? true });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
