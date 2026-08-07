/* POST /api/notifications/read — body { ids: string[] } (§7.2).
   readIds are per-user; alert ids are milestone-stable so this sticks
   across reloads and re-alerts on the next milestone by design. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  if (!body || !Array.isArray(body.ids)) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);
  const ids = body.ids.map(String).slice(0, 500);
  const merged = [...new Set([...user.readAlertIds, ...ids])].slice(-1000);
  await db.user.update({ where: { id: user.id }, data: { readAlertIds: merged } });
  return ok({ readIds: merged });
});
