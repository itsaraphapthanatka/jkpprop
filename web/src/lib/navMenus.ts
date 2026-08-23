/* เมนูประเภททรัพย์บนแถบบนสุด
 *
 * สไลด์ 1 · "เพิ่มโชว์รูม และ อาคารพาณิชย์ · ที่ดิน" — เมนูมีแต่โรงงานกับโกดัง
 * ทั้งที่ระบบคีย์ทรัพย์ได้สี่ประเภทมาตั้งแต่แรก
 *
 * แถบบนสุดมีสามชุดในโค้ด (หน้าแรก · หน้ารายการ · หน้าทรัพย์) และแต่ละชุดยังเขียน
 * เมนูซ้ำอีกสองที่ (จอใหญ่กับลิ้นชักมือถือ) รวมเป็นสิบสองบล็อกถ้าเพิ่มสองประเภท
 * แบบคัดลอกกันไป — เก็บเป็นตารางเดียวตรงนี้แล้วทุกที่วนเอา เพิ่มประเภทใหม่
 * ครั้งหน้าจึงแก้ที่เดียว
 */
import type { Dictionary } from '@/i18n/dictionaries';

export type TypeMenu = {
  key: string;
  label: (d: Dictionary) => string;
  items: readonly (readonly [string, (d: Dictionary) => string])[];
};

export const TYPE_MENUS: readonly TypeMenu[] = [
  { key: 'factory', label: (d) => d.nav.factory, items: [['/factory-rent', (d) => d.nav.factoryRent], ['/factory-sale', (d) => d.nav.factorySale]] },
  { key: 'warehouse', label: (d) => d.nav.warehouse, items: [['/warehouse-rent', (d) => d.nav.warehouseRent], ['/warehouse-sale', (d) => d.nav.warehouseSale]] },
  { key: 'showroom', label: (d) => d.nav.showroom, items: [['/showroom-rent', (d) => d.nav.showroomRent], ['/showroom-sale', (d) => d.nav.showroomSale]] },
  { key: 'land', label: (d) => d.nav.land, items: [['/land-rent', (d) => d.nav.landRent], ['/land-sale', (d) => d.nav.landSale]] },
];

/* ลูกค้าขอ "ตัว setup เรียงลำดับเมนูที่หลังบ้าน" (สไลด์ 5) — ลำดับเก็บที่
   Org.navOrder เป็นรายการ key · กติกาที่ทำให้ปลอดภัยเวลามีประเภทใหม่:
     · key ที่ไม่รู้จัก (ลบประเภททิ้งไปแล้ว) ถูกข้าม
     · ประเภทที่ยังไม่ถูกจัดลำดับ ต่อท้ายตามลำดับตั้งต้น ไม่หายไปจากเมนู
     · ลำดับว่าง = ใช้ตั้งต้น
   ทั้งสองข้อหลังสำคัญ เพราะเมนูหายเงียบ ๆ คือบั๊กที่ไม่มีใครสังเกตจนลูกค้าทัก */
export function orderMenus(order: readonly string[] = []): readonly TypeMenu[] {
  if (!order.length) return TYPE_MENUS;
  const byKey = new Map(TYPE_MENUS.map((m) => [m.key, m]));
  const picked = order.map((k) => byKey.get(k)).filter((m): m is TypeMenu => !!m);
  const seen = new Set(picked.map((m) => m.key));
  return [...picked, ...TYPE_MENUS.filter((m) => !seen.has(m.key))];
}

/* ลิงก์คอลัมน์ "อสังหาริมทรัพย์" ที่ฟุตเตอร์ — คุณ Jacky แจ้งว่า "ประเภทไม่ครบ"
   (เด็ค Web 2026 ข้อ 7) เดิมมีแค่สามลิงก์ ทั้งที่เว็บมีแปดหน้าปลายทาง
   ลำดับตามที่สั่งมา: ที่ดิน → โกดัง → โรงงาน → โชว์รูม (เช่าก่อนขายทุกคู่)

   อยู่ที่นี่เพราะฟุตเตอร์มีสองชุดในโค้ด (หน้าแรกกับหน้าเนื้อหา) และเคยลอกกัน
   ไว้แล้วค่อย ๆ เพี้ยน — แบบเดียวกับที่แถบบนเคยหลุดไปชุดหนึ่ง */
export const FOOTER_PROPERTY_LINKS: readonly (readonly [string, (d: Dictionary) => string])[] = [
  ['/land-rent', (d) => d.nav.landRent],
  ['/land-sale', (d) => d.nav.landSale],
  ['/warehouse-rent', (d) => d.nav.warehouseRent],
  ['/warehouse-sale', (d) => d.nav.warehouseSale],
  ['/factory-rent', (d) => d.nav.factoryRent],
  ['/factory-sale', (d) => d.nav.factorySale],
  ['/showroom-rent', (d) => d.nav.showroomRent],
  ['/showroom-sale', (d) => d.nav.showroomSale],
];
