/* GET /api/dashboard (§9 /admin) — same aggregation the server page uses,
   exposed for any client that wants to refresh without a reload. */
import { ok, handler } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { buildDashboard } from '@/lib/server/dashboard';

export const GET = handler(async () => {
  const user = await requireUser();
  return ok(await buildDashboard(user));
});
