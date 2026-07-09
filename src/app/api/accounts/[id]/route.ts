import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo } from '@/lib/db/repo';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { apiKey } = (await req.json().catch(() => ({}))) as { apiKey?: string };
  if (!apiKey) return NextResponse.json({ error: 'apiKey required' }, { status: 400 });
  accountsRepo.updateApiKey(id, apiKey);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  accountsRepo.delete(id);
  return new NextResponse(null, { status: 204 });
}
