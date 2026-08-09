/* GET /llms.txt — serves the uploaded AI-readable site guide.
   AGENT.md §9 requires this file to exist; it is authored in /admin/seo. */
import { db } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const f = await db.seoFile.findFirst({ where: { key: 'llms' } });
  const body = f?.body ?? '# JKP Property\n\nยังไม่ได้อัปโหลด llms.txt — ตั้งค่าได้ที่ /admin/seo\n';
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
