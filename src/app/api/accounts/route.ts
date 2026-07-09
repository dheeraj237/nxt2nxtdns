import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { listProfiles } from '@/lib/nextdns/endpoints';

export function GET() {
  return NextResponse.json(accountsRepo.list());
}

export async function POST(req: NextRequest) {
  const { label, apiKey } = (await req.json().catch(() => ({}))) as { label?: string; apiKey?: string };
  if (!label || !apiKey) return NextResponse.json({ error: 'label and apiKey required' }, { status: 400 });
  const row = accountsRepo.create(label, apiKey);

  try {
    const remoteProfiles = await listProfiles(apiKey);
    for (const p of remoteProfiles) {
      profilesRepo.create(row.id, p.id, p.name ?? null);
    }
  } catch {
    // best-effort: account creation still succeeds with zero profiles, user can add manually
  }

  return NextResponse.json({ id: row.id, label: row.label, created_at: row.created_at }, { status: 201 });
}
