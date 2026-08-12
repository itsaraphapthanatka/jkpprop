/* GET /api/nav-counts — the two sidebar badges.
   They were hardcoded to '18' and '7'. Counts what is *waiting for someone*,
   not the all-time total, which is what a badge is for. */
import { ok, handler } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

export const GET = handler(async () => {
  const user = await requireUser();
  const [leads, requirements] = await Promise.all([
    // untouched enquiries — anything already being worked is not "waiting"
    db.lead.count({ where: { orgId: user.orgId, status: { in: ['new', 'qualified'] } } }),
    db.requirement.count({ where: { orgId: user.orgId, status: 'submitted' } }),
  ]);
  return ok({ leads, requirements });
});
