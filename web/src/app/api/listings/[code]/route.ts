/* PATCH /api/listings/:code — publish / hide a listing.
   Publish needs the 'publish' privilege (MATRIX "เผยแพร่ประกาศ") and the
   publish gate: a title + at least one photo (v1 form of "≥1 translation +
   cover media", SPEC_PACK FR-LST). Unpublish takes effect immediately. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requirePriv } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

const IN_STATUS: Record<string, string> = { published: 'active', draft: 'draft', hidden: 'hidden' };

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const p = await db.property.findFirst({ where: { orgId: user.orgId, publicCode: code } });
  if (!p) throw new ApiError('NOT_FOUND', 'ไม่พบประกาศนี้', 404);
  if (user.scope === 'own' && p.ownerId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะประกาศของตัวเอง', 403);
  }

  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const next = IN_STATUS[String(body?.status || '')];
  if (!next) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);

  if (next === 'active') {
    requirePriv(user, 'publish');
    const values = (p.values ?? {}) as Record<string, unknown>;
    const photos = Array.isArray(values.photos) ? values.photos : [];
    if (!p.title.trim() || photos.length === 0) {
      throw new ApiError('PUBLISH_GATE', 'เผยแพร่ไม่ได้ — ต้องมีชื่อทรัพย์และรูปอย่างน้อย 1 รูป', 400);
    }
  }

  const updated = await db.property.update({ where: { id: p.id }, data: { status: next } });
  await audit({
    user, orgId: user.orgId, action: next === 'active' ? 'listing.publish' : 'listing.unpublish',
    entity: 'property', entityId: p.id, before: { status: p.status }, after: { status: updated.status },
  });
  return ok({ code: p.publicCode, status: body?.status });
});
