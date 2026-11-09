import { NextResponse } from 'next/server';
import { verify, COOKIE } from './lib/auth';

// Next.js 16: middleware.js -> proxy.js (runtime Node.js, bukan Edge).
// Proxy menangani dua hal: gerbang login owner dan header keamanan per request.

const OWNER_PAGE = /^\/owner(?:\/|$)/;
const OWNER_API = /^\/api\/owner(?:\/|$)/;

function cspFor(nonce) {
  return [
    "default-src 'self'",
    // Nonce dipakai Next.js untuk semua script hydrasinya. strict-dynamic
    // mengizinkan chunk yang dimuat oleh script ber-nonce.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    // Next/Tailwind menulis inline style; Google Fonts memuat stylesheet eksternal.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "media-src 'self' https: blob:",
    "frame-src https://www.youtube.com https://www.instagram.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const needsAuth = OWNER_PAGE.test(pathname) || OWNER_API.test(pathname);

  if (needsAuth) {
    const ok = await verify(req.cookies.get(COOKIE)?.value);
    if (pathname === '/owner/login') {
      if (ok) return NextResponse.redirect(new URL('/owner', req.url));
    } else if (!ok) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/owner/login', req.url));
    }
  }

  // Di dev, biarkan HMR/websocket bebas. CSP nonce hanya di produksi.
  if (process.env.NODE_ENV !== 'production') return NextResponse.next();

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = cspFor(nonce);

  // Header request ini dibaca Next.js untuk menempelkan nonce ke script-nya.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  // Jalankan untuk semua request kecuali aset statis/berekstensi.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
