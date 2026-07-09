import { NextResponse } from 'next/server';
import { killSwitchRepo } from '@/lib/db/repo';

export function GET() {
  return NextResponse.json(killSwitchRepo.asProfile());
}
