/* Media library (§10 step 4).
   GET  — list assets (any signed-in user)
   POST — multipart upload · RBAC per MATRIX "คลังสื่อ — อัปโหลด":
          owner, manager, agent, ops, marketing (never co_agent/translator) */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { putObject, publicUrlFor, originalKey, EXT_BY_MIME, MAX_UPLOAD_BYTES, StorageWriteError } from '@/lib/server/mediaStore';
import { applyWatermark, isWatermarkType, canWatermark } from '@/lib/server/watermark';

export const runtime = 'nodejs';

/* The library returned every row, and the page rendered every row: 412 cards
   on open, and every one of them a card nobody asked for. Searching happened
   in the browser over the same full list, so a search still cost the whole
   library. Both now happen here. `totalBytes` stays the whole library's,
   because the storage meter is about the library, not about this page. */
const PAGE_MAX = 200;

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const limit = Math.min(PAGE_MAX, Math.max(1, Number(url.searchParams.get('limit') ?? 60)));
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));

  const where = {
    orgId: user.orgId,
    ...(q ? { filename: { contains: q, mode: 'insensitive' as const } } : {}),
  };

  const [rows, total, all] = await Promise.all([
    db.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    db.mediaAsset.count({ where }),
    db.mediaAsset.aggregate({ where: { orgId: user.orgId }, _sum: { size: true }, _count: true }),
  ]);

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
    page,
    limit,
    /** how many rows match the search — what the pager counts */
    total,
    /** the whole library, whatever this page is showing */
    totalBytes: all._sum.size ?? 0,
    totalFiles: all._count,
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

  // FR-ADM-09: keep the untouched file, serve only the watermarked one.
  // If the bytes can't be stored, the row must not survive — an asset with no
  // file behind it shows up in the library as a permanently broken thumbnail.
  let src: string;
  try {
    const original = Buffer.from(await file.arrayBuffer());
    await putObject(asset.id, file.type, original, originalKey(asset.id, file.type));
    const shown = await applyWatermark(original, file.type, watermarkType);
    await putObject(asset.id, file.type, shown);
    src = publicUrlFor(asset.id, file.type);
    await db.mediaAsset.update({ where: { id: asset.id }, data: { path: src } });
  } catch (e) {
    await db.mediaAsset.delete({ where: { id: asset.id } }).catch(() => { /* nothing to undo */ });
    if (e instanceof StorageWriteError) throw new ApiError('STORAGE', e.message, 500);
    throw e;
  }

  await audit({
    user, orgId: user.orgId, action: 'media.upload', entity: 'mediaAsset', entityId: asset.id,
    after: { filename: asset.filename, mime: asset.mime, size: asset.size, watermarkType },
  });

  return ok({ id: asset.id, name: asset.filename, mime: asset.mime, size: asset.size, src, watermarkType });
});
