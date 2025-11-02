import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  const res = NextResponse.next({ request: { headers: requestHeaders } });

  const isProd = process.env.NODE_ENV === 'production';

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';
  let apiOrigin: string;
  try {
    apiOrigin = new URL(apiBase).origin;
  } catch {
    apiOrigin = 'http://localhost:4000';
  }

  const ga1 = 'https://www.googletagmanager.com';
  const ga2 = 'https://www.google-analytics.com';
  const self = "'self'";

  const scriptExtras = [!isProd && "'unsafe-eval'"].filter(Boolean).join(' ');
  const connectExtras = [!isProd && 'ws:', !isProd && 'wss:'].filter(Boolean).join(' ');

  const parts = [
    `default-src ${self}`,
    `base-uri ${self}`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `form-action ${self}`,
    // Allow Next.js inline runtime to hydrate (adds 'unsafe-inline')
    `script-src ${self} 'nonce-${nonce}' 'unsafe-inline' ${ga1} ${ga2}${scriptExtras ? ' ' + scriptExtras : ''}`,
    // Keep strict; allow inline styles to avoid breaking common libs in client apps
    `style-src ${self} 'unsafe-inline'`,
    `img-src ${self} data: ${ga1} ${ga2}`,
    `font-src ${self} data:`,
    `connect-src ${self} ${apiOrigin} ${ga1} ${ga2}${connectExtras ? ' ' + connectExtras : ''}`,
  ];

  if (isProd) {
    parts.push('upgrade-insecure-requests');
  }

  const csp = parts.join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('x-nonce', nonce);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
