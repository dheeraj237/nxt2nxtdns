import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo } from '@/lib/db/repo';

export function GET() {
  return NextResponse.json(accountsRepo.list());
}

export async function POST(req: NextRequest) {
  const { label, apiKey } = (await req.json().catch(() => ({}))) as { label?: string; apiKey?: string };
  if (!label || !apiKey) return NextResponse.json({ error: 'label and apiKey required' }, { status: 400 });
  const row = accountsRepo.create(label, apiKey);
  return NextResponse.json({ id: row.id, label: row.label, created_at: row.created_at }, { status: 201 });
}
