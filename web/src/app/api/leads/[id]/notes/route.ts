/* POST /api/leads/:id/notes — Timeline & Notes (§6.1: "ตอนนี้เพิ่มได้แต่หายเมื่อ refresh"). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  if (user.scope === 'own' && lead.assigneeId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะ lead ที่ได้รับมอบหมาย', 403);
  }
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = String(body?.text || '').trim();
  if (!text) throw new ApiError('VALIDATION', 'กรุณากรอกข้อความ', 400);

  const note = await db.leadNote.create({ data: { leadId: id, userId: user.id, text: text.slice(0, 2000) } });
  await audit({ user, orgId: user.orgId, action: 'lead.note', entity: 'lead', entityId: id, after: { note: note.text } });
  return ok({ id: note.id, text: note.text, createdAt: note.createdAt.getTime(), by: user.name });
});

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  const notes = await db.leadNote.findMany({ where: { leadId: id }, orderBy: { createdAt: 'asc' } });
  return ok({ items: notes.map((n) => ({ id: n.id, text: n.text, createdAt: n.createdAt.getTime() })) });
});
