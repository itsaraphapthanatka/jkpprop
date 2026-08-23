/* ไฟล์ CSV ที่ปุ่ม Export ในหน้า Properties และ Listings สร้างขึ้น
 *
 * ลูกค้าแจ้งว่า "export ข้อมูลออกมาน้อยไป ให้ export ทุกฟิลด์ของ
 * Properties, Listings" — เดิมทั้งสองหน้าเขียนรายชื่อคอลัมน์ไว้เองหน้าละชุด
 * ได้ออกมา 8–9 ช่อง จากทั้งหมด 88 ฟิลด์ที่ระบบเก็บ ข้อมูลอย่างค่าไฟ ค่าน้ำ
 * ความสูงใต้คาน ใบอนุญาต ผังเมือง เจ้าของ ฯลฯ ไม่เคยออกมาเลย
 *
 * คอลัมน์สร้างจาก schema โดยตรง (รวมทุกประเภททรัพย์แล้วตัดที่ซ้ำออก) เพิ่ม
 * ฟิลด์ใหม่ในฟอร์มครั้งหน้าจึงโผล่ในไฟล์เองโดยไม่ต้องมาแก้ที่นี่
 *
 * หมายเหตุ: ปุ่ม Export เปิดให้เฉพาะเจ้าของระบบ (สิทธิ์ export ถูกห้ามไว้กับ
 * ทุกบทบาทอื่นใน rbac.ts) ไฟล์นี้จึงมีข้อมูลภายในอย่างเบอร์ผู้ให้เช่าและพิกัด
 * ติดไปด้วย — เป็นข้อมูลของบริษัทเอง แต่ห้ามส่งต่อออกนอกทีม
 */
import { PROPERTY_TYPES, type FieldDef } from '@/lib/propertySchema';

export type ExportCol = { key: string; label: string; sub?: string };

/* ฟิลด์ที่ระบบเก็บเองและไม่ใช่ของที่คนกรอก — ออกเป็นคอลัมน์ต้นไฟล์แทน */
const BASE_KEYS = new Set(['photos', 'video']);

/* ฟิลด์เดียวกันบางตัวตั้งชื่อไม่เหมือนกันในแต่ละประเภททรัพย์ (zoning_color เป็น
   "ผังเมืองสีอะไร" ในที่ดิน แต่เป็น "พื้นที่สี (ผังเมือง)" ในโกดัง) ข้อมูลเป็นช่อง
   เดียวกัน จึงเป็นคอลัมน์เดียว แต่ใส่ชื่อทั้งสองแบบไว้ให้คนหาเจอไม่ว่าจะคุ้นชื่อไหน */
function labelsByKey(): Map<string, string> {
  const all = new Map<string, Set<string>>();
  for (const t of PROPERTY_TYPES) {
    for (const f of t.fields) {
      if (!all.has(f.key)) all.set(f.key, new Set());
      all.get(f.key)!.add(f.label);
    }
  }
  return new Map([...all].map(([k, v]) => [k, [...v].join(' / ')]));
}

/** ทุกฟิลด์ของทุกประเภททรัพย์ เรียงตามลำดับใน schema ตัดที่ซ้ำออก */
export function exportColumns(): ExportCol[] {
  const seen = new Set<string>();
  const names = labelsByKey();
  const out: ExportCol[] = [];
  const push = (f: FieldDef) => {
    if (BASE_KEYS.has(f.key)) return;
    const label = names.get(f.key) ?? f.label;
    /* ฟิลด์กลุ่ม (ขนาดที่ดิน ไร่/งาน/วา · ภาษี ใครจ่าย/เท่าไร) แยกเป็นคอลัมน์ย่อย
       ไม่งั้นจะได้ก้อน JSON ที่เอาไปใช้ต่อใน Excel ไม่ได้ */
    if ((f.kind === 'group' || f.kind === 'location') && f.sub?.length) {
      for (const sub of f.sub) {
        const id = `${f.key}.${sub.key}`;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ key: f.key, sub: sub.key, label: `${label} — ${sub.label}` });
      }
      return;
    }
    if (seen.has(f.key)) return;
    seen.add(f.key);
    out.push({ key: f.key, label });
  };
  for (const t of PROPERTY_TYPES) for (const f of t.fields) push(f);
  return out;
}

/** ค่าหนึ่งช่องในรูปแบบที่เปิดใน Excel แล้วอ่านรู้เรื่อง */
export function exportValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v ? 'ใช่' : 'ไม่ใช่';
  if (Array.isArray(v)) return v.map((x) => exportValue(x)).filter(Boolean).join(' | ');
  if (typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => (val === null || val === undefined || val === '' ? '' : `${k}=${exportValue(val)}`))
      .filter(Boolean)
      .join('; ');
  }
  return String(v);
}

