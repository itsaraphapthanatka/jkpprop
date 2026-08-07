/* Media library (§10 step 4).
   GET  — list assets (any signed-in user)
   POST — multipart upload · RBAC per MATRIX "คลังสื่อ — อัปโหลด":
          owner, manager, agent, ops, marketing (never co_agent/translator) */
import { writeFile } from 'fs/promises';
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { ensureUploadDir, diskPathFor, EXT_BY_MIME, MAX_UPLOAD_BYTES } from '@/lib/server/mediaStore';

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
      src: `/api/media/${m.id}/raw`,
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

  const asset = await db.mediaAsset.create({
    data: {
      orgId: user.orgId,
      filename: (file.name || 'upload').slice(0, 200),
      mime: file.type,
      size: file.size,
      path: '', // filled below once the id exists
      uploaderId: user.id,
    },
  });
  await ensureUploadDir();
  await writeFile(diskPathFor(asset.id, file.type), Buffer.from(await file.arrayBuffer()));
  const src = `/api/media/${asset.id}/raw`;
  await db.mediaAsset.update({ where: { id: asset.id }, data: { path: src } });

  await audit({
    user, orgId: user.orgId, action: 'media.upload', entity: 'mediaAsset', entityId: asset.id,
    after: { filename: asset.filename, mime: asset.mime, size: asset.size },
  });

  return ok({ id: asset.id, name: asset.filename, mime: asset.mime, size: asset.size, src });
});
