import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { getProfile } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';

export function GET() {
  return NextResponse.json(profilesRepo.list());
}

export async function POST(req: NextRequest) {
  const { accountId, profileId, displayName } = (await req.json().catch(() => ({}))) as {
    accountId?: string;
    profileId?: string;
    displayName?: string;
  };
  if (!accountId || !profileId) {
    return NextResponse.json({ error: 'accountId and profileId required' }, { status: 400 });
  }

  try {
    const apiKey = accountsRepo.getDecryptedKey(accountId);
    const liveProfile = await getProfile(apiKey, profileId);
    const row = profilesRepo.create(accountId, profileId, displayName ?? liveProfile.name ?? null);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (err instanceof NextDnsApiError) {
      return NextResponse.json({ error: `NextDNS rejected profile id: ${err.message}` }, { status: 422 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
