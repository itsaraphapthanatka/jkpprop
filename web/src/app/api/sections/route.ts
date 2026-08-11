/* Page sections (§9 /admin/page-builder + /admin/sections) — both screens
   read and write this one table, so a section edited in either place shows
   up in the other (the two mock shapes had drifted apart).

   GET  ?page=home|about|contact
   PUT  — upsert the whole section list for one page (order = array order) */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { mergeSectionContent, type SectionContent as Content } from '@/lib/mergeSectionContent';
import type { Prisma } from '@prisma/client';

const PAGES = ['home', 'about', 'contact', 'faq'];

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const page = new URL(req.url).searchParams.get('page') || '';

  const rows = await db.pageSection.findMany({
    where: { orgId: user.orgId, ...(PAGES.includes(page) ? { pageKey: page } : {}) },
    orderBy: [{ pageKey: 'asc' }, { sort: 'asc' }],
  });
  return ok({
    items: rows.map((s) => ({
      id: s.id,
      pageKey: s.pageKey,
      key: s.key,
      type: s.type,
      name: s.name,
      desc: s.desc,
      sort: s.sort,
      enabled: s.enabled,
      img: s.img,
      content: (s.content ?? {}) as Content,
    })),
  });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');

  const body = (await req.json().catch(() => null)) as
    | { page?: string; sections?: { key: string; type?: string; name?: string; desc?: string; enabled?: boolean; img?: string | null; content?: Content }[] }
    | null;
  const page = String(body?.page || '');
  if (!PAGES.includes(page)) throw new ApiError('VALIDATION', 'ไม่พบหน้าที่ระบุ', 400);
  const sections = Array.isArray(body?.sections) ? body!.sections! : [];
  if (!sections.length) throw new ApiError('VALIDATION', 'ไม่มี section ให้บันทึก', 400);

  const before = await db.pageSection.findMany({ where: { orgId: user.orgId, pageKey: page }, orderBy: { sort: 'asc' } });

  const storedByKey = new Map(before.map((r) => [r.key, (r.content ?? {}) as Content]));

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const key = String(s.key || '').slice(0, 60);
    if (!key) continue;
    const data = {
      type: s.type === 'hero' ? 'hero' : 'section',
      name: String(s.name || key).slice(0, 120),
      desc: String(s.desc || '').slice(0, 300),
      sort: i, // array order IS the display order
      enabled: s.enabled !== false,
      img: s.img ?? null,
      content: mergeSectionContent(storedByKey.get(key) ?? {}, s.content ?? {}) as Prisma.InputJsonValue,
    };
    await db.pageSection.upsert({
      where: { orgId_pageKey_key: { orgId: user.orgId, pageKey: page, key } },
      create: { orgId: user.orgId, pageKey: page, key, ...data },
      update: data,
    });
  }

  // sections dropped from the payload are removed (the UI soft-deletes first)
  const keep = new Set(sections.map((s) => String(s.key)));
  await db.pageSection.deleteMany({ where: { orgId: user.orgId, pageKey: page, key: { notIn: [...keep] } } });

  await audit({
    user, orgId: user.orgId, action: 'sections.save', entity: 'pageSection', entityId: page,
    before: { count: before.length }, after: { count: sections.length },
  });

  const rows = await db.pageSection.findMany({ where: { orgId: user.orgId, pageKey: page }, orderBy: { sort: 'asc' } });
  return ok({ items: rows.map((s) => ({ id: s.id, key: s.key, sort: s.sort, enabled: s.enabled })) });
});
