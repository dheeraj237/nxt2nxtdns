import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { getProfile } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
    const live = await getProfile(apiKey, profile.profile_id);
    return NextResponse.json(live);
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
