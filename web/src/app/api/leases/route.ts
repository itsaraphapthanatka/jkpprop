/* GET /api/leases?status=active (§7.1) — the lease book with REAL end dates.
   `endsInDays` is included as a convenience so the client's buildAlerts()
   keeps working unchanged (1 month = 30 days fixed, §11 #6). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { leaseInput } from '@/lib/server/leases';

const DAY = 86400000;

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'active';

  const rows = await db.lease.findMany({
    where: { orgId: user.orgId, ...(status !== 'all' ? { status } : {}) },
    orderBy: { endDate: 'asc' },
    take: 500,
  });
  const now = Date.now();
  return ok({
    items: rows.map((l) => ({
      id: l.id,
      code: l.code,
      title: l.title,
      tenant: l.tenant,
      startDate: l.startDate ? l.startDate.toISOString().slice(0, 10) : null,
      endDate: l.endDate.toISOString().slice(0, 10),
      endsInDays: Math.floor((l.endDate.getTime() - now) / DAY),
      rent: l.rent,
      status: l.status,
      href: l.href,
    })),
  });
});

/* POST /api/leases — record a lease.
   Until this existed the table could only be filled by the installer's seed,
   so the expiry notifications had nothing true to say and no way to be given
   anything: the bell was reading a demo book. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'ops');

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);
  const data = leaseInput(body);

  /* the code has to name a property this org actually has — a lease against a
     code nobody owns is exactly what the seeded book was */
  const prop = await db.property.findFirst({ where: { orgId: user.orgId, publicCode: data.code } });
  if (!prop) throw new ApiError('NOT_FOUND', `ไม่พบทรัพย์รหัส ${data.code} — สัญญาต้องผูกกับทรัพย์ที่มีอยู่จริง`, 404);

  const created = await db.lease.create({
    data: { orgId: user.orgId, ...data, title: data.title || prop.title },
  });
  await audit({
    user, orgId: user.orgId, action: 'lease.create', entity: 'lease', entityId: created.id,
    after: { code: created.code, tenant: created.tenant, endDate: created.endDate, rent: created.rent },
  });
  return ok(created, { status: 201 });
});
