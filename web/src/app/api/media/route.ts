/* Media library (§10 step 4).
   GET  — list assets (any signed-in user)
   POST — multipart upload · RBAC per MATRIX "คลังสื่อ — อัปโหลด":
          owner, manager, agent, ops, marketing (never co_agent/translator) */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { putObject, publicUrlFor, originalKey, EXT_BY_MIME, MAX_UPLOAD_BYTES } from '@/lib/server/mediaStore';
import { applyWatermark, isWatermarkType, canWatermark } from '@/lib/server/watermark';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.mediaAsset.findMany({ where: { orgId: user.orgId }, orderBy: { createdAt: 'desc' } });
  return ok({
    items: rows.map((m) => ({
      id: m.id,
      name: m.filename,
      mime: m.mime,
      size: m.size,
      // stored at upload time so a CDN switch doesn't rewrite old rows
      src: m.path || publicUrlFor(m.id, m.mime),
      watermarkType: m.watermarkType,
      createdAt: m.createdAt.getTime(),
    })),
    totalBytes: rows.reduce((s, m) => s + m.size, 0),
  });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops', 'marketing');

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!form || !(file instanceof File)) throw new ApiError('VALIDATION', 'ไม่พบไฟล์ที่อัปโหลด', 400);
  if (!EXT_BY_MIME[file.type]) throw new ApiError('VALIDATION', 'รองรับเฉพาะไฟล์ JPG, PNG, WebP, GIF และ PDF', 400);
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError('VALIDATION', 'ไฟล์ใหญ่เกิน 10MB', 400);

  const requested = String(form.get('watermarkType') ?? 'none');
  if (!isWatermarkType(requested)) throw new ApiError('VALIDATION', 'รูปแบบลายน้ำไม่ถูกต้อง', 400);
  // a PDF has nothing to stamp
  const watermarkType = canWatermark(file.type) ? requested : 'none';

  const asset = await db.mediaAsset.create({
    data: {
      orgId: user.orgId,
      filename: (file.name || 'upload').slice(0, 200),
      mime: file.type,
      size: file.size,
      path: '', // filled below once the id exists
      uploaderId: user.id,
      watermarkType,
    },
  });

  // FR-ADM-09: keep the untouched file, serve only the watermarked one
  const original = Buffer.from(await file.arrayBuffer());
  await putObject(asset.id, file.type, original, originalKey(asset.id, file.type));
  const shown = await applyWatermark(original, file.type, watermarkType);
  await putObject(asset.id, file.type, shown);
  const src = publicUrlFor(asset.id, file.type);
  await db.mediaAsset.update({ where: { id: asset.id }, data: { path: src } });

  await audit({
    user, orgId: user.orgId, action: 'media.upload', entity: 'mediaAsset', entityId: asset.id,
    after: { filename: asset.filename, mime: asset.mime, size: asset.size, watermarkType },
  });

  return ok({ id: asset.id, name: asset.filename, mime: asset.mime, size: asset.size, src, watermarkType });
});
