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

export type SummaryInput = {
  typeLabel: string;
  code?: string;
  values: SummaryValues;
};

const str = (v: SummaryValues, k: string) => {
  const x = v[k];
  return x === undefined || x === null ? '' : String(x);
};
const sub = (v: SummaryValues, k: string, sk: string) => {
  const o = v[k] as SummaryValues | undefined;
  const x = o?.[sk];
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
  const head = [
    typeLabel,
    str(v, 'deal_type'),
    str(v, 'building_area_total') && `${str(v, 'building_area_total')} ตร.ม.`,
    [str(v, 'district'), str(v, 'province')].filter(Boolean).join(', '),
    code ? `(${code})` : '',
  ].filter(Boolean).join(' ');
  const office = [str(v, 'office_floors'), str(v, 'office_area_total') && `${str(v, 'office_area_total')} ตร.ม.`].filter(Boolean).join(' ');

  const rows: [string, string][] = [
    ['ที่ตั้ง', place],
    ['พื้นที่ใช้สอยรวม', str(v, 'building_area_total') && `${str(v, 'building_area_total')} ตร.ม.`],
    ['ออฟฟิศ', office],
    ['พื้นที่ดิน', land],
    ['ความสูง', str(v, 'building_height') && `${str(v, 'building_height')} ม.`],
    ['พื้นรับน้ำหนัก', str(v, 'floor_loading')],
    ['ระบบไฟฟ้า', str(v, 'power_system') || str(v, 'power_phase')],
    ['ราคาขาย', str(v, 'price_sale') && `${str(v, 'price_sale')} บาท`],
    ['ค่าเช่า', str(v, 'price_rent') && `${str(v, 'price_rent')} บาท/เดือน`],
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
