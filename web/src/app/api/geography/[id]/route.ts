/* One geography node: rename it, or remove it.
   PATCH / DELETE — owner + ops (MATRIX "พื้นที่ & นิคม")

   The page could only add. A province typed wrong stayed wrong for good, and
   the only way out was the database — which is not a feature, it is a dead
   end with a form in front of it. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';
import { inventoryCounts, countFor } from '@/lib/server/geoCounts';

export const runtime = 'nodejs';

const KIND_LABEL: Record<string, string> = {
  province: 'จังหวัด', district: 'เขต/อำเภอ', subdistrict: 'แขวง/ตำบล', estate: 'นิคม',
};

async function load(id: string, orgId: string) {
  const row = await db.geoItem.findFirst({ where: { id, orgId } });
  if (!row) throw new ApiError('NOT_FOUND', 'ไม่พบพื้นที่นี้', 404);
  return row;
}

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'ops');
  const { id } = await ctx.params;
  const row = await load(id, user.orgId);

  const body = (await req.json().catch(() => null)) as
    | { th?: string; en?: string; code?: string; type?: string; active?: boolean }
    | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const name = body.th === undefined ? row.name : String(body.th).trim();
  if (!name) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อ', 400, { th: 'กรุณากรอกชื่อ' });
  if (name !== row.name) {
    const dup = await db.geoItem.findFirst({
      where: { orgId: user.orgId, kind: row.kind, name, parentId: row.parentId, id: { not: row.id } },
    });
    if (dup) throw new ApiError('VALIDATION', `มี "${name}" อยู่แล้ว`, 400, { th: `มี "${name}" อยู่แล้ว` });
  }

  const meta: Record<string, string | boolean> = { ...((row.meta ?? {}) as Record<string, string | boolean>) };
  if (body.en !== undefined) meta.en = String(body.en).trim();
  if (body.type !== undefined) meta.type = String(body.type).trim();
  if (body.active !== undefined) meta.active = !!body.active;

  const saved = await db.geoItem.update({
    where: { id: row.id },
    data: {
      name,
      code: body.code === undefined ? row.code : (String(body.code).toUpperCase().slice(0, 3) || null),
      meta: meta as Prisma.InputJsonObject,
    },
  });

  await audit({
    user, orgId: user.orgId, action: 'geography.update', entity: 'geoItem', entityId: row.id,
    before: { name: row.name, code: row.code, meta: row.meta }, after: { name: saved.name, code: saved.code, meta: saved.meta },
  });
  return ok({ id: saved.id });
});

export const DELETE = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'ops');
  const { id } = await ctx.params;
  const row = await load(id, user.orgId);

  /* Refuse rather than cascade. A province holds districts, districts hold
     subdistricts, and properties are addressed by name — deleting the top of
     that quietly is how an inventory loses its addresses. */
  const children = await db.geoItem.count({ where: { orgId: user.orgId, parentId: row.id } });
  if (children) {
    throw new ApiError('CONFLICT', `ลบไม่ได้ — ยังมีพื้นที่ย่อยอยู่ ${children} รายการ ลบข้างในก่อน`, 409);
  }

  const counts = await inventoryCounts(user.orgId);
  const used =
    row.kind === 'province' ? countFor(counts.prov, row.name)
      : row.kind === 'district' ? countFor(counts.dist, row.name)
        : row.kind === 'subdistrict' ? countFor(counts.sub, row.name)
          : 0;
  const force = new URL(req.url).searchParams.get('force') === '1';
  if (used && !force) {
    throw new ApiError(
      'CONFLICT',
      `ลบไม่ได้ — มีทรัพย์ ${used} รายการอยู่ใน${KIND_LABEL[row.kind] ?? 'พื้นที่'}นี้ (ที่อยู่ของทรัพย์จะยังเป็นชื่อเดิม)`,
      409,
    );
  }

  await db.geoItem.delete({ where: { id: row.id } });
  await audit({
    user, orgId: user.orgId, action: 'geography.delete', entity: 'geoItem', entityId: row.id,
    before: { kind: row.kind, name: row.name, usedBy: used },
  });
  return ok({ id: row.id, used });
});
