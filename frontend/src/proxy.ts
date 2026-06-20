import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from '@/i18n/config';

const PUBLIC_PATHS = ['/login'];

function attachLocaleCookie(request: NextRequest, response: NextResponse) {
  const localeCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  if (!isLocale(localeCookie)) {
    response.cookies.set(LOCALE_COOKIE_NAME, DEFAULT_LOCALE, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'strict',
    });
  }

  return response;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) {
    return attachLocaleCookie(req, NextResponse.next());
  }

  // Check for token in cookies (the client also mirrors auth state into a cookie)
  const token = req.cookies.get('pharmacy_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return attachLocaleCookie(req, NextResponse.redirect(loginUrl));
  }

  return attachLocaleCookie(req, NextResponse.next());
}

export const config = {
  // Run proxy on app routes, not Next.js internals or static assets.
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};
