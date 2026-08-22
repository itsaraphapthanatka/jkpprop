/* ใครเห็นเบอร์โทรและที่ตั้งของผู้ให้เช่าได้บ้าง
 *
 * สไลด์ 46 · "ในขั้นตอนทุกขั้นตอนที่เบอร์โทรและที่ตั้งของผู้ให้เช่า แต่ละคนควร
 * เห็นแค่เบอร์โทรและที่ตั้งของประกาศที่ตัวเองสร้าง นอกนั้นควรเห็นแค่เบอร์โทร PIC
 * ที่รับผิดชอบ — ยกเว้นผู้จัดการและเจ้าของ"
 * และ "มีทรัพย์กลางที่แสดงเบอร์โทรและที่ตั้งของผู้ให้เช่าที่ทุกคนเห็นได้ —
 * เจ้าของตั้งเท่านั้น"
 *
 * เดิมประตูบานเดียวคือสิทธิ์ internal_note ซึ่ง owner · manager · agent · ops
 * มีกันหมด แปลว่าเอเจนต์ทุกคนเห็นเบอร์เจ้าของทรัพย์ทุกใบในระบบ รวมทรัพย์ที่
 * เพื่อนร่วมงานหามาเอง
 *
 * กติกาใหม่ เรียงตามที่สไลด์เขียน:
 *   1. ไม่มีสิทธิ์ internal_note        → ไม่เห็นอะไรเลย (เหมือนเดิม)
 *   2. เจ้าของระบบ / ผู้จัดการ          → เห็นทุกใบ
 *   3. ทรัพย์ที่ตัวเองเป็นผู้ดูแล        → เห็น
 *   4. ทรัพย์กลาง (เจ้าของระบบติดธงไว้)  → ทุกคนเห็น
 *   5. นอกนั้น                          → ไม่เห็น แต่ได้เบอร์ PIC ไปติดต่อแทน
 */
import type { User } from '@prisma/client';
import { hasPriv } from './auth';
import { db } from './db';

type Vals = Record<string, unknown>;

/** ช่องที่ถือว่าเป็น "ข้อมูลติดต่อผู้ให้เช่า" — ปิดหรือเปิดพร้อมกันทั้งชุด */
export const LESSOR_KEYS = ['lessor_name', 'lessor_phone', 'lessor_company', 'lessor_status'] as const;

export type PropertyAccess = { ownerId: string | null; contactShared: boolean };

/** ทรัพย์ใบนี้ คนนี้เห็นข้อมูลติดต่อผู้ให้เช่าได้ไหม */
export function canSeeLessor(user: User | null, p: PropertyAccess): boolean {
  if (!user || !hasPriv(user, 'internal_note')) return false;
  if (user.role === 'owner' || user.role === 'manager') return true;
  if (p.contactShared) return true;
  return !!p.ownerId && p.ownerId === user.id;
}

/** เจ้าของระบบเท่านั้นที่ตั้งทรัพย์กลางได้ ตามที่สไลด์เขียน */
export const canShareContact = (user: User): boolean => user.role === 'owner';

/* ปิดข้อมูลติดต่อ แล้วใส่เบอร์ PIC ไว้แทน
 *
 * คนที่เปิดดูต้องมีทางติดต่อต่อได้ ไม่ใช่เจอช่องว่างแล้วจบ — สไลด์เขียนว่า
 * "นอกนั้นควรเห็นแค่ เบอร์โทร PIC ที่รับผิดชอบ" */
export function maskLessor(values: Vals, picPhone: string): Vals {
  const out = { ...values };
  for (const k of LESSOR_KEYS) delete out[k];
  delete out.location_map;
  out.lessor_hidden = true;
  if (picPhone) out.pic_phone = picPhone;
  return out;
}

/* เบอร์ของ PIC ที่ระบุไว้บนทรัพย์ — ช่อง pic เก็บ "ชื่อ" ที่เลือกจากรายชื่อบัญชี
   จริง (สไลด์ 46) จึงหาเบอร์ต่อได้ ถ้าเป็นชื่อเก่าที่พิมพ์เองไว้ก่อนก็หาไม่เจอ
   แล้วคืนค่าว่าง ซึ่งดีกว่าเดาเบอร์ผิดคน */
export async function picPhoneOf(p: { orgId: string; values: unknown }): Promise<string> {
  const name = String(((p.values ?? {}) as Vals).pic ?? '').trim();
  if (!name) return '';
  const u = await db.user.findFirst({
    where: { orgId: p.orgId, name }, select: { phone: true },
  }).catch(() => null);
  return u?.phone ?? '';
}

/* เบอร์ PIC ของทรัพย์หลายใบพร้อมกัน — หน้ารายการมี 500 แถว ถ้าถามทีละใบก็เป็น
   500 คำสั่ง */
export async function picPhoneMap(orgId: string, rows: { values: unknown }[]): Promise<Map<string, string>> {
  const names = Array.from(new Set(
    rows.map((r) => String(((r.values ?? {}) as Vals).pic ?? '').trim()).filter(Boolean),
  ));
  if (!names.length) return new Map();
  const users = await db.user.findMany({
    where: { orgId, name: { in: names } }, select: { name: true, phone: true },
  }).catch(() => []);
  return new Map(users.map((u) => [u.name, u.phone ?? '']));
}
