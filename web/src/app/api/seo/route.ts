/* SEO / GEO add-on (§9 /admin/seo) — subscription flag + the two
   AI-readable files. GET reports what is uploaded; PUT toggles the service. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const GET = handler(async () => {
  const user = await requireUser();
  const [cfg, files] = await Promise.all([
    db.seoConfig.findUnique({ where: { orgId: user.orgId } }),
    db.seoFile.findMany({ where: { orgId: user.orgId } }),
  ]);
  return ok({
    subscribed: cfg?.subscribed ?? false,
    files: Object.fromEntries(files.map((f) => [f.key, {
      filename: f.filename, sizeBytes: f.sizeBytes, uploadedAt: f.uploadedAt.getTime(),
    }])),
  });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');
  const body = (await req.json().catch(() => null)) as { subscribed?: boolean } | null;
  if (typeof body?.subscribed !== 'boolean') throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const saved = await db.seoConfig.upsert({
    where: { orgId: user.orgId },
    create: { orgId: user.orgId, subscribed: body.subscribed },
    update: { subscribed: body.subscribed },
  });
  await audit({ user, orgId: user.orgId, action: 'seo.subscription', entity: 'seoConfig', entityId: user.orgId, after: { subscribed: saved.subscribed } });
  return ok({ subscribed: saved.subscribed });
});
