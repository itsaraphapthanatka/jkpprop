/* CMS content (§9 /admin/cms).
   GET  ?kind=pages|articles|faq|certs — list + per-kind counts
   POST — create an item
   RBAC per MATRIX "CMS / Page Builder / Sections": owner + marketing */
import { ok, handler, ApiError } from '@/lib/server/api';
import { refreshPublicPages } from '@/lib/server/publicCache';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';

// Next.js route modules may only export handlers + config, so the shared
// constants live in lib/server/cms.ts
const KINDS = ['pages', 'articles', 'faq', 'certs'] as const;

type LangBlock = { title?: string; body?: string; done?: boolean };
type Content = Record<string, LangBlock>;

const LANGS = ['th', 'en', 'zh'] as const;

const langFlags = (content: Content) =>
  LANGS.map((k) => ({ k: k.toUpperCase(), on: !!content?.[k]?.done }));

/* Every language, not just Thai.
 *
 * This list was the editor's only source of content and it returned
 * `content.th.body` no matter which language tab was open, so /admin/cms
 * showed Thai in the EN and 中文 tabs even for entries that were fully
 * translated. Worse than confusing: the editor holds those fields in state and
 * PUTs them back under the selected language, so opening the EN tab and
 * pressing Publish wrote the Thai text over the English translation. */
const blocksOf = (content: Content) =>
  Object.fromEntries(
    LANGS.map((k) => [k, { title: content?.[k]?.title ?? '', body: content?.[k]?.body ?? '' }]),
  ) as Record<string, { title: string; body: string }>;

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const kind = new URL(req.url).searchParams.get('kind') || '';

  const rows = await db.cmsPage.findMany({
    where: { orgId: user.orgId, ...(KINDS.includes(kind as typeof KINDS[number]) ? { kind } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 300,
  });
  const all = await db.cmsPage.groupBy({ by: ['kind'], where: { orgId: user.orgId }, _count: true });

  return ok({
    items: rows.map((p) => {
      const content = (p.content ?? {}) as Content;
      return {
        id: p.id,
        kind: p.kind,
        slug: p.slug,
        title: p.title,
        category: p.category,
        status: p.status,
        cover: p.cover,
        links: p.links,
        body: content.th?.body ?? '',
        blocks: blocksOf(content),
        langs: langFlags(content),
        updatedAt: p.updatedAt.getTime(),
      };
    }),
    counts: Object.fromEntries(all.map((g) => [g.kind, g._count])),
  });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');

  const body = (await req.json().catch(() => null)) as
    | { kind?: string; title?: string; slug?: string; category?: string }
    | null;
  const title = String(body?.title || '').trim();
  if (!title) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อเรื่อง', 400, { title: 'กรุณากรอกชื่อเรื่อง' });
  const kind = KINDS.includes(body?.kind as typeof KINDS[number]) ? body!.kind! : 'articles';

  // slug: use what was sent, else a transliteration-free fallback that stays unique
  const base = String(body?.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  const slug = base || `content-${Date.now().toString(36)}`;
  const dup = await db.cmsPage.findFirst({ where: { orgId: user.orgId, kind, slug } });
  if (dup) throw new ApiError('DUPLICATE', 'slug นี้มีอยู่แล้วในหมวดนี้', 400, { slug: 'slug ซ้ำ' });

  const created = await db.cmsPage.create({
    data: {
      orgId: user.orgId, kind, slug, title,
      category: String(body?.category || '').slice(0, 120),
      content: { th: { title, body: '', done: true } } as Prisma.InputJsonValue,
    },
  });
  await audit({ user, orgId: user.orgId, action: 'cms.create', entity: 'cmsPage', entityId: created.id, after: { kind, slug, title } });
  refreshPublicPages();
  return ok({ id: created.id, slug: created.slug }, { status: 201 });
});
