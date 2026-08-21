/* ตัวกรองชุดเดียวของฝั่งผู้ใช้ — หน้าแรกกับหน้ารายการต้องใช้เมนูเดียวกัน
 *
 * สไลด์ 9/14 · "ใช้ระบบเมนูเดียวกัน · ทำตัวกรองให้เหมือนรูปด้านซ้าย"
 * เดิมมีตัวกรองสองชุดคนละแบบ
 *
 *   หน้าแรก      ทำเล · พื้นที่สี · คุณสมบัติ · รับน้ำหนัก  (สี่หมวด)
 *   หน้ารายการ   ทำเล · ประเภท · ขนาด · ราคา              (สี่หมวดคนละชุด)
 *
 * และแผงบนหน้าแรกก็เป็นรายการที่พิมพ์ไว้ในไฟล์ทั้งหมด ไม่ตรงกับค่าที่บันทึกจริง
 * สักค่า ("บนถนนสายหลัก" ในเมนู ส่วนข้อมูลเก็บว่า "ใกล้ถนนหลัก") ต่อให้ส่งไป
 * กรองก็ไม่มีทางเจอ — และมันก็ไม่เคยถูกส่งไปไหนด้วย เก็บ state ไว้เฉย ๆ
 *
 * ไฟล์นี้เป็นแหล่งเดียวของทั้งรายการตัวเลือก การอ่าน/เขียน URL และกฎการกรอง
 */

/** เท่าที่ตัวกรองต้องรู้เกี่ยวกับทรัพย์หนึ่งรายการ */
export type FilterableListing = {
  loc: string;
  zoning: string;
  zone: string[];
  features: string[];
  loadTon: number | null;
  /** ความสูงอาคาร (เมตร) — ทีมกรอกไว้ 198 จาก 248 รายการ ช่วง 3–14 ม. */
  heightM: number | null;
  type: string;
};

export type PublicFilterState = {
  /** ทำเล — ข้อความตำแหน่งอย่างที่การ์ดแสดง */
  areas: string[];
  /** พื้นที่สี (ผังเมือง) */
  colors: string[];
  /** โซน — ปลอดอากร · กนอ. · DG */
  zones: string[];
  features: string[];
  /** รับน้ำหนักพื้นต่ำสุด (ตัน/ตร.ม.) */
  load: number | null;
  /** ความสูงอาคาร ต่ำสุด–สูงสุด (เมตร) — ว่างข้างไหนก็ได้ */
  hMin: number | null;
  hMax: number | null;
};

export const EMPTY_PUBLIC_FILTERS: PublicFilterState = { areas: [], colors: [], zones: [], features: [], load: null, hMin: null, hMax: null };

/** ตัวเลือกที่ "มีของจริง" — คำนวณจากรายการที่หน้านั้นถืออยู่ ไม่ใช่รายการคงที่ */
export type Facets = { areas: string[]; colors: string[]; zones: string[]; features: string[]; types: string[] };

export function buildFacets(items: FilterableListing[]): Facets {
  const uniq = (xs: string[]) => Array.from(new Set(xs.filter((x) => x && x !== '—'))).sort();
  return {
    areas: uniq(items.map((i) => i.loc)),
    colors: uniq(items.map((i) => i.zoning)),
    zones: uniq(items.flatMap((i) => i.zone)),
    features: uniq(items.flatMap((i) => i.features)),
    types: uniq(items.map((i) => i.type)),
  };
}

/* สไลด์ 2 · "เพิ่มโชว์รูม และ อาคารพาณิชย์ · ที่ดิน" — แผงค้นหาหน้าแรกมีให้เลือก
   แค่โกดังกับโรงงาน เป็นรายการที่พิมพ์ไว้ตายตัวในไฟล์ ทั้งที่ระบบหลังบ้านคีย์
   ทรัพย์ได้สี่ประเภทมาตั้งแต่แรก คนหาโชว์รูมหรือที่ดินจึงไม่มีทางเริ่มจากหน้าแรก
   บ้านกับคอนโดไม่อยู่ในนี้ — มีในระบบหลังบ้านแต่ไม่ใช่ของที่เอเจนซีนี้ขาย */
