import { NextRequest, NextResponse } from 'next/server';
import { profilesRepo, ProfileDeletionError } from '@/lib/db/repo';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { autoRefreshLinkedIp } = (await req.json().catch(() => ({}))) as {
    autoRefreshLinkedIp?: boolean;
  };

  try {
    if (autoRefreshLinkedIp !== undefined) {
      profilesRepo.updateAutoRefresh(id, autoRefreshLinkedIp);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    profilesRepo.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof ProfileDeletionError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 });
  }
}
