/* DELETE /api/media/:id — MATRIX "คลังสื่อ — ลบไฟล์": owner + manager only
   (destructive; affects listings that use the image). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { removeObject } from '@/lib/server/mediaStore';

export const runtime = 'nodejs';

export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager');
  const { id } = await ctx.params;

  const asset = await db.mediaAsset.findFirst({ where: { id, orgId: user.orgId } });
  if (!asset) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  await db.mediaAsset.delete({ where: { id } });
  await removeObject(asset.id, asset.mime);

  await audit({
    user, orgId: user.orgId, action: 'media.delete', entity: 'mediaAsset', entityId: id,
    before: { filename: asset.filename, mime: asset.mime, size: asset.size },
  });
  return ok({ ok: true });
});
