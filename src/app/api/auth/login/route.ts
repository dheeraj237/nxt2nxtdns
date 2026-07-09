import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, timingSafeEqual } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password) return NextResponse.json({ error: 'password required' }, { status: 400 });

  if (!timingSafeEqual(password, env.masterPassword)) {
    return NextResponse.json({ error: 'invalid password' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
