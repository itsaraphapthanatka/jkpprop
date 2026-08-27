import { composeTitle } from '@/lib/propertyTitle';
/* ============================================================
   The "social media status" text — one property's details rendered as a
   ready-to-post block. Lives here (not inside a component) because two
   places build it: the property form's สรุป section and the Social Status
   page. Keeping one implementation means the wording can't drift.
   ============================================================ */

export type SummaryValues = Record<string, unknown>;

export type Summary = {
  text: string;
  filled: number; // how many rows actually got a value
  total: number;
};

/** ขนาดที่เอาไปขึ้นหัวข้อความ — พื้นที่อาคารรวมก่อน แล้วค่อยพื้นที่ใช้สอย */
const areaOf = (v: SummaryValues): number | null => {
  for (const k of ['building_area_total', 'usable_area', 'building_area'] as const) {
    const n = Number(v[k]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

export type SummaryInput = {
  typeLabel: string;
  code?: string;
  values: SummaryValues;
};

const str = (v: SummaryValues, k: string) => {
  const x = v[k];
  return x === undefined || x === null ? '' : String(x);
};

/* ตัวเลขในข้อความนี้เคยพิมพ์ออกดิบ ๆ — "ราคาขาย : 50000000 บาท" กับ
   "พื้นที่ใช้สอยรวม : 1875 ตร.ม." ขณะที่บรรทัดหัวเรื่องข้างบน (composeTitle)
   ใส่จุลภาคให้อยู่แล้ว ข้อความก้อนเดียวกันจึงคั่นหลักไม่เหมือนกันสองแบบ
   คุณกิตติพงษ์แจ้ง 26 ส.ค. 2569 ว่า "ขั้นหน่วยหายครับพวกราคากับขนาด เช่น 1000"

   จัดหลักเฉพาะค่าที่เก็บเป็นตัวเลขจริงเท่านั้น — ช่องอย่าง floor_loading
   ("3 ตัน") กับ power_system ("3 Phase 30/100 amp") เก็บเป็นข้อความที่คนพิมพ์เอง
   ถ้าไปยุ่งกับมันจะกลายเป็นแก้คำพูดของคนกรอก ไม่ใช่จัดรูปแบบตัวเลข */
const numStr = (v: SummaryValues, k: string) => {
  const x = v[k];
  if (typeof x === 'number') return Number.isFinite(x) ? x.toLocaleString('th-TH') : '';
  return x === undefined || x === null ? '' : String(x);
};

const sub = (v: SummaryValues, k: string, sk: string) => {
  const o = v[k] as SummaryValues | undefined;
  const x = o?.[sk];
  if (typeof x === 'number') return Number.isFinite(x) ? x.toLocaleString('th-TH') : '';
  return x === undefined || x === null ? '' : String(x);
};
const list = (v: SummaryValues, k: string) => {
  const x = v[k];
  return Array.isArray(x) ? x.join(', ') : '';
};

/** Empty rows are kept on purpose — ops wanted the full skeleton to paste.
 *  NOTE: this reads an explicit allow-list of keys. Fields flagged
 *  `internalOnly` in the schema (e.g. `internal_note`) must never be added
 *  here — this text is copied out to public listings and social posts. */
export function buildSummary({ typeLabel, code, values: v }: SummaryInput): Summary {
  const land = [
    sub(v, 'land_area_total', 'rai') && `${sub(v, 'land_area_total', 'rai')} ไร่`,
    sub(v, 'land_area_total', 'ngan') && `${sub(v, 'land_area_total', 'ngan')} งาน`,
    sub(v, 'land_area_total', 'wa') && `${sub(v, 'land_area_total', 'wa')} ตร.ว.`,
  ].filter(Boolean).join(' ');
  const place = [str(v, 'subdistrict'), str(v, 'district'), str(v, 'province')].filter(Boolean).join(', ');
  /* บรรทัดหัวคือชื่อประกาศ ประกอบด้วยตัวเดียวกับที่หน้าเว็บใช้ (lib/propertyTitle)
     จึงเรียงตามลำดับที่ลูกค้ากำหนดไว้ในสไลด์ 24 และใส่จุลภาคคั่นหลักพันเหมือนกัน

     เดิมประกอบเองตรงนี้ในลำดับเก่า และหน้า Social Status ส่งชื่อประกาศทั้งดุ้น
     มาเป็น typeLabel หัวข้อความจึงกลายเป็นชื่อประกาศตามด้วยครึ่งหลังของตัวเอง
     ซ้ำกันสองรอบในบรรทัดเดียว */
  const head = composeTitle(
    { typeLabel, values: v, area: areaOf(v), code: code ?? '' },
    'th',
  );
  const office = [str(v, 'office_floors'), numStr(v, 'office_area_total') && `${numStr(v, 'office_area_total')} ตร.ม.`].filter(Boolean).join(' ');

  const rows: [string, string][] = [
    ['ที่ตั้ง', place],
    ['พื้นที่ใช้สอยรวม', numStr(v, 'building_area_total') && `${numStr(v, 'building_area_total')} ตร.ม.`],
    ['ออฟฟิศ', office],
    ['พื้นที่ดิน', land],
    ['ความสูง', numStr(v, 'building_height') && `${numStr(v, 'building_height')} ม.`],
    ['พื้นรับน้ำหนัก', str(v, 'floor_loading')],
    ['ระบบไฟฟ้า', str(v, 'power_system') || str(v, 'power_phase')],
    ['ราคาขาย', numStr(v, 'price_sale') && `${numStr(v, 'price_sale')} บาท`],
    ['ค่าเช่า', numStr(v, 'price_rent') && `${numStr(v, 'price_rent')} บาท/เดือน`],
  ];
  const highlights: [string, string][] = [
    ['โซน', str(v, 'zone')],
    ['ใกล้', str(v, 'nearby')],
    ['พื้นที่สี', str(v, 'zoning_color')],
    ['คุณสมบัติ', list(v, 'features')],
    ['การใช้งาน', list(v, 'usage')],
  ];

  const text = [
    head, '', 'รายละเอียด', '',
    ...rows.map(([k, val]) => `- ${k} : ${val}`),
    '', 'จุดเด่น',
    ...highlights.map(([k, val]) => `- ${k} : ${val}`),
  ].join('\n');

  const all = [...rows, ...highlights];
  return { text, filled: all.filter(([, val]) => val).length, total: all.length };
}
