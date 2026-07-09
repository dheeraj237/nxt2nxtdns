import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo, MasterValidationError } from '@/lib/db/repo';

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    accountsRepo.setMaster(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof MasterValidationError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
