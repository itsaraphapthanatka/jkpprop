/* GET/PUT /api/mail-settings — ตั้งค่าเซิร์ฟเวอร์อีเมลขาออกจากหน้า Settings
 *
 * เดิมค่าพวกนี้อยู่ในไฟล์ตั้งค่าของเซิร์ฟเวอร์ ซึ่งทีมที่ดูแลเว็บเข้าไปแก้เองไม่ได้
 * ต้องรอทีมพัฒนาทุกครั้งที่เปลี่ยนผู้ให้บริการหรือรหัสหมดอายุ
 */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const runtime = 'nodejs';

const EMPTY = {
  host: '', port: 587, secure: false, username: '', fromEmail: '', fromName: '',
  hasPassword: false, lastTestAt: null as number | null, lastTestOk: null as boolean | null, lastTestError: '',
};

/* รหัสผ่านไม่เคยถูกส่งกลับออกไป — หน้าจอรู้แค่ว่าตั้งไว้แล้วหรือยัง
   ถ้าส่งกลับไป มันจะไปโผล่ใน devtools ของทุกคนที่เปิดหน้านี้ */
export const GET = handler(async () => {
  const user = await requireUser();
  requireRole(user, 'owner');
  const row = await db.mailSetting.findUnique({ where: { orgId: user.orgId } });
  if (!row) return ok(EMPTY);
  return ok({
    host: row.host, port: row.port, secure: row.secure,
    username: row.username, fromEmail: row.fromEmail, fromName: row.fromName,
    hasPassword: row.password.length > 0,
    lastTestAt: row.lastTestAt ? row.lastTestAt.getTime() : null,
    lastTestOk: row.lastTestOk,
    lastTestError: row.lastTestError,
  });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner');

  const body = (await req.json().catch(() => null)) as {
    host?: string; port?: number; secure?: boolean; username?: string;
    password?: string; fromEmail?: string; fromName?: string;
  } | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const host = String(body.host ?? '').trim().slice(0, 200);
  const fromEmail = String(body.fromEmail ?? '').trim().toLowerCase().slice(0, 200);
  if (host && !fromEmail.includes('@')) {
    throw new ApiError('VALIDATION', 'กรุณากรอกอีเมลผู้ส่งให้ถูกต้อง', 400, { fromEmail: 'กรุณากรอกอีเมลผู้ส่ง' });
  }
  const portRaw = Number(body.port ?? 587);
  const port = Number.isFinite(portRaw) && portRaw > 0 && portRaw < 65536 ? Math.round(portRaw) : 587;

  const prev = await db.mailSetting.findUnique({ where: { orgId: user.orgId } });
  /* เว้นช่องรหัสผ่านว่าง = ใช้ค่าเดิมต่อ · หน้าจอไม่เคยได้ค่าเดิมมาแสดงอยู่แล้ว
     ถ้าตีความว่า "ลบรหัส" ทุกครั้งที่กดบันทึก การแก้แค่พอร์ตจะพังการส่งทันที */
  const password = typeof body.password === 'string' && body.password.length > 0
    ? body.password
    : prev?.password ?? '';

  const data = {
    host, port,
    secure: body.secure === true || port === 465,
    username: String(body.username ?? '').trim().slice(0, 200),
    password,
    fromEmail,
    fromName: String(body.fromName ?? '').trim().slice(0, 120),
  };

  const saved = await db.mailSetting.upsert({
    where: { orgId: user.orgId },
    create: { orgId: user.orgId, ...data },
    update: data,
  });

  /* ห้ามบันทึกรหัสผ่านลง audit log — log ถูกอ่านได้กว้างกว่าตัวตั้งค่าเอง */
  await audit({
    user, orgId: user.orgId, action: 'mail.settings', entity: 'mailSetting', entityId: user.orgId,
    before: prev ? { host: prev.host, port: prev.port, fromEmail: prev.fromEmail, hasPassword: prev.password.length > 0 } : null,
    after: { host: saved.host, port: saved.port, fromEmail: saved.fromEmail, hasPassword: saved.password.length > 0 },
  });

  return ok({ saved: true, hasPassword: saved.password.length > 0 });
});
