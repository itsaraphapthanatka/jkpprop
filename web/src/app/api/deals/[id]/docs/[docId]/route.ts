/* One document on a deal.
   GET    — download it (signed-in only; deal paperwork is never public)
   PATCH  — mark it รอเซ็น / ครบ
   DELETE — remove it, file and row together */
import { handler, ok, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { getObject, removeObject } from '@/lib/server/mediaStore';

type Ctx = { params: Promise<{ id: string; docId: string }> };

async function scopedDoc(id: string, docId: string, orgId: string) {
  const doc = await db.dealDocument.findFirst({ where: { id: docId, dealId: id, orgId } });
  if (!doc) throw new ApiError('NOT_FOUND', 'ไม่พบเอกสารนี้', 404);
  return doc;
}

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id, docId } = await ctx.params;
  const doc = await scopedDoc(id, docId, user.orgId);

  const body = await getObject(doc.id, doc.mime);
  if (!body) throw new ApiError('NOT_FOUND', 'ไฟล์หายจากที่เก็บ', 404);

  /* HTTP headers are latin-1, and in this product a filename is almost always
     Thai — putting it in raw threw and the download died. RFC 5987 carries the
     real name; the plain `filename` is an ASCII fallback for old clients. */
  const ascii = doc.filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\r\n]/g, '');
  const utf8 = encodeURIComponent(doc.filename).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': doc.mime,
      // inline so a contract opens in the browser rather than landing in Downloads
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${utf8}`,
      'Cache-Control': 'private, max-age=60',
    },
  });
});

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops');
  const { id, docId } = await ctx.params;
  await scopedDoc(id, docId, user.orgId);

  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = String(body?.status || '');
  if (!['รอเซ็น', 'ครบ'].includes(status)) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);

  await db.dealDocument.update({ where: { id: docId }, data: { status } });
  await audit({ user, orgId: user.orgId, action: 'deal.doc.status', entity: 'deal', entityId: id, after: { docId, status } });
  return ok({ id: docId, status });
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager');
  const { id, docId } = await ctx.params;
  const doc = await scopedDoc(id, docId, user.orgId);

  await db.dealDocument.delete({ where: { id: docId } });
  await removeObject(doc.id, doc.mime).catch(() => null);
  await audit({ user, orgId: user.orgId, action: 'deal.doc.delete', entity: 'deal', entityId: id, before: { doc: doc.filename } });
  return ok({ ok: true });
});
