/* Route guard — every /admin page except the auth screens requires the
   session cookie. Cookie presence only (middleware has no DB access);
   real validation happens in requireUser() at the API layer and in
   server components. */
import { NextRequest, NextResponse } from 'next/server';

const OPEN_ADMIN = ['/admin/login', '/admin/forgot-password'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (OPEN_ADMIN.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  if (!req.cookies.get('jkp_session')?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
