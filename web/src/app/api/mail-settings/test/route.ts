/* POST /api/mail-settings/test — ส่งอีเมลทดสอบหนึ่งฉบับ
 *
 * "บันทึกแล้ว" ไม่ได้แปลว่าส่งได้ · ปลายทางอาจปฏิเสธรหัสผ่าน ปิดพอร์ต หรือ
 * ไม่ยอมให้ส่งจากอีเมลผู้ส่งที่ยังไม่ได้ยืนยันโดเมน — ต้องลองจริงถึงจะรู้
 */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { mailConfig, sendWith } from '@/lib/server/mail';
import { audit } from '@/lib/server/audit';

export const runtime = 'nodejs';

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner');

  const body = (await req.json().catch(() => null)) as { to?: string } | null;
  const to = String(body?.to ?? '').trim().toLowerCase() || user.email;
  if (!to.includes('@')) throw new ApiError('VALIDATION', 'กรุณากรอกอีเมลปลายทางให้ถูกต้อง', 400, { to: 'อีเมลไม่ถูกต้อง' });

  const cfg = await mailConfig(user.orgId);
  if (!cfg) throw new ApiError('NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่าเซิร์ฟเวอร์อีเมล — กรอกและกดบันทึกก่อน', 400);

  const when = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const res = await sendWith(
    cfg, to,
    'ทดสอบระบบอีเมล · JKP Property',
    `<p>อีเมลฉบับนี้ส่งจากหน้า Settings › อีเมล เพื่อทดสอบการตั้งค่า</p><p>เวลา ${when}</p>`,
    `อีเมลฉบับนี้ส่งจากหน้า Settings › อีเมล เพื่อทดสอบการตั้งค่า\nเวลา ${when}`,
  );

  /* เก็บผลไว้ให้หน้าจอบอกได้ว่า "ตั้งค่าแล้วใช้ได้จริงไหม" ไม่ใช่แค่บันทึกแล้ว */
  await db.mailSetting.updateMany({
    where: { orgId: user.orgId },
    data: {
      lastTestAt: new Date(),
      lastTestOk: res.ok,
      lastTestError: res.ok ? '' : String(('detail' in res && res.detail) || res.reason).slice(0, 500),
    },
  });

  await audit({
    user, orgId: user.orgId, action: 'mail.test', entity: 'mailSetting', entityId: user.orgId,
    after: { to, ok: res.ok },
  });

  if (!res.ok) {
    throw new ApiError('SEND_FAILED', `ส่งไม่สำเร็จ — ${('detail' in res && res.detail) || res.reason}`, 400);
  }
  return ok({ sent: true, to });
});
