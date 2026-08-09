/* Social channels (§6.5). Deleting a channel cascades its per-listing posts
   so no orphan status is left behind (rule #3). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'marketing');
  const body = (await req.json().catch(() => null)) as { key?: string; label?: string } | null;
  const key = String(body?.key || '').trim().slice(0, 60);
  const label = String(body?.label || '').trim().slice(0, 100);
  if (!key || !label) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อช่องทาง', 400);

  const count = await db.socialChannel.count({ where: { orgId: user.orgId } });
  await db.socialChannel.upsert({
    where: { orgId_key: { orgId: user.orgId, key } },
    create: { orgId: user.orgId, key, label, sort: count },
    update: { label },
  });
  await audit({ user, orgId: user.orgId, action: 'social.channel.add', entity: 'socialChannel', entityId: key, after: { key, label } });
  return ok({ key, label });
});

export const DELETE = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'marketing');
  const key = new URL(req.url).searchParams.get('key') || '';
  if (!key) throw new ApiError('VALIDATION', 'ไม่พบช่องทางที่จะลบ', 400);

  await db.$transaction([
    db.socialPost.deleteMany({ where: { orgId: user.orgId, channelKey: key } }), // cascade (rule #3)
    db.socialChannel.deleteMany({ where: { orgId: user.orgId, key } }),
  ]);
  await audit({ user, orgId: user.orgId, action: 'social.channel.delete', entity: 'socialChannel', entityId: key, before: { key } });
  return ok({ ok: true });
});
