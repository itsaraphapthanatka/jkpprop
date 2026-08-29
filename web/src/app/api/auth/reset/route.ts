/* POST /api/auth/reset — ตั้งรหัสผ่านใหม่ด้วยโทเคนจากอีเมล */
import { ok, handler, ApiError } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { hashPassword } from '@/lib/server/auth';
import { findUsableToken } from '@/lib/server/passwordReset';
import { audit } from '@/lib/server/audit';

export const runtime = 'nodejs';

const MIN_LEN = 8;

export const POST = handler(async (req: Request) => {
  const body = (await req.json().catch(() => null)) as { token?: string; password?: string } | null;
  const password = String(body?.password ?? '');
  if (password.length < MIN_LEN) {
    throw new ApiError('VALIDATION', `รหัสผ่านต้องยาวอย่างน้อย ${MIN_LEN} ตัวอักษร`, 400, { password: `อย่างน้อย ${MIN_LEN} ตัวอักษร` });
  }

  const row = await findUsableToken(String(body?.token ?? ''));
  if (!row) throw new ApiError('INVALID_TOKEN', 'ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว — กรุณาขอลิงก์ใหม่', 400);

  const user = await db.user.findUnique({ where: { id: row.userId } });
  if (!user) throw new ApiError('NOT_FOUND', 'ไม่พบบัญชีผู้ใช้', 404);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        /* ตั้งรหัสเองแล้ว จึงไม่ต้องบังคับเปลี่ยนอีก */
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    }),
    db.passwordReset.update({ where: { tokenHash: row.tokenHash }, data: { usedAt: new Date() } }),
    /* ล้าง session เดิมทั้งหมด — ถ้ารหัสหลุดไปถึงมือใครแล้ว การตั้งรหัสใหม่
       ต้องเตะคนนั้นออกจากระบบด้วย ไม่ใช่แค่เปลี่ยนรหัสไว้เฉย ๆ */
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);

  await audit({
    user, orgId: user.orgId, action: 'user.reset_password', entity: 'user', entityId: user.id,
    after: { kind: row.kind },
  });

  return ok({ email: user.email });
});
