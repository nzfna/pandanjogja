import { NextResponse } from 'next/server';
import { verify, COOKIE } from './lib/auth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const ok = await verify(req.cookies.get(COOKIE)?.value);
  if (pathname === '/owner/login') return ok ? NextResponse.redirect(new URL('/owner', req.url)) : NextResponse.next();
  if (!ok) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/owner/login', req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/owner/:path*', '/api/owner/:path*'] };
