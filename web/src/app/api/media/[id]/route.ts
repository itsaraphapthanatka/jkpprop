/* DELETE /api/media/:id — MATRIX "คลังสื่อ — ลบไฟล์": owner + manager only
   (destructive; affects listings that use the image). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { removeObject, originalKey, mediaIdFromSrc } from '@/lib/server/mediaStore';

export const runtime = 'nodejs';

export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager');
  const { id } = await ctx.params;

  const asset = await db.mediaAsset.findFirst({ where: { id, orgId: user.orgId } });
  if (!asset) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  /* ลบไฟล์ที่ถูกตั้งเป็นโลโก้ลายน้ำอยู่ = ลายน้ำหยุดทำงานทั้งเว็บแบบเงียบ ๆ
     เกิดขึ้นมาแล้วจริงเมื่อ 22 ส.ค. 16:22 น. — ลบ 1112.png ออกจากคลังสื่อ
     ตั้งค่ายังบอกว่า "เปิดใช้งาน" แต่ไม่มีรูปไหนถูกปั๊มอีกเลย และไม่มีใครรู้
     จนลูกค้าทักว่า "ลายน้ำไม่ขึ้น" · ต้องไปเปลี่ยนโลโก้ในหน้า Branding ก่อน */
  const branding = await db.branding.findUnique({
    where: { orgId: user.orgId },
    select: { wmSrc: true },
  });
  if (branding?.wmSrc && mediaIdFromSrc(branding.wmSrc) === id) {
    throw new ApiError('VALIDATION', 'ไฟล์นี้ถูกใช้เป็นโลโก้ลายน้ำอยู่ — เปลี่ยนโลโก้ในหน้า Branding ก่อนจึงจะลบได้', 400);
  }

  await db.mediaAsset.delete({ where: { id } });
  await removeObject(asset.id, asset.mime);
  await removeObject(asset.id, asset.mime, originalKey(asset.id, asset.mime));

  await audit({
    user, orgId: user.orgId, action: 'media.delete', entity: 'mediaAsset', entityId: id,
    before: { filename: asset.filename, mime: asset.mime, size: asset.size },
  });
  return ok({ ok: true });
});
