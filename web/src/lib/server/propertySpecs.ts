/* Turns a property's stored `values` into the rows the public detail page
 * shows.
 *
 * Everything below the headline on /property/<code> used to be constants
 * copied from the design prototype — the same "3 Phase 50/150 Amp", the same
 * "เงินประกัน 3 เดือน (฿1,215,000)", the same "ท่าเรือแหลมฉบัง ห่าง 45 กม.",
 * on every property regardless of where it was or what it cost. Deposit
 * amounts and utility rates are numbers a tenant decides on, so inventing
 * them is worse than leaving them out.
 *
 * A field with no value produces no row. A property with nothing filled in
 * renders a short page, which is the honest outcome.
 */
import { enumLabel } from '@/i18n/enums';
import { provinceLabel, districtLabel, subdistrictLabel, type GeoOverrides } from '@/i18n/places';
import { displayArea } from './propertyDto';
import type { Locale } from '@/i18n/config';
import type { FieldDef } from '@/lib/propertySchema';

type Vals = Record<string, unknown>;

/** field → label, in each locale. Thai matches lib/propertySchema so the
    public page and the admin form call the same thing by the same name. */
const LABELS: Record<string, Record<Locale, string>> = {
  usable_area:     { th: 'พื้นที่ใช้สอย',           en: 'Usable area',          zh: '使用面积' },
  building_area_total: { th: 'พื้นที่อาคารรวม',    en: 'Total building area',  zh: '建筑总面积' },
  building_area:   { th: 'พื้นที่คลัง / ผลิต',       en: 'Warehouse area',       zh: '仓库面积' },
  land_area:       { th: 'ขนาดที่ดิน',             en: 'Land area',            zh: '土地面积' },
  clear_height:    { th: 'ความสูงใต้อาคาร',        en: 'Clear height',         zh: '净高' },
  floor_loading:   { th: 'รับน้ำหนักพื้น',          en: 'Floor loading',        zh: '楼板承重' },
  power_system:    { th: 'ขนาดหม้อแปลงไฟฟ้า',       en: 'Transformer size',     zh: '变压器容量' },
  power_phase:     { th: 'ระบบไฟ',                  en: 'Power supply',         zh: '供电系统' },
  factory_license: { th: 'ขอใบ ร.ง.4 ได้',         en: 'Factory licence (Rg.4)', zh: '可申请工厂许可证' },
  overhead_crane:  { th: 'เครนเหนือศีรษะ',         en: 'Overhead crane',       zh: '行车吊' },
  cold_storage:    { th: 'ห้องเย็น / ควบคุมอุณหภูมิ', en: 'Cold storage',        zh: '冷库' },
  doors:           { th: 'จำนวนประตู',             en: 'Loading doors',        zh: '装卸门数量' },
  building_height: { th: 'ความสูงอาคาร',           en: 'Building height',      zh: '建筑高度' },
  parking:         { th: 'ที่จอดรถ',                en: 'Parking',              zh: '停车位' },
  zoning_color:    { th: 'พื้นที่สี (ผังเมือง)',      en: 'Zoning',               zh: '城市规划分区' },
  zone:            { th: 'โซน',                    en: 'Zone',                 zh: '区域' },
  province:        { th: 'จังหวัด',                 en: 'Province',             zh: '府' },
  district:        { th: 'เขต / อำเภอ',            en: 'District',             zh: '县/区' },
  amphoe:          { th: 'เขต / อำเภอ',            en: 'District',             zh: '县/区' },
  subdistrict:     { th: 'แขวง / ตำบล',            en: 'Subdistrict',          zh: '分区' },
  tambon:          { th: 'แขวง / ตำบล',            en: 'Subdistrict',          zh: '分区' },
  price_rent:      { th: 'ราคาเช่า / เดือน',        en: 'Rent per month',       zh: '月租金' },
  price_sale:      { th: 'ราคาขาย',                en: 'Sale price',           zh: '售价' },
  price_per_sqm:   { th: 'ราคา / ตร.ม.',           en: 'Price per sqm',        zh: '每平方米价格' },
  deposit_months:  { th: 'เงินประกัน',              en: 'Security deposit',     zh: '押金' },
  advance_months:  { th: 'ค่าเช่าล่วงหน้า',          en: 'Advance rent',         zh: '预付租金' },
  elec_rate:       { th: 'ค่าไฟ',                   en: 'Electricity rate',     zh: '电费' },
  water_rate:      { th: 'ค่าน้ำ',                  en: 'Water rate',           zh: '水费' },
  common_fee:      { th: 'ค่าส่วนกลาง',             en: 'Service charge',       zh: '物业费' },
  lease_term:      { th: 'อายุสัญญาเช่า',           en: 'Lease term',           zh: '租期' },
  /* สไลด์ 21: ค่าน้ำ/ไฟ/ส่วนกลาง จ่ายกับเจ้าของอาคารหรือจ่ายกับรัฐ เป็นคนละ
     ต้นทุนกันสำหรับผู้เช่า — เดิมหน้าเว็บบอกแต่ราคาต่อหน่วย */
  elec_bill_pay:   { th: 'ค่าไฟ จ่ายกับ',           en: 'Electricity billed by', zh: '电费缴纳对象' },
  water_bill_pay:  { th: 'ค่าน้ำ จ่ายกับ',           en: 'Water billed by',      zh: '水费缴纳对象' },
  common_bill_pay: { th: 'ค่าส่วนกลาง จ่ายกับ',      en: 'Service charge billed by', zh: '物业费缴纳对象' },
  withholding_tax: { th: 'ภาษีหัก ณ ที่จ่าย',        en: 'Withholding tax',      zh: '预扣税' },
  land_tax:        { th: 'ภาษีที่ดิน',              en: 'Land tax',             zh: '土地税' },
  stamp_duty:      { th: 'อากรแสตมป์',              en: 'Stamp duty',           zh: '印花税' },
  vat:             { th: 'VAT',                    en: 'VAT',                  zh: '增值税' },
  transfer_fee_resp: { th: 'ค่าโอนกรรมสิทธิ์',       en: 'Transfer fee',         zh: '过户费' },
};

