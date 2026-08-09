/* GET /robots.txt — serves the uploaded file, or a safe default that keeps
   /admin and the tokenized client view out of every index. */
import { db } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /client-shortlist
Disallow: /site-index
Disallow: /cms-sitemap
`;

export async function GET() {
  const f = await db.seoFile.findFirst({ where: { key: 'robots' } });
  return new Response(f?.body ?? DEFAULT_ROBOTS, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
