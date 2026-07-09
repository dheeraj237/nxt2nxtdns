import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo } from '@/lib/db/repo';

export function GET() {
  return NextResponse.json(accountsRepo.list());
}

export async function POST(req: NextRequest) {
  const { label, apiKey, defaultProfileIndex, profiles } = (await req.json().catch(() => ({}))) as {
    label?: string;
    apiKey?: string;
    defaultProfileIndex?: number;
    profiles?: { id: string; name?: string }[];
  };
  if (!label || !apiKey || !profiles?.length || defaultProfileIndex === undefined) {
    return NextResponse.json({ error: 'label, apiKey, profiles, and defaultProfileIndex are required' }, { status: 400 });
  }
  if (defaultProfileIndex < 0 || defaultProfileIndex >= profiles.length) {
    return NextResponse.json({ error: 'defaultProfileIndex out of range' }, { status: 400 });
  }

  const { account } = accountsRepo.createWithProfiles(
    label,
    apiKey,
    profiles.map((p) => ({ profileId: p.id, displayName: p.name ?? null })),
    defaultProfileIndex,
  );
  return NextResponse.json(
    { id: account.id, label: account.label, default_profile_id: account.default_profile_id, created_at: account.created_at },
    { status: 201 },
  );
}
