/* GET /api/users/assignable — who a lead can be handed to.
   any signed-in user (the assign menu is on every lead)

   The menu offered three names typed into the component — อารยา, วีรพล,
   สมชาย — none of whom have accounts. Picking one set React state and stopped
   there: no request, nothing stored, gone on reload. Meanwhile the column and
   the API behind it were real all along (Lead.assigneeId → User).

   /api/users is owner-only because it exposes roles and privileges; this
   returns the names and ids needed to fill one dropdown, nothing else. */
import { ok, handler } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

export const runtime = 'nodejs';

/** roles that carry leads — a translator has no business owning one */
const CAN_OWN_LEADS = ['owner', 'manager', 'agent', 'ops'];

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.user.findMany({
    where: { orgId: user.orgId, active: true, role: { in: CAN_OWN_LEADS } },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });
  return ok({ items: rows });
});
