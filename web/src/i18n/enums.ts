/* ============================================================
   Enum labels — FRONTEND_API_SPEC §11 #4.

   The schema stores option values as Thai strings (`deal_type: "เช่า"`),
   which is fine as a stable key but cannot be shown to an EN/ZH visitor.
   Rather than migrate every stored `values` blob, the Thai string IS the
   code and this table renders it per locale. New options only need a row
   here; anything missing falls through to the stored Thai text, so a
   forgotten term degrades to "untranslated", never to blank.
   ============================================================ */
import type { Locale } from './config';

type Row = Partial<Record<Locale, string>>;
const dict: Record<string, Row> = {
  /* deal type — the value shown on every card and detail page */
  'เช่า': { en: 'For rent', zh: '出租' },
  'ขาย': { en: 'For sale', zh: '出售' },
  'เช่า / ขาย': { en: 'Rent or sale', zh: '出租或出售' },
  'ปล่อยเช่า': { en: 'For rent', zh: '出租' },
  'ขายและปล่อยเช่า': { en: 'Rent or sale', zh: '出租或出售' },
  'ให้เช่า': { en: 'For rent', zh: '出租' },
  'ซื้อ': { en: 'Buy', zh: '购买' },

  /* property types */
  'บ้าน': { en: 'House', zh: '住宅' },
  'คอนโด': { en: 'Condominium', zh: '公寓' },
  'ที่ดินเปล่า': { en: 'Land', zh: '土地' },
  'โรงงาน': { en: 'Factory', zh: '工厂' },
  'โกดัง / คลังสินค้า': { en: 'Warehouse', zh: '仓库' },
  'โกดัง/คลังสินค้า': { en: 'Warehouse', zh: '仓库' },
  'โกดัง': { en: 'Warehouse', zh: '仓库' },
  'โชว์รูมและเชิงพาณิชย์': { en: 'Showroom / commercial', zh: '展厅及商业' },
  'ที่ดิน': { en: 'Land', zh: '土地' },

  /* urban-planning zone colours — the legal terms, kept literal */
  'เขียว — ชนบท/เกษตรกรรม': { en: 'Green — rural / agricultural', zh: '绿区 — 农业' },
  'เหลือง — ที่อยู่อาศัยหนาแน่นน้อย': { en: 'Yellow — low-density residential', zh: '黄区 — 低密度住宅' },
  'ส้ม — ที่อยู่อาศัยหนาแน่นปานกลาง': { en: 'Orange — medium-density residential', zh: '橙区 — 中密度住宅' },
  'น้ำตาล — ที่อยู่อาศัยหนาแน่นมาก': { en: 'Brown — high-density residential', zh: '棕区 — 高密度住宅' },
  'แดง — พาณิชยกรรม': { en: 'Red — commercial', zh: '红区 — 商业' },
  'ม่วง — อุตสาหกรรม': { en: 'Purple — industrial', zh: '紫区 — 工业' },
  'เม็ดมะปราง — คลังสินค้า': { en: 'Plum — warehousing', zh: '梅红区 — 仓储' },
  'ขาว-เขียว — อนุรักษ์ชนบท': { en: 'White-green — rural conservation', zh: '白绿区 — 乡村保护' },

  /* zones */
  'ปลอดอากร (Free Zone)': { en: 'Free Zone', zh: '自由区' },
  'การนิคมอุตสาหกรรม (กนอ.)': { en: 'Industrial Estate (IEAT)', zh: '工业园区 (IEAT)' },
  'วัตถุอันตราย (DG Zone)': { en: 'Dangerous Goods zone', zh: '危险品区' },

  /* misc option values that surface publicly */
  'อื่นๆ': { en: 'Other', zh: '其他' },
  'ไม่ระบุ': { en: 'Not specified', zh: '未指定' },
  '1 เฟส': { en: 'Single phase', zh: '单相电' },
  '3 เฟส': { en: 'Three phase', zh: '三相电' },
};

/** Translate a stored option value. Unknown values return unchanged. */
export function enumLabel(value: string, locale: Locale): string {
  if (locale === 'th') return value;
  return dict[value]?.[locale] ?? value;
}

/** Terms with no translation yet — used by a test to keep the table honest. */
export function untranslated(values: string[], locale: Locale): string[] {
  if (locale === 'th') return [];
  return values.filter((v) => !dict[v]?.[locale]);
}
