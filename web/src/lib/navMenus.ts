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
