/* GET / PUT /api/nav-menu — ลำดับเมนูประเภททรัพย์บนแถบบนสุด
 *
 * ลูกค้าขอ "ตัว setup เรียงลำดับเมนูที่หลังบ้าน" (สไลด์ 5) — เดิมลำดับเขียน
 * ตายตัวอยู่ใน lib/navMenus.ts แก้ได้เฉพาะคนที่แก้โค้ดเป็น
 *
 * PUT เจ้าของระบบเท่านั้น เพราะกระทบเมนูของทั้งเว็บ
 */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { TYPE_MENUS } from '@/lib/navMenus';

export const runtime = 'nodejs';

const KEYS = new Set(TYPE_MENUS.map((m) => m.key));

export const GET = handler(async () => {
  const user = await requireUser();
  const org = await db.org.findUnique({ where: { id: user.orgId }, select: { navOrder: true } });
  return ok({ order: org?.navOrder ?? [] });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner');

  const body = (await req.json().catch(() => null)) as { order?: unknown } | null;
  const raw = Array.isArray(body?.order) ? body.order : null;
  if (!raw) throw new ApiError('VALIDATION', 'ต้องส่งลำดับเมนูมาเป็นรายการ', 400);

  /* รับเฉพาะ key ที่มีจริงและไม่ซ้ำ — ลำดับที่มี key มั่วปนมาจะทำให้เมนูเพี้ยน
     แบบที่หาสาเหตุยาก จึงกรองทิ้งตั้งแต่ตอนบันทึก ไม่ใช่ตอนแสดงผล */
  const seen = new Set<string>();
  const order = raw.map((k) => String(k)).filter((k) => {
    if (!KEYS.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const before = await db.org.findUnique({ where: { id: user.orgId }, select: { navOrder: true } });
  await db.org.update({ where: { id: user.orgId }, data: { navOrder: order } });
  await audit({
    user, orgId: user.orgId, action: 'nav.order', entity: 'org', entityId: user.orgId,
    before: { order: before?.navOrder ?? [] }, after: { order },
  });
  return ok({ order });
});
