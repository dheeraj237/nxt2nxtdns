import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { getAnalyticsStatus } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';
import type { AnalyticsData } from '@/lib/nextdns/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });

  try {
    const apiKey = accountsRepo.getDecryptedKey(profile.account_id);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = now;

    const from = monthStart.toISOString();
    const to = monthEnd.toISOString();

    const statusData = await getAnalyticsStatus(apiKey, profile.profile_id, from, to);

    const blocked = statusData.find((d: any) => d.status === 'blocked')?.queries ?? 0;
    const allowed = statusData.find((d: any) => d.status === 'allowed')?.queries ?? 0;
    const defaultQueries = statusData.find((d: any) => d.status === 'default')?.queries ?? 0;

    const total = blocked + allowed + defaultQueries;
    const percentage = (total / 300000) * 100;

    const response: AnalyticsData = {
      blocked,
      allowed,
      default: defaultQueries,
      total,
      percentage: Math.round(percentage * 100) / 100,
      limit: 300000,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
