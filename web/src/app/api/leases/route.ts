/* GET /api/leases?status=active (§7.1) — the lease book with REAL end dates.
   `endsInDays` is included as a convenience so the client's buildAlerts()
   keeps working unchanged (1 month = 30 days fixed, §11 #6). */
import { ok, handler } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

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
      endDate: l.endDate.toISOString().slice(0, 10),
      endsInDays: Math.floor((l.endDate.getTime() - now) / DAY),
      rent: l.rent,
      status: l.status,
      href: l.href,
    })),
  });
});
