/* Two jobs:
   1. Admin guard — every /admin page except the auth screens needs the session
      cookie. Cookie presence only (middleware has no DB); the real check is
      requireUser() at the API layer and in server components.
   2. Locale routing — the public site is locale-first (/th /en /zh). A path
      with no locale is redirected to the default, and the resolved locale is
      passed to the root layout as a header so it can set <html lang>.
*/
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';

const OPEN_ADMIN = ['/admin/login', '/admin/forgot-password'];

/* Paths that are intentionally locale-free: the API, the admin app (Thai only,
   AGENT.md §8), the tokenized client view, and the internal reference pages. */
const NO_LOCALE = ['/api', '/admin', '/client-shortlist', '/cms-sitemap', '/site-index', '/llms.txt', '/robots.txt', '/sitemap.xml'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const open = OPEN_ADMIN.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (!open && !req.cookies.get('jkp_session')?.value) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (NO_LOCALE.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const first = pathname.split('/')[1] ?? '';
  if (isLocale(first)) {
    // hand the resolved locale to the root layout for <html lang>, and the
    // path to the locale layout, which turns it into canonical + hreflang
    const res = NextResponse.next();
    res.headers.set('x-locale', first);
    res.headers.set('x-pathname', pathname);
    return res;
  }

  // no locale in the path → send to the default one, keeping the rest
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  // skip Next internals and anything with a file extension (static assets)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|.*\\..*).*)'],
};
