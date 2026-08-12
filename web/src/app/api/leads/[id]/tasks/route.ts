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

/* PATCH — tick a task off, or rename it.
   Without this the checkbox was decoration: the tick vanished on refresh. */
export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  if (user.scope === 'own' && lead.assigneeId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะ lead ที่ได้รับมอบหมาย', 403);
  }

  const body = (await req.json().catch(() => null)) as { taskId?: string; done?: boolean; title?: string } | null;
  const taskId = String(body?.taskId || '').trim();
  if (!taskId) throw new ApiError('VALIDATION', 'ไม่พบงานที่จะแก้', 400);

  const data: { done?: boolean; title?: string } = {};
  if (typeof body?.done === 'boolean') data.done = body.done;
  if (typeof body?.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 300);
  if (!Object.keys(data).length) throw new ApiError('VALIDATION', 'ไม่มีอะไรให้เปลี่ยน', 400);

  // scoped by leadId as well, so a task id from another lead cannot be steered in
  const hit = await db.leadTask.updateMany({ where: { id: taskId, leadId: id }, data });
  if (!hit.count) throw new ApiError('NOT_FOUND', 'ไม่พบงานนี้', 404);

  await audit({ user, orgId: user.orgId, action: 'lead.task.update', entity: 'lead', entityId: id, after: { taskId, ...data } });
  return ok({ id: taskId, ...data });
});

export const DELETE = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  const taskId = new URL(req.url).searchParams.get('taskId') || '';
  if (!taskId) throw new ApiError('VALIDATION', 'ไม่พบงานที่จะลบ', 400);
  await db.leadTask.deleteMany({ where: { id: taskId, leadId: id } });
  await audit({ user, orgId: user.orgId, action: 'lead.task.delete', entity: 'lead', entityId: id, before: { taskId } });
  return ok({ ok: true });
});
