/* โทเคนสำหรับตั้งรหัสผ่าน — ใช้ร่วมกันทั้งตอนเชิญเข้าระบบและตอนลืมรหัสผ่าน
 *
 * เก็บเฉพาะค่าแฮชลงฐานข้อมูล แบบเดียวกับ Session — ฐานข้อมูลที่รั่วจึงเปิด
 * บัญชีใครไม่ได้ ตัวโทเคนจริงอยู่ในอีเมลของเจ้าตัวเท่านั้น
 */
import { createHash, randomBytes } from 'crypto';
import { db } from './db';

export type ResetKind = 'invite' | 'reset';

/** ลิงก์เชิญให้เวลานานกว่า เพราะคนที่เพิ่งถูกเปิดบัญชีอาจยังไม่ได้เปิดเมลทันที */
export const TTL_HOURS: Record<ResetKind, number> = { invite: 72, reset: 2 };

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** ออกโทเคนใหม่หนึ่งใบ · คืนค่าตัวจริงที่จะใส่ในลิงก์ (เก็บไว้ที่อื่นไม่ได้อีก) */
export async function issueResetToken(userId: string, kind: ResetKind): Promise<{ token: string; hours: number }> {
  /* ใบเก่าที่ยังไม่ถูกใช้ต้องตายทันทีที่ออกใบใหม่ — ไม่งั้นลิงก์เก่าที่หลุดไป
     อยู่ในกล่องจดหมายเก่ายังเปิดบัญชีได้อยู่ */
  await db.passwordReset.deleteMany({ where: { userId, usedAt: null } });
  const token = randomBytes(32).toString('base64url');
  const hours = TTL_HOURS[kind];
  await db.passwordReset.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      kind,
      expiresAt: new Date(Date.now() + hours * 3600_000),
    },
  });
  return { token, hours };
}

export type ResetRow = { tokenHash: string; userId: string; kind: string; expiresAt: Date; usedAt: Date | null };

/** หาโทเคนที่ยังใช้ได้ · null = ไม่มี หมดอายุ หรือถูกใช้ไปแล้ว */
export async function findUsableToken(token: string): Promise<ResetRow | null> {
  if (!token) return null;
  const row = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

/* เก็บกวาดใบที่หมดอายุหรือใช้ไปแล้ว — เรียกตอนออกใบใหม่ ไม่ต้องมี cron
   เพิ่มอีกตัวให้ดูแล */
export async function pruneExpiredTokens(): Promise<number> {
  const r = await db.passwordReset.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
  });
  return r.count;
}
