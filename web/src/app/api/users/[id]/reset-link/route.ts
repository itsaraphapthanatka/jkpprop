/* POST /api/users/:id/reset-link — เจ้าของระบบออกลิงก์ตั้งรหัสผ่านใหม่ให้คนในทีม
 *
 * ก่อนหน้านี้ไม่มีคำสั่งนี้เลย · รหัสผ่านชั่วคราวถูกโชว์ครั้งเดียวตอนเชิญ ปิด
 * หน้าต่างแล้วหายถาวร และหน้า "ลืมรหัสผ่าน" ก็เป็นฉากเปล่า คนที่เข้าไม่ได้จึง
 * ไม่มีทางกลับเข้าระบบได้อีกเลย นอกจากแก้ที่ฐานข้อมูลโดยตรง
 */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { issueResetToken, pruneExpiredTokens } from '@/lib/server/passwordReset';
import { sendMail, resetMail, mailConfigured } from '@/lib/server/mail';

export const runtime = 'nodejs';

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireUser();
  requireRole(actor, 'owner');
  const { id } = await ctx.params;

  const target = await db.user.findFirst({ where: { id, orgId: actor.orgId } });
  if (!target) throw new ApiError('NOT_FOUND', 'ไม่พบผู้ใช้รายนี้', 404);
  if (!target.active) throw new ApiError('VALIDATION', 'บัญชีนี้ถูกปิดใช้งานอยู่ — เปิดใช้งานก่อนจึงจะออกลิงก์ได้', 400);

  await pruneExpiredTokens().catch(() => 0);
  const { token, hours } = await issueResetToken(target.id, 'reset');
  const url = new URL(`/admin/reset-password?token=${encodeURIComponent(token)}`, new URL(req.url).origin).toString();

  const mail = resetMail(target.name || target.email, url, hours);
  const sent = await sendMail(target.email, mail.subject, mail.html, mail.text);

  await audit({
    user: actor, orgId: actor.orgId, action: 'user.reset_link', entity: 'user', entityId: target.id,
    after: { email: target.email, mailed: sent.ok, reason: sent.ok ? null : sent.reason },
  });

  /* ส่งเมลไม่ได้ → คืนลิงก์มาให้เจ้าของระบบคัดลอกส่งเองทางไลน์หรือช่องทางอื่น
     ลิงก์นี้เปิดบัญชีได้จริง จึงคืนให้เฉพาะเจ้าของระบบที่เพิ่งกดขอเท่านั้น */
  return ok({ email: target.email, mailed: sent.ok, mailConfigured: mailConfigured(), hours, url: sent.ok ? null : url });
});
