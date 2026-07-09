import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth';

const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/api/health']);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api');
  const isPublic = PUBLIC_PATHS.has(pathname);

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = Boolean(token) && (await verifySessionToken(token!));

  if (isPublic) {
    if (pathname === '/login' && authenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    if (isApi) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
