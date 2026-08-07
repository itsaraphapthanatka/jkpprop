/* POST /api/leads/:id/tasks — follow-up tasks on a lead (§6.1). */
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
  const body = (await req.json().catch(() => null)) as { title?: string; due?: string } | null;
  const title = String(body?.title || '').trim();
  if (!title) throw new ApiError('VALIDATION', 'กรุณากรอกชื่องาน', 400);

  const due = body?.due ? new Date(body.due) : null;
  const task = await db.leadTask.create({
    data: { leadId: id, userId: user.id, title: title.slice(0, 300), due: due && !isNaN(due.getTime()) ? due : null },
  });
  await audit({ user, orgId: user.orgId, action: 'lead.task', entity: 'lead', entityId: id, after: { task: task.title } });
  return ok({ id: task.id, title: task.title, due: task.due?.getTime() ?? null, done: task.done });
});

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  const tasks = await db.leadTask.findMany({ where: { leadId: id }, orderBy: { createdAt: 'asc' } });
  return ok({ items: tasks.map((t) => ({ id: t.id, title: t.title, due: t.due?.getTime() ?? null, done: t.done })) });
});
