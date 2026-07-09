import { NextRequest, NextResponse } from 'next/server';
import { listProfiles } from '@/lib/nextdns/endpoints';
import { NextDnsApiError } from '@/lib/nextdns/client';

export async function POST(req: NextRequest) {
  const { apiKey } = (await req.json().catch(() => ({}))) as { apiKey?: string };
  if (!apiKey) return NextResponse.json({ error: 'apiKey required' }, { status: 400 });

  try {
    const profiles = await listProfiles(apiKey);
    return NextResponse.json(profiles);
  } catch (err) {
    if (err instanceof NextDnsApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