/* units appended to a bare number, per locale */
const UNITS: Record<string, Record<Locale, string>> = {
  usable_area:     { th: 'ตร.ม.',        en: 'sqm',        zh: '平方米' },
  land_area:       { th: 'ตร.ม.',        en: 'sqm',        zh: '平方米' },
  clear_height:    { th: 'เมตร',         en: 'm',          zh: '米' },
  building_height: { th: 'เมตร',         en: 'm',          zh: '米' },
  floor_loading:   { th: 'ตัน/ตร.ม.',    en: 't/sqm',      zh: '吨/平方米' },
  deposit_months:  { th: 'เดือน',        en: 'months',     zh: '个月' },
  advance_months:  { th: 'เดือน',        en: 'months',     zh: '个月' },
  lease_term:      { th: 'ปี',           en: 'years',      zh: '年' },
  doors:           { th: 'ประตู',        en: 'doors',      zh: '个' },
  parking:         { th: 'คัน',          en: 'spaces',     zh: '个' },
};

const MONEY = new Set(['price_rent', 'price_sale', 'price_per_sqm', 'elec_rate', 'water_rate', 'common_fee']);

const YES: Record<Locale, string> = { th: 'ได้', en: 'Yes', zh: '可以' };
const NO: Record<Locale, string> = { th: 'ไม่ได้', en: 'No', zh: '不可以' };

const num = (n: number, locale: Locale) =>
  n.toLocaleString(locale === 'th' ? 'th-TH' : locale === 'zh' ? 'zh-CN' : 'en-US');

/* Units the team types into free-text fields, as they type them. */
const TH_UNIT_WORD: Record<string, Record<Locale, string>> = {
  'ตัน': { th: 'ตัน', en: 'tonnes', zh: '吨' },
  'ตร.ม.': { th: 'ตร.ม.', en: 'sqm', zh: '平方米' },
  'ตร.ว.': { th: 'ตร.ว.', en: 'sq wah', zh: '平方哇' },
  'ไร่': { th: 'ไร่', en: 'rai', zh: '莱' },
  'เมตร': { th: 'เมตร', en: 'm', zh: '米' },
  'ม.': { th: 'ม.', en: 'm', zh: '米' },
  'กก.': { th: 'กก.', en: 'kg', zh: '公斤' },
  'กม.': { th: 'กม.', en: 'km', zh: '公里' },
  'คัน': { th: 'คัน', en: 'vehicles', zh: '辆' },
  'ช่อง': { th: 'ช่อง', en: 'bays', zh: '个' },
};

/* Place names are not enum options, so enumLabel never had a row for them and
   the table printed the stored Thai to an English reader — "กรุงเทพ" under
   Province, "ลาดกระบัง" under District. They have their own tables. */
