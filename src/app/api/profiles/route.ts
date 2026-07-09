import { NextResponse } from 'next/server';
import { profilesRepo } from '@/lib/db/repo';

export function GET() {
  return NextResponse.json(profilesRepo.list());
}
