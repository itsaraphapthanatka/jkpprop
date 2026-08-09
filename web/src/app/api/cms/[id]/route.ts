/* PUT /api/cms/:id — save draft / publish one CMS item (§9).
   Publishing needs the `publish` privilege (MATRIX "เผยแพร่หน้าเว็บ"),
   editing the body does not. */
import { ok, handler, ApiError } from '@/lib/server/api';
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
    | { lang?: string; title?: string; body?: string; category?: string; cover?: string | null; links?: string[]; status?: string }
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

  const out = (updated.content ?? {}) as Content;
  return ok({
    id: updated.id, status: updated.status, category: updated.category,
    cover: updated.cover, links: updated.links,
    langs: ['th', 'en', 'zh'].map((k) => ({ k: k.toUpperCase(), on: !!out[k]?.done })),
  });
});
