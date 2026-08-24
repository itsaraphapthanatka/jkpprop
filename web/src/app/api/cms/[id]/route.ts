/* PUT /api/cms/:id — save draft / publish one CMS item (§9).
   DELETE /api/cms/:id — remove one item.
   Publishing needs the `publish` privilege (MATRIX "เผยแพร่หน้าเว็บ"),
   editing the body does not. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { refreshPublicPages } from '@/lib/server/publicCache';
import { requireUser, requireRole, requirePriv } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';

type LangBlock = { title?: string; body?: string; done?: boolean };
type Content = Record<string, LangBlock>;

export const PUT = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing', 'translator');
  const { id } = await ctx.params;

  const page = await db.cmsPage.findFirst({ where: { id, orgId: user.orgId } });
  if (!page) throw new ApiError('NOT_FOUND', 'ไม่พบเนื้อหานี้', 404);

  const body = (await req.json().catch(() => null)) as
    | { lang?: string; title?: string; body?: string; category?: string; cover?: string | null; links?: string[]; status?: string; slug?: string }
    | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const lang = ['th', 'en', 'zh'].includes(String(body.lang)) ? String(body.lang) : 'th';
  const content = { ...((page.content ?? {}) as Content) };
  const block: LangBlock = { ...(content[lang] ?? {}) };
  if (typeof body.title === 'string') block.title = body.title.slice(0, 300);
  if (typeof body.body === 'string') block.body = body.body.slice(0, 100_000);
  // a language counts as translated once it has a body
  block.done = !!(block.body && block.body.trim());
  content[lang] = block;

  const data: Prisma.CmsPageUpdateInput = { content: content as Prisma.InputJsonValue };
  // the Thai title is the record's display title
  if (lang === 'th' && typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 300);
  if (typeof body.category === 'string') data.category = body.category.slice(0, 120);

  /* The slug is the public URL. The editor showed it with an "แก้" link that
     did nothing, because there was no way to change it here. Same normalising
     and same duplicate check as POST, so the two cannot disagree. */
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) throw new ApiError('VALIDATION', 'slug ต้องมีตัวอักษร a-z หรือ 0-9', 400, { slug: 'slug ไม่ถูกต้อง' });
    if (slug !== page.slug) {
      const dup = await db.cmsPage.findFirst({
        where: { orgId: user.orgId, kind: page.kind, slug, NOT: { id } },
      });
      if (dup) throw new ApiError('DUPLICATE', 'slug นี้มีอยู่แล้วในหมวดนี้', 400, { slug: 'slug ซ้ำ' });
      data.slug = slug;
    }
  }
  if (body.cover !== undefined) data.cover = body.cover;
  if (Array.isArray(body.links)) data.links = body.links.map(String).slice(0, 20);

  if (typeof body.status === 'string') {
    if (!['draft', 'published'].includes(body.status)) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);
    if (body.status === 'published') requirePriv(user, 'publish');
    data.status = body.status;
  }

  const updated = await db.cmsPage.update({ where: { id }, data });
  await audit({
    user, orgId: user.orgId,
    action: body.status === 'published' ? 'cms.publish' : 'cms.save',
    entity: 'cmsPage', entityId: id,
    before: { status: page.status }, after: { status: updated.status, lang },
  });

  refreshPublicPages();
  const out = (updated.content ?? {}) as Content;
  return ok({
    id: updated.id, status: updated.status, category: updated.category,
    slug: updated.slug,
    cover: updated.cover, links: updated.links,
    langs: ['th', 'en', 'zh'].map((k) => ({ k: k.toUpperCase(), on: !!out[k]?.done })),
  });
});

/* Removing content had no route at all, so a page created by mistake could
   only be taken out by hand in the database.
 *
 * home / about / contact under kind "pages" are not documents — they are the
 * metadata rows for pages that have their own components, and deleting one
 * would strip that page's title and description with no way back through the
 * UI. They are refused here rather than merely hidden in the client. */
const RESERVED_PAGE_SLUGS = new Set(['home', 'about', 'contact']);

export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');
  const { id } = await ctx.params;

  const page = await db.cmsPage.findFirst({ where: { id, orgId: user.orgId } });
  if (!page) throw new ApiError('NOT_FOUND', 'ไม่พบเนื้อหานี้', 404);

  if (page.kind === 'pages' && RESERVED_PAGE_SLUGS.has(page.slug)) {
    throw new ApiError(
      'FORBIDDEN',
      'หน้านี้เป็นหน้าหลักของเว็บ ลบไม่ได้ — แก้ไขเนื้อหาได้ แต่ต้องมีอยู่เสมอ',
      400,
    );
  }

  await db.cmsPage.delete({ where: { id } });
  await audit({
    user, orgId: user.orgId, action: 'cms.delete', entity: 'cmsPage', entityId: id,
    before: { kind: page.kind, slug: page.slug, title: page.title, status: page.status },
  });
  refreshPublicPages();
  return ok({ id });
});
