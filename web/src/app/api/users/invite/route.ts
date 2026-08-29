/* POST /api/users/invite (§12.5) — owner only.
 *
 * เดิมไม่มีการส่งอีเมล จึงสร้างบัญชีพร้อมรหัสผ่านชั่วคราวแล้วคืนค่ามาให้เจ้าของ
 * ระบบส่งต่อเอง — หน้าจอโชว์ใน alert ครั้งเดียว ปิดแล้วหายถาวร และไม่มีคำสั่ง
 * ออกใหม่ให้เลย คนที่ถูกเชิญจึงเข้าระบบไม่ได้อีก
 * (คุณกิตติพงษ์แจ้ง 29 ส.ค. 2569 ว่าให้สิทธิ์ทีม Marketing แล้วแต่ไม่มีเมลส่งไป)
 *
 * ตอนนี้ส่งลิงก์ตั้งรหัสผ่านไปทางอีเมล — ปลอดภัยกว่าส่งรหัสผ่านตัวจริง เพราะ
 * ลิงก์ใช้ได้ครั้งเดียวและหมดอายุเอง · ถ้ายังไม่ได้ตั้งค่าระบบอีเมล ยังคืนรหัส
 * ชั่วคราวมาให้ส่งต่อเองเหมือนเดิม และบอกหน้าจอตรง ๆ ว่าไม่ได้ส่ง */
import { randomBytes } from 'crypto';
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole, hashPassword } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { ROLES, initialPrivs, type RoleKey } from '@/lib/rbac';
import { issueResetToken } from '@/lib/server/passwordReset';
import { sendMail, inviteMail, mailConfigured } from '@/lib/server/mail';

export const POST = handler(async (req: Request) => {
  const actor = await requireUser();
  requireRole(actor, 'owner');

  const body = (await req.json().catch(() => null)) as { email?: string; name?: string; role?: string; expiresAt?: string } | null;
  const email = String(body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) throw new ApiError('VALIDATION', 'กรุณากรอกอีเมลให้ถูกต้อง', 400, { email: 'กรุณากรอกอีเมลให้ถูกต้อง' });

  const roleDef = ROLES.find((r) => r.key === body?.role);
  if (!roleDef) throw new ApiError('VALIDATION', 'บทบาทไม่ถูกต้อง', 400);

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) throw new ApiError('DUPLICATE', 'อีเมลนี้มีบัญชีอยู่แล้ว', 400, { email: 'อีเมลนี้มีบัญชีอยู่แล้ว' });

  let expiresAt: Date | null = null;
  if (body?.expiresAt) {
    const d = new Date(body.expiresAt);
    if (!isNaN(d.getTime())) expiresAt = d;
  }
  if (roleDef.external && !expiresAt) {
    throw new ApiError('VALIDATION', 'บทบาทภายนอกต้องกำหนดวันหมดอายุ', 400, { expiresAt: 'กรุณากำหนดวันหมดอายุ' });
  }

  const tempPassword = randomBytes(6).toString('base64url');
  const created = await db.user.create({
    data: {
      orgId: actor.orgId,
      email,
      name: String(body?.name || email.split('@')[0]).slice(0, 120),
      passwordHash: await hashPassword(tempPassword),
      // the temp password is a one-time handover, not an account password
      mustChangePassword: true,
      role: roleDef.key,
      scope: roleDef.defaultScope,
      privileges: initialPrivs(roleDef.key as RoleKey),
      expiresAt,
    },
  });

  /* ลิงก์ตั้งรหัสผ่านของตัวเอง — ส่งไปทางอีเมล ไม่ต้องส่งรหัสผ่านตัวจริงออกไป */
  const { token, hours } = await issueResetToken(created.id, 'invite');
  const url = new URL(`/admin/reset-password?token=${encodeURIComponent(token)}`, new URL(req.url).origin).toString();
  const mail = inviteMail(created.name, url, hours);
  const sent = await sendMail(email, mail.subject, mail.html, mail.text, actor.orgId);

  await audit({
    user: actor, orgId: actor.orgId, action: 'user.invite', entity: 'user', entityId: created.id,
    after: { email, role: roleDef.key, mailed: sent.ok, reason: sent.ok ? null : sent.reason },
  });

  /* ส่งเมลไม่ได้ → คืนรหัสชั่วคราวมาให้ส่งต่อเอง และบอกให้หน้าจอรู้ว่าไม่ได้ส่ง
     ห้ามเงียบแล้วปล่อยให้หน้าจอบอกว่าเชิญเรียบร้อย ทั้งที่ปลายทางไม่ได้อะไรเลย */
  return ok({
    id: created.id,
    email,
    mailed: sent.ok,
    mailConfigured: await mailConfigured(actor.orgId),
    tempPassword: sent.ok ? null : tempPassword,
  }, { status: 201 });
});
