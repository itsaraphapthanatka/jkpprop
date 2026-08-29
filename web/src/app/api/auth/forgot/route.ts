/* POST /api/auth/forgot — ขอลิงก์ตั้งรหัสผ่านใหม่
 *
 * 29 ส.ค. 2569 · หน้า "ลืมรหัสผ่าน" เคยเป็นหน้าจอเปล่า ๆ ที่รอครึ่งวินาทีแล้ว
 * ขึ้นว่า "เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ … แล้ว" โดยไม่มี API อยู่จริง
 * ไม่เคยยิงไปที่เซิร์ฟเวอร์เลยสักครั้ง
 */
import { ok, handler } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { issueResetToken, pruneExpiredTokens } from '@/lib/server/passwordReset';
import { sendMail, resetMail, mailConfigured } from '@/lib/server/mail';
import { audit } from '@/lib/server/audit';

export const runtime = 'nodejs';

/* หน้าเข้าสู่ระบบไม่ควรกลายเป็นเครื่องมือไล่เดาว่าอีเมลไหนมีบัญชีอยู่ —
   ตอบเหมือนกันทุกกรณี ไม่ว่าจะเจอผู้ใช้หรือไม่
   mailConfigured เป็นข้อเท็จจริงของ "ระบบ" ไม่ใช่ของบัญชีใดบัญชีหนึ่ง จึงติดไป
   ได้ทุกคำตอบโดยไม่บอกใบ้ว่าอีเมลนั้นมีอยู่จริงหรือเปล่า — ตอนแรกใส่เฉพาะตอน
   เจอผู้ใช้ ซึ่งทำให้รูปร่างของคำตอบสองกรณีต่างกัน และนั่นคือการรั่วเสียเอง */
const sameAnswer = () => ({ sent: true, mailConfigured: mailConfigured() });

export const POST = handler(async (req: Request) => {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return ok(sameAnswer());

  const user = await db.user.findUnique({ where: { email } });
  /* ปิดใช้งานหรือหมดอายุแล้วก็ไม่ต้องส่ง — ตั้งรหัสใหม่ไปก็เข้าไม่ได้อยู่ดี */
  const usable = user && user.active && (!user.expiresAt || user.expiresAt.getTime() > Date.now());
  if (!usable) return ok(sameAnswer());

  await pruneExpiredTokens().catch(() => 0);
  const { token, hours } = await issueResetToken(user.id, 'reset');
  const url = new URL(`/admin/reset-password?token=${encodeURIComponent(token)}`, new URL(req.url).origin).toString();
  const mail = resetMail(user.name || email, url, hours);
  const res = await sendMail(email, mail.subject, mail.html, mail.text);

  await audit({
    user, orgId: user.orgId, action: 'user.forgot_password', entity: 'user', entityId: user.id,
    after: { delivered: res.ok, reason: res.ok ? null : res.reason },
  });

  /* ส่งไม่สำเร็จก็ยังตอบแบบเดียวกัน แต่บอกหน้าจอว่าระบบอีเมลยังไม่ได้ตั้งค่า
     เพื่อไม่ให้หน้าจอบอกผู้ใช้ว่า "ส่งแล้ว" ทั้งที่ไม่ได้ส่ง — ความผิดพลาดเดิม */
  return ok(sameAnswer());
});
