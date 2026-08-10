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
import type { Locale } from '@/i18n/config';

type Vals = Record<string, unknown>;

/** field → label, in each locale. Thai matches lib/propertySchema so the
    public page and the admin form call the same thing by the same name. */
const LABELS: Record<string, Record<Locale, string>> = {
  usable_area:     { th: 'พื้นที่ใช้สอย',           en: 'Usable area',          zh: '使用面积' },
  land_area:       { th: 'ขนาดที่ดิน',             en: 'Land area',            zh: '土地面积' },
  clear_height:    { th: 'ความสูงใต้อาคาร',        en: 'Clear height',         zh: '净高' },
  floor_loading:   { th: 'รับน้ำหนักพื้น',          en: 'Floor loading',        zh: '楼板承重' },
  power_system:    { th: 'ระบบไฟฟ้า',              en: 'Power supply',         zh: '供电系统' },
  power_phase:     { th: 'ระบบไฟ (เฟส)',           en: 'Power phase',          zh: '电相' },
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

/** Render one stored value for display, or null when there is nothing to show. */
function format(key: string, v: unknown, locale: Locale): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (Array.isArray(v)) {
    const parts = v.map((x) => enumLabel(String(x), locale)).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  if (typeof v === 'boolean') return v ? YES[locale] : NO[locale];
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
  return u && /^[\d,.]+$/.test(s) ? `${s} ${u}` : enumLabel(s, locale);
}

export type SpecRow = { key: string; label: string; value: string };

/* what the table shows, in the order a tenant reads it */
const TABLE_ORDER = [
  'province', 'district', 'subdistrict', 'amphoe', 'tambon',
  'usable_area', 'land_area', 'clear_height', 'building_height',
  'floor_loading', 'power_system', 'power_phase', 'doors', 'parking',
  'overhead_crane', 'cold_storage', 'factory_license', 'zoning_color', 'zone',
  'price_rent', 'price_sale', 'price_per_sqm',
  'deposit_months', 'advance_months', 'common_fee', 'elec_rate', 'water_rate',
  'lease_term',
];

/* the four tiles above the table — first four of these that have a value */
const QUICK_ORDER = ['usable_area', 'clear_height', 'floor_loading', 'power_system', 'land_area', 'doors'];

function rowsFor(keys: string[], values: Vals, locale: Locale): SpecRow[] {
  const seen = new Set<string>();
  const out: SpecRow[] = [];
  for (const key of keys) {
    const label = LABELS[key]?.[locale];
    if (!label || seen.has(label)) continue; // district/amphoe are the same row
    const value = format(key, values[key], locale);
    if (value === null) continue;
    seen.add(label);
    out.push({ key, label, value });
  }
  return out;
}

export function buildSpecs(values: Vals, locale: Locale) {
  const features = Array.isArray(values.features)
    ? (values.features as unknown[]).map((f) => enumLabel(String(f), locale)).filter(Boolean)
    : [];
  const nearbyRaw = values.nearby;
  const nearby = Array.isArray(nearbyRaw)
    ? (nearbyRaw as unknown[]).map((n) => enumLabel(String(n), locale)).filter(Boolean)
    : typeof nearbyRaw === 'string' && nearbyRaw.trim()
      ? [nearbyRaw.trim()]
      : [];

  return {
    quick: rowsFor(QUICK_ORDER, values, locale).slice(0, 4),
    rows: rowsFor(TABLE_ORDER, values, locale),
    features,
    nearby,
  };
}
