import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jamia-laundry-secret-key-2026-super-secure-token'
);

const COOKIE_NAME = 'jamia_laundry_session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files, api routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // If on login page and already logged in, redirect to counter
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/counter', req.url));
    }
    return NextResponse.next();
  }

  // If not logged in and accessing protected pages, redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/counter/:path*',
    '/deliveries/:path*',
    '/receipts/:path*',
    '/students/:path*',
    '/items/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/users/:path*',
  ],
};