const PLACE_LABEL: Record<string, (v: unknown, l: Locale, o?: GeoOverrides) => string> = {
  province: provinceLabel,
  district: districtLabel, amphoe: districtLabel,
  subdistrict: subdistrictLabel, tambon: subdistrictLabel,
};

/** Render one stored value for display, or null when there is nothing to show. */
function format(key: string, v: unknown, locale: Locale, over?: GeoOverrides): string | null {
  if (v === null || v === undefined || v === '') return null;
  const place = PLACE_LABEL[key];
  if (place && typeof v === 'string') return place(v, locale, over) || null;
  if (Array.isArray(v)) {
    const parts = v.map((x) => enumLabel(String(x), locale)).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  if (typeof v === 'boolean') return v ? YES[locale] : NO[locale];
  /* ภาษีและค่าธรรมเนียมเก็บเป็นคู่ { payer, amount } — เดิมตกลงมาถึง String(v)
     แล้วกลายเป็น "[object Object]" บนหน้าเว็บสาธารณะ */
  if (typeof v === 'object') {
    const g = v as { payer?: unknown; amount?: unknown };
    const payer = typeof g.payer === 'string' ? enumLabel(g.payer.trim(), locale) : '';
    const amt = typeof g.amount === 'number' && Number.isFinite(g.amount)
      ? `฿${num(g.amount, locale)}`
      : typeof g.amount === 'string' && g.amount.trim() ? `฿${g.amount.trim()}` : '';
    const out = [payer, amt].filter(Boolean).join(' · ');
    return out || null;
  }
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null;
    if (MONEY.has(key)) return `฿${num(v, locale)}`;
    const u = UNITS[key]?.[locale];
    return u ? `${num(v, locale)} ${u}` : num(v, locale);
  }
  const s = String(v).trim();
  if (!s) return null;
  const u = UNITS[key]?.[locale];
  // a stored "3,500" is still a measurement and still wants its unit
  if (u && /^[\d,.]+$/.test(s)) return `${s} ${u}`;
  /* Free-text measurements arrive with the unit typed in — the imported sheet
     fills floor loading in as "3 ตัน". The number is language-neutral; only
     the word after it needs translating, and translating it into the field's
     own unit would be a different claim ("3 tonnes" is not "3 t/sqm"). */
  const measured = s.match(/^([\d,.]+)\s*([ก-๙.]+)$/);
  const word = measured && TH_UNIT_WORD[measured[2]]?.[locale];
  if (word) return `${measured![1]} ${word}`;
  return enumLabel(s, locale);
}

export type SpecRow = { key: string; label: string; value: string };

/* what the table shows, in the order a tenant reads it */
const TABLE_ORDER = [
  'province', 'district', 'subdistrict', 'amphoe', 'tambon',
  'usable_area', 'land_area', 'clear_height', 'building_height',
  'floor_loading', 'power_system', 'power_phase', 'doors', 'parking',
  'overhead_crane', 'cold_storage', 'factory_license', 'zoning_color', 'zone',
  /* เรียงตามที่ลูกค้าร่างไว้: ราคา → ค่าสาธารณูปโภค (พร้อม "จ่ายกับใคร" ต่อท้าย
     แต่ละรายการ) → ภาษีและค่าธรรมเนียม → เงื่อนไขสัญญา */
  'price_rent', 'price_sale', 'price_per_sqm',
  'elec_rate', 'elec_bill_pay', 'water_rate', 'water_bill_pay', 'common_fee', 'common_bill_pay',
  'withholding_tax', 'land_tax', 'vat', 'stamp_duty', 'transfer_fee_resp',
  'deposit_months', 'advance_months', 'lease_term',
];

/* การ์ดสรุปสี่ใบเหนือตาราง — เอาคีย์แรก ๆ ที่มีค่า
   ลูกค้าคอมเมนต์ไว้ว่า "รับน้ำหนัก ความสูงหาย" เพราะลำดับเดิมขึ้นต้นด้วย
   usable_area / clear_height / power_system ซึ่งข้อมูลจริงไม่มีสักรายการ
   (0 จาก 395) การ์ดจึงเหลือแค่สองใบท้าย ๆ ที่บังเอิญมีค่า */
const QUICK_ORDER = [
  'building_area_total', 'building_height', 'floor_loading', 'power_phase',
  // คีย์สำรองสำหรับเรกคอร์ดที่กรอกคนละชุด — ใช้เมื่อสี่ตัวบนยังไม่ครบสี่ใบ
  'usable_area', 'clear_height', 'power_system', 'land_area', 'doors', 'building_area',
];

