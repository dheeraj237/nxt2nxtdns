import { NextResponse } from 'next/server';
import { accountsRepo } from '@/lib/db/repo';
import { listParentalControlServicesCatalog } from '@/lib/nextdns/endpoints';

export async function GET() {
  const apiKey = accountsRepo.getAnyKey();
  if (!apiKey) return NextResponse.json({ error: 'no accounts configured' }, { status: 404 });
  return NextResponse.json(await listParentalControlServicesCatalog(apiKey));
}
