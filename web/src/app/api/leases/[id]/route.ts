/* PATCH / DELETE /api/leases/:id — edit, renew, close or remove a lease.
   Closing is what stops the expiry bell nagging about a contract that has
   already been dealt with; before this there was no way to say so. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { leaseInput } from '@/lib/server/leases';

async function find(id: string, orgId: string) {
  const row = await db.lease.findFirst({ where: { id, orgId } });
  if (!row) throw new ApiError('NOT_FOUND', 'ไม่พบสัญญานี้', 404);
  return row;
}

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'ops');
  const { id } = await ctx.params;
  const before = await find(id, user.orgId);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  /* a status-only change (ปิดสัญญา / ต่อสัญญาแล้ว) must not have to resend
     every field — the row it already has is the rest of the answer */
  const merged = {
    code: body.code ?? before.code,
    title: body.title ?? before.title,
    tenant: body.tenant ?? before.tenant,
    startDate: body.startDate ?? before.startDate?.toISOString() ?? null,
    endDate: body.endDate ?? before.endDate.toISOString(),
    rent: body.rent ?? before.rent,
    status: body.status ?? before.status,
    href: body.href ?? before.href,
  };
  const data = leaseInput(merged);

  if (data.code !== before.code) {
    const prop = await db.property.findFirst({ where: { orgId: user.orgId, publicCode: data.code } });
    if (!prop) throw new ApiError('NOT_FOUND', `ไม่พบทรัพย์รหัส ${data.code}`, 404);
  }

  const updated = await db.lease.update({ where: { id }, data });
  await audit({
    user, orgId: user.orgId, action: 'lease.update', entity: 'lease', entityId: id,
    before: { tenant: before.tenant, endDate: before.endDate, rent: before.rent, status: before.status },
    after: { tenant: updated.tenant, endDate: updated.endDate, rent: updated.rent, status: updated.status },
  });
  return ok(updated);
});

export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager'); // destructive — the tightest pair
  const { id } = await ctx.params;
  const row = await find(id, user.orgId);

  await db.lease.delete({ where: { id } });
  await audit({
    user, orgId: user.orgId, action: 'lease.delete', entity: 'lease', entityId: id,
    before: { code: row.code, tenant: row.tenant, endDate: row.endDate },
  });
  return ok({ ok: true });
});