function rowsFor(keys: string[], values: Vals, locale: Locale, off: Set<string>, over?: GeoOverrides): SpecRow[] {
  const seen = new Set<string>();
  const out: SpecRow[] = [];
  for (const key of keys) {
    if (off.has(key)) continue; // switched off in the Field Builder
    const label = LABELS[key]?.[locale];
    if (!label || seen.has(label)) continue; // district/amphoe are the same row
    const value = format(key, values[key], locale, over);
    if (value === null) continue;
    seen.add(label);
    out.push({ key, label, value });
  }
  return out;
}

/* A field the team added in the Field Builder. Its label comes from the
   override — in the reader's language when they filled that in, otherwise the
   Thai one, which beats hiding the row. */
function customRows(extra: FieldDef[], values: Vals, locale: Locale, off: Set<string>): SpecRow[] {
  const out: SpecRow[] = [];
  for (const f of extra) {
    if (off.has(f.key)) continue;
    const value = format(f.key, values[f.key], locale);
    if (value === null) continue;
    const label = (locale === 'en' ? f.labelEn : locale === 'zh' ? f.labelZh : '') || f.label;
    out.push({ key: f.key, label: f.unit ? `${label} (${f.unit})` : label, value });
  }
  return out;
}

/** What the Field Builder says about this property's type, if anything. */
export type SpecSchema = { disabled?: string[]; extra?: FieldDef[] };

export function buildSpecs(values: Vals, locale: Locale, schema: SpecSchema = {}, over?: GeoOverrides) {
  /* ลูกค้าแจ้งว่า "หน้าขายไม่แสดงราคาต่อ ตร.ม." — ช่องนี้มีอยู่ แต่จะขึ้นก็ต่อเมื่อ
     มีคนพิมพ์ตัวเลขเข้าไปเอง ซึ่งไม่มีใครพิมพ์ ทั้งที่คำนวณได้จากราคาขายกับพื้นที่
     ที่กรอกไว้แล้ว · ฝั่งเช่าคำนวณให้อยู่แล้วในหัวเรื่องราคา */
  const asNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const sale = asNumber(values.price_sale) ?? asNumber(values.price);
  const area = displayArea(values);
  /* ข้อมูลที่นำเข้ามาเก็บช่องนี้เป็น null ไม่ใช่ไม่มีคีย์ — เช็คแค่ undefined
     จึงไม่เคยเข้าเงื่อนไข และหน้าขายก็ยังไม่มีราคาต่อ ตร.ม. เหมือนเดิม */
  const hasOwn = values.price_per_sqm !== undefined && values.price_per_sqm !== null && values.price_per_sqm !== '';
  if (!hasOwn && sale && area) {
    values = { ...values, price_per_sqm: Math.round(sale / area) };
  }
  /* Turning a field off used to hide it from the admin form only: the public
     page kept printing whatever was already stored, so a field switched off
     on purpose stayed on the website. */
  const off = new Set(schema.disabled ?? []);
  const features = Array.isArray(values.features)
    ? (values.features as unknown[]).map((f) => enumLabel(String(f), locale)).filter(Boolean)
    : [];
  /* "การใช้งานที่เหมาะ" เก็บไว้ครบทั้ง 393 รายการ แต่ไม่มีหน้าไหนแสดงเลย
     ลูกค้าเขียนรายการที่ต้องการไว้ในสไลด์ 13 */
  const usage = Array.isArray(values.usage)
    ? (values.usage as unknown[]).map((u) => enumLabel(String(u), locale)).filter(Boolean)
    : [];
  const nearbyRaw = values.nearby;
  const nearby = Array.isArray(nearbyRaw)
    ? (nearbyRaw as unknown[]).map((n) => enumLabel(String(n), locale)).filter(Boolean)
    : typeof nearbyRaw === 'string' && nearbyRaw.trim()
      ? [nearbyRaw.trim()]
      : [];

  return {
    quick: rowsFor(QUICK_ORDER, values, locale, off, over).slice(0, 4),
    /* custom fields come after the built-in ones, in the order the Field
       Builder lists them — the table's own order is a reading order for
       tenants (place, size, power, price) and stays as it is */
    rows: [...rowsFor(TABLE_ORDER, values, locale, off, over), ...customRows(schema.extra ?? [], values, locale, off)],
    features,
    usage,
    nearby,
  };
}
