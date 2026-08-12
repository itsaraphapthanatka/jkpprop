/* POST /api/requirements/:id/checks — record what the landlord said about one
   property, for this requirement (FR-AVL-04).

   The "เช็คทรัพย์ใหม่" button used to run a fake three-second scan and reveal a
   result written into the source. There is nothing to scan: availability is
   something a person asks the landlord and then records here. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

const RESULTS = new Set(['available', 'unavailable']);

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops');
  const { id } = await ctx.params;

  const requirement = await db.requirement.findFirst({ where: { id, orgId: user.orgId } });
  if (!requirement) throw new ApiError('NOT_FOUND', 'ไม่พบ requirement นี้', 404);

  const body = (await req.json().catch(() => null)) as { code?: string; result?: string; note?: string } | null;
  const code = String(body?.code || '').trim();
  const result = String(body?.result || '').trim();
  if (!code) throw new ApiError('VALIDATION', 'กรุณาเลือกทรัพย์', 400, { code: 'กรุณาเลือกทรัพย์' });
  if (!RESULTS.has(result)) throw new ApiError('VALIDATION', 'ผลการเช็คต้องเป็น ว่าง หรือ ไม่ว่าง', 400, { result: 'เลือกผลการเช็ค' });

  const property = await db.property.findFirst({ where: { orgId: user.orgId, publicCode: code } });
  if (!property) throw new ApiError('NOT_FOUND', `ไม่พบทรัพย์รหัส ${code}`, 404);

  /* One row per property per requirement: re-checking replaces the previous
     answer rather than stacking, so the panel always shows the current one. */
  const saved = await db.availabilityCheck.upsert({
    where: { requirementId_propertyId: { requirementId: id, propertyId: property.id } },
    create: {
      requirementId: id, propertyId: property.id, result,
      note: String(body?.note || '').trim().slice(0, 500), checkedBy: user.id,
    },
    update: {
      result, note: String(body?.note || '').trim().slice(0, 500),
      checkedBy: user.id, checkedAt: new Date(),
    },
  });

  await audit({
    user, orgId: user.orgId, action: 'requirement.availability', entity: 'requirement', entityId: id,
    after: { code, result },
  });

  return ok({ id: saved.id, code, result });
});

export const DELETE = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops');
  const { id } = await ctx.params;
  const code = new URL(req.url).searchParams.get('code') || '';
  if (!code) throw new ApiError('VALIDATION', 'ไม่พบทรัพย์ที่จะเอาออก', 400);

  const property = await db.property.findFirst({ where: { orgId: user.orgId, publicCode: code } });
  if (!property) throw new ApiError('NOT_FOUND', `ไม่พบทรัพย์รหัส ${code}`, 404);

  await db.availabilityCheck.deleteMany({ where: { requirementId: id, propertyId: property.id } });
  await audit({
    user, orgId: user.orgId, action: 'requirement.availability.remove',
    entity: 'requirement', entityId: id, before: { code },
  });
  return ok({ ok: true });
});
