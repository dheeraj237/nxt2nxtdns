import { NextRequest, NextResponse } from 'next/server';
import { accountsRepo } from '@/lib/db/repo';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { label, defaultProfileId } = (await req.json().catch(() => ({}))) as {
    label?: string;
    defaultProfileId?: string;
  };

  try {
    if (label !== undefined) accountsRepo.updateLabel(id, label);
    if (defaultProfileId !== undefined) accountsRepo.setDefaultProfile(id, defaultProfileId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  accountsRepo.delete(id);
  return new NextResponse(null, { status: 204 });
}
