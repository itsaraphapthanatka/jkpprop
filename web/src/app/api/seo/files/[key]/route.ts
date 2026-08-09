/* POST|DELETE /api/seo/files/:key — llms.txt / robots.txt upload.
   Enforces what the UI only advertises: .txt only, 1MB max (§9). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const runtime = 'nodejs';

const KEYS = ['llms', 'robots'];
const MAX_BYTES = 1024 * 1024;

export const POST = handler(async (req: Request, ctx: { params: Promise<{ key: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');
  const { key } = await ctx.params;
  if (!KEYS.includes(key)) throw new ApiError('VALIDATION', 'ไฟล์นี้ไม่รองรับ', 400);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) throw new ApiError('VALIDATION', 'ไม่พบไฟล์ที่อัปโหลด', 400);
  if (!file.name.toLowerCase().endsWith('.txt')) throw new ApiError('VALIDATION', 'รองรับเฉพาะไฟล์ .txt', 400);
  if (file.size > MAX_BYTES) throw new ApiError('VALIDATION', 'ไฟล์ใหญ่เกิน 1MB', 400);

  const text = await file.text();
  const data = { filename: `${key}.txt`, sizeBytes: file.size, body: text, uploadedAt: new Date() };
  await db.seoFile.upsert({
    where: { orgId_key: { orgId: user.orgId, key } },
    create: { orgId: user.orgId, key, ...data },
    update: data,
  });
  await audit({ user, orgId: user.orgId, action: 'seo.file.upload', entity: 'seoFile', entityId: key, after: { sizeBytes: file.size } });
  return ok({ key, filename: data.filename, sizeBytes: data.sizeBytes, uploadedAt: data.uploadedAt.getTime() });
});

export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ key: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');
  const { key } = await ctx.params;
  await db.seoFile.deleteMany({ where: { orgId: user.orgId, key } });
  await audit({ user, orgId: user.orgId, action: 'seo.file.delete', entity: 'seoFile', entityId: key });
  return ok({ ok: true });
});