export const PUBLIC_TYPE_KEYS = ['warehouse', 'factory', 'showroom', 'land'] as const;
export type PublicTypeKey = (typeof PUBLIC_TYPE_KEYS)[number];

/* ระดับรับน้ำหนักที่ทีมพูดถึงกันจริง (ตัน/ตร.ม.)
   ลูกค้าขอ "เพิ่มถึง 7 ตัน" — ของในคลังตอนนี้สูงสุด 5 ตัน แต่ตัวกรองต้องรองรับ
   ของที่กำลังจะเข้ามาด้วย ไม่ใช่แค่ของที่มีอยู่วันนี้ */
export const LOAD_STEPS = [0.5, 1, 2, 3, 4, 5, 7];

/* ความสูงอาคารเป็นช่วง ต่ำสุด–สูงสุด ตามแบบที่ลูกค้าชี้มา ไม่ใช่ "ขึ้นไป"
   เพราะคนหาโกดังมีเพดานความสูงจากอาคารเดิมหรือชั้นวางที่วางแผนไว้
   ของในคลังอยู่ช่วง 3–14 ม. ขั้นบันไดจึงกว้างกว่านั้นเล็กน้อยเผื่อของใหม่ */
export const HEIGHT_STEPS = [4, 6, 8, 10, 12, 15, 20];

export function matchesPublicFilters(it: FilterableListing, f: PublicFilterState): boolean {
  if (f.areas.length && !f.areas.includes(it.loc)) return false;
  if (f.colors.length && !f.colors.includes(it.zoning)) return false;
  if (f.zones.length && !f.zones.some((z) => it.zone.includes(z))) return false;
  if (f.features.length && !f.features.every((x) => it.features.includes(x))) return false;
  if (f.load !== null && (it.loadTon === null || it.loadTon < f.load)) return false;
  if (f.hMin !== null && (it.heightM === null || it.heightM < f.hMin)) return false;
  if (f.hMax !== null && (it.heightM === null || it.heightM > f.hMax)) return false;
  return true;
}

/* ---- URL: หน้าแรกเขียน หน้ารายการอ่าน ---------------------------------- */

const listParam = (v: string | string[] | undefined): string[] => {
  const one = Array.isArray(v) ? v[0] : v;
  return (one ?? '').split('|').map((s) => s.trim()).filter(Boolean);
};

export function writeFilterParams(p: URLSearchParams, f: PublicFilterState): void {
  if (f.areas.length) p.set('area', f.areas.join('|'));
  if (f.colors.length) p.set('zone', f.colors.join('|'));
  if (f.zones.length) p.set('estate', f.zones.join('|'));
  if (f.features.length) p.set('feature', f.features.join('|'));
  if (f.load !== null) p.set('load', String(f.load));
  if (f.hMin !== null) p.set('hmin', String(f.hMin));
  if (f.hMax !== null) p.set('hmax', String(f.hMax));
}

/** ตัวเลขบวกจากพารามิเตอร์เดียว หรือ null ถ้าอ่านไม่ได้ */
const numParam = (v: string | string[] | undefined): number | null => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function readFilterParams(sp: Record<string, string | string[] | undefined>): PublicFilterState {
  const hMin = numParam(sp.hmin);
  const hMax = numParam(sp.hmax);
  return {
    areas: listParam(sp.area),
    colors: listParam(sp.zone),
    zones: listParam(sp.estate),
    features: listParam(sp.feature),
    load: numParam(sp.load),
    /* สลับให้เองถ้าใครส่งกลับด้าน — ช่วงที่ต่ำสุดมากกว่าสูงสุดไม่มีวันเจออะไร */
    hMin: hMin !== null && hMax !== null ? Math.min(hMin, hMax) : hMin,
    hMax: hMin !== null && hMax !== null ? Math.max(hMin, hMax) : hMax,
  };
}

/** มีอะไรถูกเลือกไว้ไหม — ใช้ตัดสินว่าจะโชว์ปุ่มล้างตัวกรอง */
export const anyFilterSet = (f: PublicFilterState): boolean =>
  f.areas.length + f.colors.length + f.zones.length + f.features.length > 0
  || f.load !== null || f.hMin !== null || f.hMax !== null;
