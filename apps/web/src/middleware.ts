import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Run on public paths only. Exclude API, Next internals, /admin (single
  // language, no locale prefix), and anything with a file extension
  // (robots.txt, sitemap.xml, images, etc.).
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
};
