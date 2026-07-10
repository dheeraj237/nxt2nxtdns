import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { getProfileSetup, linkProfileToCurrentIp } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });

  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
    const setup = await getProfileSetup(apiKey, profile.profile_id);

    console.log(`[LinkIP] Profile ${profile.profile_id}:`);
    console.log(`  - linkedIpUpdateToken: ${setup.linkedIpUpdateToken}`);
    console.log(`  - linkedIp: ${setup.linkedIp}`);
    console.log(`  - linkedIpDNSServers: ${setup.linkedIpDNSServers?.join(',')}`);
    console.log(`  - All keys: ${Object.keys(setup).join(',')}`);

    if (!setup.linkedIpUpdateToken) {
      console.error(`[LinkIP] ERROR: No token found for profile ${profile.profile_id}`);
      return NextResponse.json(
        {
          error: 'Profile does not have IP linking enabled. Enable it in NextDNS profile setup.',
          debug: { hasToken: !!setup.linkedIpUpdateToken, setupKeys: Object.keys(setup) },
        },
        { status: 422 },
      );
    }

    const linkedIp = await linkProfileToCurrentIp(setup.linkedIpUpdateToken, profile.profile_id);

    return NextResponse.json(
      {
        linkedIp,
        linkedIpDNSServers: setup.linkedIpDNSServers || [],
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
