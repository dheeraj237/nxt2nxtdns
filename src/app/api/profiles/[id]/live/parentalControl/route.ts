import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, profilesRepo } from '@/lib/db/repo';
import { getParentalControl } from '@/lib/nextdns/endpoints';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profilesRepo.get(id);
  if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  const apiKey = accountsRepo.getDecryptedKey(profile.account_id);
  return NextResponse.json(await getParentalControl(apiKey, profile.profile_id));
}
