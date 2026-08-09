/* POST /api/me/password — a signed-in user sets their own password.

   This closes the loop opened by /api/users/invite: an admin issues a
   temporary password, and until it is replaced that password IS the account.
   Changing it clears mustChangePassword and drops every OTHER session, so a
   password shared over chat stops working the moment it is replaced. */
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { ok, handler, ApiError, clientIp } from '@/lib/server/api';
import { requireUser, hashPassword, verifyPassword, SESSION_COOKIE } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

const MIN_LENGTH = 8;

export const POST = handler(async (req: Request) => {
  const user = await requireUser();

  const body = (await req.json().catch(() => null)) as
    | { currentPassword?: string; newPassword?: string; confirmPassword?: string }
    | null;
  const current = String(body?.currentPassword ?? '');
  const next = String(body?.newPassword ?? '');
  const confirm = String(body?.confirmPassword ?? next);

  if (!current) throw new ApiError('VALIDATION', 'กรุณากรอกรหัสผ่านปัจจุบัน', 400, { currentPassword: 'กรุณากรอกรหัสผ่านปัจจุบัน' });
  if (next.length < MIN_LENGTH) {
    throw new ApiError('VALIDATION', `รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_LENGTH} ตัวอักษร`, 400, { newPassword: `อย่างน้อย ${MIN_LENGTH} ตัวอักษร` });
  }
  if (next !== confirm) {
    throw new ApiError('VALIDATION', 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', 400, { confirmPassword: 'ยืนยันไม่ตรงกัน' });
  }
  if (next === current) {
    throw new ApiError('VALIDATION', 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม', 400, { newPassword: 'ต้องไม่ซ้ำกับรหัสเดิม' });
  }
  if (!(await verifyPassword(current, user.passwordHash))) {
    throw new ApiError('BAD_CREDENTIALS', 'รหัสผ่านปัจจุบันไม่ถูกต้อง', 400, { currentPassword: 'รหัสผ่านไม่ถูกต้อง' });
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(next),
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  });

  // keep the caller signed in, but invalidate anywhere else the old password
  // was used to sign in
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const keep = token ? createHash('sha256').update(token).digest('hex') : '';
  await db.session.deleteMany({ where: { userId: user.id, NOT: { token: keep } } });

  await audit({
    user, orgId: user.orgId, action: 'auth.password_change', entity: 'user', entityId: user.id,
    ip: clientIp(req),
  });

  return ok({ ok: true });
});