/** ใส่เครื่องหมายคำพูดเฉพาะช่องที่ต้องการจริง ๆ */
export const csvCell = (v: unknown) => {
  const t = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export type ExportRow = {
  code: string;
  title: string;
  typeLabel: string;
  status: string;
  location: string;
  updatedAt: number | null;
  /** ว่าง / ไม่ว่าง ตามที่ทีมทำเครื่องหมายไว้ — คนละเรื่องกับสถานะประกาศ */
  available?: boolean;
  values: Record<string, unknown>;
  /** หัวเรื่อง/คำบรรยายภาษาอื่น — เก็บแยกจาก values */
  i18n?: Record<string, { title?: string; description?: string } | undefined>;
  /** จำนวนรูป และลิงก์รูปทั้งหมด */
  photos?: string[];
};

/* ลำดับคอลัมน์ที่ตกลงกันไว้ในชีต (สไลด์ 9 · "นำข้อมูลออกแบบที่คุยกันเอาไว้")
   หัวคอลัมน์ใช้ตามชีตเป๊ะ ๆ (ส่วนใหญ่เป็นชื่อฟิลด์อังกฤษ ปนไทยบางช่อง) เพราะ
   ทีมเอาไฟล์นี้ไปต่อกับของเดิมที่ทำไว้ ถ้าเปลี่ยนชื่อหัวจะพังทั้งชีต */
type Calc = 'code' | 'typeLabel' | 'title' | 'available' | 'listingStatus' | 'latlng' | 'mapUrl' | 'pageUrl';
type SheetCol = { head: string; key?: string; sub?: string; calc?: Calc };

const SHEET_COLUMNS: SheetCol[] = [
  { head: 'public_code', calc: 'code' },
  { head: 'PIC', key: 'pic' },
  { head: 'ประเภททรัพย์', calc: 'typeLabel' },
  { head: 'title', calc: 'title' },
  /* ชีตเก็บ ว่าง / ไม่ว่าง / อยู่ระหว่างก่อสร้าง — ระบบมีแค่สองสถานะแรก
     สถานะที่สามยังไม่มีที่เก็บ ต้องเพิ่มฟิลด์ก่อนจึงจะออกมาได้ */
  { head: 'status', calc: 'available' },
  { head: 'listing_status', calc: 'listingStatus' },
  { head: 'deal_type', key: 'deal_type' },
  { head: 'listing_date', key: 'listing_date' },
  { head: 'subdistrict', key: 'subdistrict' },
  { head: 'district', key: 'district' },
  { head: 'province', key: 'province' },
  { head: 'zoning_color', key: 'zoning_color' },
  { head: 'zone', key: 'zone' },
  { head: 'nearby', key: 'nearby' },
  { head: 'lessor_status', key: 'lessor_status' },
  { head: 'ทำสัญญาในนาม', key: 'contract_name' },
  { head: 'lessor_company', key: 'lessor_company' },
  { head: 'lessor_name', key: 'lessor_name' },
  { head: 'lessor_phone', key: 'lessor_phone' },
  { head: 'land_wh', key: 'land_wh' },
  { head: 'rai', key: 'land_area_total', sub: 'rai' },
  { head: 'ngan', key: 'land_area_total', sub: 'ngan' },
  { head: 'wa', key: 'land_area_total', sub: 'wa' },
  { head: 'building_area', key: 'building_area' },
  { head: 'building_wh', key: 'building_wh' },
  { head: 'office_floors', key: 'office_floors' },
  { head: 'building_floors', key: 'building_floors' },
  { head: 'office_area_f1', key: 'office_area_f1' },
  { head: 'office_area_total', key: 'office_area_total' },
  { head: 'building_total_wh', key: 'building_total_wh' },
  { head: 'building_area_total', key: 'building_area_total' },
  { head: 'doors', key: 'doors' },
  { head: 'door_wh', key: 'door_wh' },
  { head: 'building_height', key: 'building_height' },
  { head: 'parking', key: 'parking' },
  { head: 'power_phase', key: 'power_phase' },
  { head: 'power_system', key: 'power_system' },
  { head: 'floor_loading', key: 'floor_loading' },
  { head: 'cold_storage', key: 'cold_storage' },
  { head: 'price_rent', key: 'price_rent' },
  { head: 'price_per_sqm', key: 'price_per_sqm' },
  { head: 'price_sale', key: 'price_sale' },
  /* payer/amount อยู่ก่อนสองช่องภาษีที่มีชื่อของตัวเอง จึงอ่านเป็นอากรแสตมป์ */
  { head: 'payer', key: 'stamp_duty', sub: 'payer' },
  { head: 'amount', key: 'stamp_duty', sub: 'amount' },
  { head: 'ภาษีหัก ณ ที่จ่าย', key: 'withholding_tax' },
  { head: 'ภาษีที่ดิน', key: 'land_tax' },
  { head: 'vat', key: 'vat' },
  { head: 'transfer_fee_resp', key: 'transfer_fee_resp' },
  { head: 'common_fee', key: 'common_fee' },
  { head: 'elec_rate', key: 'elec_rate' },
  { head: 'water_rate', key: 'water_rate' },
  { head: 'common_bill_pay', key: 'common_bill_pay' },
  { head: 'Water_bill_pay', key: 'water_bill_pay' },
  { head: 'elec_bill_pay', key: 'elec_bill_pay' },
  { head: 'lease_term', key: 'lease_term' },
  { head: 'deposit_months', key: 'deposit_months' },
  { head: 'advance_months', key: 'advance_months' },
  { head: 'features', key: 'features' },
  { head: 'usage', key: 'usage' },
  { head: 'internal_note', key: 'internal_note' },
  { head: 'ละติจูด ลองติจูด', calc: 'latlng' },
  { head: 'ลิงค์แผนที่', calc: 'mapUrl' },
  { head: 'ลิงค์ประกาศเว็บไซด์', calc: 'pageUrl' },
];

/* ช่องที่ชีตกินไปแล้ว — ฟิลด์ที่เหลือถูกต่อท้ายไว้ไม่ให้ข้อมูลหาย
   ("export ข้อมูลออกมาน้อยไป") ถ้าอยากได้เฉพาะ 63 ช่องตามชีต ตัด extra ทิ้ง */
const CLAIMED = new Set(
  SHEET_COLUMNS.map((c) => (c.key ? (c.sub ? `${c.key}.${c.sub}` : c.key) : '')).filter(Boolean),
);

const extraColumns = (): ExportCol[] =>
  exportColumns().filter((c) => !CLAIMED.has(c.sub ? `${c.key}.${c.sub}` : c.key));

/* คอลัมน์ท้ายสุดที่ไม่ได้อยู่ในชีต แต่ทีมใช้จริง */
const TAIL_HEAD = ['อัปเดตล่าสุด', 'จำนวนรูป', 'ลิงก์รูปทั้งหมด', 'ชื่อประกาศ (EN)', 'คำบรรยาย (EN)', 'ชื่อประกาศ (ZH)', 'คำบรรยาย (ZH)'];

const pin = (v: Record<string, unknown>): { lat: number; lng: number } | null => {
  const m = v.location_map as { lat?: unknown; lng?: unknown } | undefined;
  return m && typeof m.lat === 'number' && typeof m.lng === 'number' ? { lat: m.lat, lng: m.lng } : null;
};

/** สร้างไฟล์ CSV ทั้งใบ พร้อม BOM ให้ Excel อ่านภาษาไทยออก */
export function buildPropertyCsv(rows: ExportRow[], origin = ''): string {
  const extra = extraColumns();
  const head = [...SHEET_COLUMNS.map((c) => c.head), ...extra.map((c) => c.label), ...TAIL_HEAD];

  const body = rows.map((r) => {
    const v = r.values ?? {};
    const photos = r.photos ?? (Array.isArray(v.photos) ? (v.photos as unknown[]).filter((x): x is string => typeof x === 'string') : []);
    const p = pin(v);

    const sheet = SHEET_COLUMNS.map((c) => {
      switch (c.calc) {
        case 'code': return r.code;
        case 'typeLabel': return r.typeLabel;
        case 'title': return r.title;
        case 'available': return r.available === undefined ? '' : r.available ? 'ว่าง' : 'ไม่ว่าง';
        case 'listingStatus': return r.status;
        case 'latlng': return p ? `${p.lat}, ${p.lng}` : '';
        case 'mapUrl': return p ? `https://www.google.com/maps?q=${p.lat},${p.lng}` : '';
        case 'pageUrl': return `${origin}/th/property/${r.code}`;
        default: break;
      }
      const raw = c.sub ? (v[c.key!] as Record<string, unknown> | undefined)?.[c.sub] : v[c.key!];
      return exportValue(raw);
    });

    const rest = extra.map((c) => {
      const raw = c.sub ? (v[c.key] as Record<string, unknown> | undefined)?.[c.sub] : v[c.key];
      return exportValue(raw);
    });

    const tail = [
      r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : '',
      String(photos.length), photos.join(' | '),
      r.i18n?.en?.title ?? '', r.i18n?.en?.description ?? '',
      r.i18n?.zh?.title ?? '', r.i18n?.zh?.description ?? '',
    ];
    return [...sheet, ...rest, ...tail].map(csvCell).join(',');
  });
  return '\ufeff' + [head.map(csvCell).join(','), ...body].join('\n');
}
