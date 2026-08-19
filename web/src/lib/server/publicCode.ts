/* ============================================================
   public_code generation (SPEC_PACK FR-ADM-08).

   รูปแบบ: JKP + รหัสจังหวัด 3 ตัว + เลขลำดับของจังหวัดนั้น — JKPBKK1256

   ก่อนหน้านี้กรุงเทพฯ ถูกยกเว้นให้ไม่มีรหัสจังหวัด (JKP0201) และจังหวัดอื่นมี
   ขีดคั่น (JKP-SPK0200) ส่วนตัวนับก็เริ่มจาก 1 เสมอ ไม่เคยดูว่าในระบบมีรหัสอะไร
   อยู่แล้ว พอทีมนำเข้าทรัพย์จริง 393 รายการที่ใช้ JKPBKK1000–1255 และ
   JKPSPK1000–1131 ทรัพย์ที่คีย์เข้าไปใหม่จึงได้ JKP0201 กับ JKP-SPK0200 —
   คนละรูปแบบ คนละช่วงเลข และมองไม่ออกว่าอยู่จังหวัดไหน

   ตอนนี้:
   - รหัสจังหวัดอ่านจาก /admin/geography ก่อน (ทีมแก้เองได้) แล้วค่อยตกมาที่
     ตารางสำรองในไฟล์นี้
   - เลขลำดับต่อจากรหัสสูงสุดที่มีอยู่จริงของจังหวัดนั้น ไม่ใช่เริ่มใหม่ที่ 1
   - รหัสเดิมของทรัพย์ที่มีอยู่แล้วไม่ถูกแตะ (immutable — FRONTEND_API_SPEC §8)
   ============================================================ */
import { db } from './db';
import { canonicalProvince } from '@/i18n/places';

/** ชุดสำรอง ใช้เมื่อจังหวัดนั้นยังไม่มีรหัสใน /admin/geography */
export const PROVINCE_CODES: Record<string, string> = {
  กรุงเทพมหานคร: 'BKK',
  สมุทรปราการ: 'SPK',
  สมุทรสาคร: 'SKN',
  นนทบุรี: 'NBI',
  ปทุมธานี: 'PTE',
  พระนครศรีอยุธยา: 'AYA',
  ฉะเชิงเทรา: 'CCO',
  ชลบุรี: 'CBI',
  ระยอง: 'RYG',
  นครปฐม: 'NPT',
  ราชบุรี: 'RBR',
  สระบุรี: 'SRI',
  ปราจีนบุรี: 'PRI',
  นครราชสีมา: 'NMA',
  ขอนแก่น: 'KKN',
  เชียงใหม่: 'CMI',
  ภูเก็ต: 'PKT',
  สงขลา: 'SKA',
};

/** ทรัพย์ที่ยังไม่ได้ระบุจังหวัด — เห็นแล้วรู้ทันทีว่าต้องกลับมาเติม */
export const UNKNOWN_PROVINCE_CODE = 'XXX';

/** เลขเริ่มของทุกจังหวัด — ชุดที่นำเข้ามาใช้ 1000 เป็นฐาน และรหัสที่ออกใหม่
    ต้องอยู่ในชุดเดียวกันเสมอ ไม่ว่าจังหวัดนั้นจะเคยมีรหัสเลขต่ำกว่านี้หรือไม่ */
export const FIRST_NUMBER = 1000;

/** รหัสจังหวัดที่ทีมตั้งไว้เอง ชนะตารางสำรองในไฟล์นี้ */
async function provinceCode(orgId: string, provinceName?: string): Promise<string> {
  const th = canonicalProvince(provinceName);
  if (!th) return UNKNOWN_PROVINCE_CODE;

  const rows = await db.geoItem
    .findMany({ where: { orgId, kind: 'province' }, select: { name: true, code: true } })
    .catch(() => []);
  const hit = rows.find((r) => canonicalProvince(r.name) === th && (r.code ?? '').trim());
  if (hit?.code) return hit.code.trim().toUpperCase().slice(0, 3);

  if (PROVINCE_CODES[th]) return PROVINCE_CODES[th];
  // เผื่อค่าที่พิมพ์มาแบบ "จ.ชลบุรี" หรือ "ชลบุรี (แหลมฉบัง)"
  for (const [name, code] of Object.entries(PROVINCE_CODES)) {
    if (th.includes(name)) return code;
  }
  return UNKNOWN_PROVINCE_CODE;
}

/** เลขถัดไปของ prefix นี้ — ต่อจากรหัสที่มีอยู่จริง แต่ไม่ต่ำกว่า 1000 เด็ดขาด
 *
 *  ถ้าจังหวัดหนึ่งเคยมีรหัสเลขต่ำ (เช่น JKPBKK0201 จากรูปแบบเก่า) การนับต่อ
 *  ตรง ๆ จะได้ 202 ซึ่งหลุดออกจากชุด 1000+ ที่ทั้งระบบใช้อยู่ */
async function seedFor(orgId: string, prefix: string): Promise<number> {
  const rows = await db.$queryRaw<{ max: number | null }[]>`
    select max((substring("publicCode" from '[0-9]+$'))::int) as max
    from "Property"
    where "orgId" = ${orgId} and "publicCode" ~ ${`^${prefix}[0-9]+$`}
  `;
  const max = rows[0]?.max ?? 0;
  return Math.max(FIRST_NUMBER, max + 1);
}

/** Next public_code for a property in a province — transaction-safe counter. */
export async function nextPublicCode(orgId: string, provinceName?: string): Promise<string> {
  const prefix = `JKP${await provinceCode(orgId, provinceName)}`;

  /* ตัวนับเก็บ "เลขถัดไปที่ยังไม่ถูกใช้" — upsert คืนแถวหลังเขียน เลขที่เพิ่งใช้
     จึงเป็น next - 1 เสมอ · แถวที่ยังไม่เคยมี ตั้งต้นจากข้อมูลจริง ไม่ใช่ 1 */
  const start = await seedFor(orgId, prefix);
  const counter = await db.codeCounter.upsert({
    where: { orgId_prefix: { orgId, prefix } },
    create: { orgId, prefix, next: start + 1 },
    update: { next: { increment: 1 } },
  });
  let n = counter.next - 1;

  /* ตัวนับอาจตามหลังข้อมูลจริง (เช่น ทรัพย์ถูกนำเข้ามาทีหลังโดยไม่ผ่านตัวนับ)
     — ถ้าเลขที่ได้ชนของเดิม ให้ขยับตัวนับไปหลังสุดแล้วออกเลขใหม่ */
  if (n < start) {
    const fixed = await db.codeCounter.update({
      where: { orgId_prefix: { orgId, prefix } },
      data: { next: start + 1 },
    });
    n = fixed.next - 1;
  }
  return `${prefix}${n}`;
}
