import { NextRequest, NextResponse } from 'next/server';
import { profilesRepo } from '@/lib/db/repo';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  profilesRepo.delete(id);
  return new NextResponse(null, { status: 204 });
}
