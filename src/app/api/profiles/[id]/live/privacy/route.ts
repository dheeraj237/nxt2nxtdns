import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { getPrivacy, patchPrivacy } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';
import type { PrivacySettings } from '@/lib/nextdns/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
  return NextResponse.json(await getPrivacy(apiKey, profile.profile_id));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  const patch = (await req.json().catch(() => ({}))) as Partial<PrivacySettings>;
  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
    await patchPrivacy(apiKey, profile.profile_id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
