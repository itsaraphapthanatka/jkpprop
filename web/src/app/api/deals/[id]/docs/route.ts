/* Documents on a deal (Flow D).
   GET  — what is attached
   POST — attach a file (multipart)

   The screen listed three PDFs with sizes and upload dates beside an upload
   button that had no handler; there was no table and no route. Files go
   through the same store as the media library, so local disk and S3 both keep
   working without a code change. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { putObject, EXT_BY_MIME, MAX_UPLOAD_BYTES } from '@/lib/server/mediaStore';

/* Contracts and company papers, not arbitrary uploads: a deal folder is not a
   place to park executables. */
const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

async function scopedDeal(id: string, orgId: string) {
  const deal = await db.deal.findFirst({ where: { id, orgId } });
  if (!deal) throw new ApiError('NOT_FOUND', 'ไม่พบดีลนี้', 404);
  return deal;
}

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await scopedDeal(id, user.orgId);

  const rows = await db.dealDocument.findMany({ where: { dealId: id }, orderBy: { createdAt: 'desc' } });
  return ok({
    items: rows.map((d) => ({
      id: d.id, filename: d.filename, mime: d.mime, size: d.size,
      status: d.status, createdAt: d.createdAt.getTime(),
      url: `/api/deals/${id}/docs/${d.id}`,
    })),
  });
});

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops');
  const { id } = await ctx.params;
  const deal = await scopedDeal(id, user.orgId);

  /* A closed deal's paperwork is part of the record. Unlocking is a deliberate
     act with its own privilege — the same gate the financials sit behind. */
  if (deal.locked) throw new ApiError('VALIDATION', 'ดีลนี้ปิดแล้ว — ปลดล็อกก่อนจึงจะแนบเอกสารเพิ่มได้', 400);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!form || !(file instanceof File)) throw new ApiError('VALIDATION', 'ไม่พบไฟล์ที่อัปโหลด', 400);
  if (!file.size) throw new ApiError('VALIDATION', 'ไฟล์ว่าง', 400);
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError('VALIDATION', 'ไฟล์ใหญ่เกิน 10MB', 400);
  if (!ALLOWED.has(file.type)) {
    throw new ApiError('VALIDATION', 'รองรับ PDF และรูปภาพเท่านั้น', 400, { file: 'ชนิดไฟล์ไม่รองรับ' });
  }

  const status = String(form.get('status') || '').trim() === 'ครบ' ? 'ครบ' : 'รอเซ็น';
  const created = await db.dealDocument.create({
    data: {
      orgId: user.orgId,
      dealId: id,
      filename: (file.name || `document.${EXT_BY_MIME[file.type] ?? 'bin'}`).slice(0, 300),
      mime: file.type,
      size: file.size,
      status,
      uploaderId: user.id,
    },
  });

  try {
    await putObject(created.id, file.type, Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    // a row pointing at a file that was never written is worse than no row
    await db.dealDocument.delete({ where: { id: created.id } }).catch(() => null);
    throw e;
  }

  await audit({
    user, orgId: user.orgId, action: 'deal.doc.add', entity: 'deal', entityId: id,
    after: { doc: created.filename, size: created.size },
  });

  return ok({
    id: created.id, filename: created.filename, mime: created.mime, size: created.size,
    status: created.status, createdAt: created.createdAt.getTime(),
    url: `/api/deals/${id}/docs/${created.id}`,
  }, { status: 201 });
});
