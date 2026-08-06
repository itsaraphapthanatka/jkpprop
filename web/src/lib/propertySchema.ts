/* ============================================================
   Central property-type field schema (schema-driven forms).

   ONE source of truth for "what fields each property type collects".
   - Field Builder edits it (enable/disable, reorder, add) and saves.
   - The "เพิ่มทรัพย์ใหม่" modal + "แก้ไขทรัพย์" form read it and render
     the enabled fields for the selected type.

   No backend yet → overrides (enabled flags, order, custom fields) are
   persisted to localStorage so edits in Field Builder take effect in the
   create/edit forms across navigation. See propertySchemaStore below.
   ============================================================ */

export type FieldKind =
  | 'dealtype' // ขาย / ปล่อยเช่า / ขายและปล่อยเช่า (segmented)
  | 'text'
  | 'textarea' // multi-line text (description / note)
  | 'number'
  | 'price'
  | 'date' // date picker
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'media' // รูป / วิดีโอ / เอกสาร (mock upload)
  | 'location' // group: ชื่อโครงการ/ตำบล/อำเภอ/จังหวัด/พิกัด
  | 'map' // interactive Leaflet map + lat/lng/link
  | 'summary' // read-only: ประกอบร่างข้อความจากทุกฟิลด์ที่กรอก + ปุ่มคัดลอก
  | 'group'; // generic sub-field group (e.g. ขนาดที่ดิน ไร่-งาน-วา)

/** แสดงฟิลด์นี้เฉพาะเมื่อฟิลด์อื่นมีค่าตรงตามที่ระบุ (เช่น ภาษีที่โผล่ตามประเภทประกาศ) */
export type ShowWhen = { field: string; in: string[] };

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[]; // select / multiselect / dealtype
  unit?: string; // number / price suffix
  placeholder?: string;
  required?: boolean; // locked ON — can't be disabled in Field Builder
  system?: boolean; // system field badge
  note?: string; // small helper text
  section?: string; // group fields under a section header in the form
  ai?: boolean; // textarea: show "ให้ AI ช่วยเขียน" helper
  showWhen?: ShowWhen; // conditional visibility
  sub?: { key: string; label: string; kind?: FieldKind; options?: string[]; unit?: string; placeholder?: string }[]; // for location / group
};

export type PropertyType = { key: string; label: string; icon: string; fields: FieldDef[] };

/* ---- shared field fragments reused across types ---- */
const F = {
  deal: (): FieldDef => ({ key: 'deal_type', label: 'ประเภทประกาศ', kind: 'dealtype', options: ['ขาย', 'ปล่อยเช่า', 'ขายและปล่อยเช่า'], required: true }),
  price: (): FieldDef => ({ key: 'price', label: 'ราคาขาย / ราคาปล่อยเช่า', kind: 'price', unit: 'บาท' }),
  transfer: (): FieldDef => ({ key: 'transfer_fee', label: 'ค่าใช้จ่ายวันโอนกรรมสิทธิ์', kind: 'select', options: ['ผู้ขายรับผิดชอบ 100%', 'ผู้ขายและผู้ซื้อ 50/50', 'ผู้ซื้อรับผิดชอบ 100%'] }),
  photos: (): FieldDef => ({ key: 'photos', label: 'รูปถ่าย', kind: 'media', required: true }),
  video: (): FieldDef => ({ key: 'video', label: 'วิดีโอ (ถ้ามี)', kind: 'media' }),
};

const ICON_HOUSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A3FB0" stroke-width="1.8"><path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path></svg>';
const ICON_CONDO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A3FB0" stroke-width="1.8"><rect x="4" y="2" width="16" height="20" rx="1"></rect><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M10 22v-4h4v4"></path></svg>';
const ICON_LAND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#034956" stroke-width="1.8"><path d="M3 20h18M5 20V9l7-4 7 4v11"></path><path d="M9 20v-5h6v5"></path></svg>';
const ICON_FACTORY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#034956" stroke-width="1.8"><path d="M2 21h20"></path><path d="M4 21V10l5 3V10l5 3V10l5 3v8"></path></svg>';
const ICON_WAREHOUSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#034956" stroke-width="1.8"><path d="M3 21V8l9-5 9 5v13"></path><path d="M3 21h18"></path><path d="M7 21v-8h10v8"></path></svg>';
const ICON_SHOWROOM = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#034956" stroke-width="1.8"><path d="M3 9l1.5-5h15L21 9"></path><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"></path><path d="M5 11v10h14V11"></path><path d="M9 21v-6h6v6"></path></svg>';

const LOC_HOME: FieldDef = {
  key: 'location', label: 'ตำแหน่งบ้าน', kind: 'location',
  sub: [
    { key: 'project', label: 'ชื่อหมู่บ้าน / ชื่อโครงการ', kind: 'text' },
    { key: 'tambon', label: 'แขวง / ตำบล', kind: 'text' },
    { key: 'amphoe', label: 'เขต / อำเภอ', kind: 'text' },
    { key: 'province', label: 'จังหวัด', kind: 'text' },
    { key: 'map', label: 'พิกัดใน Google Map', kind: 'text' },
  ],
};
const LOC_CONDO: FieldDef = { ...LOC_HOME, label: 'ตำแหน่งโครงการ', sub: [{ key: 'project', label: 'ชื่อโครงการ', kind: 'text' }, ...LOC_HOME.sub!.slice(1)] };
const LOC_LAND: FieldDef = {
  key: 'location', label: 'ตำแหน่งที่ดิน', kind: 'location', required: true,
  sub: [
    { key: 'tambon', label: 'แขวง / ตำบล', kind: 'text' },
    { key: 'amphoe', label: 'เขต / อำเภอ', kind: 'text' },
    { key: 'province', label: 'จังหวัด', kind: 'text' },
    { key: 'map', label: 'พิกัดใน Google Map', kind: 'text' },
  ],
};

const HOUSE: PropertyType = {
  key: 'house', label: 'บ้าน', icon: ICON_HOUSE,
  fields: [
    F.deal(),
    { key: 'house_type', label: 'ประเภทบ้าน', kind: 'select', options: ['บ้านเดี่ยว', 'บ้านแฝด', 'ทาวน์เฮาส์ / ทาวน์โฮม'], required: true },
    { key: 'land_area', label: 'พื้นที่ดิน', kind: 'number', unit: 'ตารางวา' },
    { key: 'usable_area', label: 'พื้นที่ใช้สอย', kind: 'number', unit: 'ตารางเมตร' },
    { key: 'floors', label: 'จำนวนชั้น', kind: 'select', options: ['1 ชั้น', '2 ชั้น', '3 ชั้น', '4 ชั้น'] },
    { key: 'bedrooms', label: 'จำนวนห้องนอน', kind: 'select', options: ['1 ห้อง', '2 ห้อง', '3 ห้อง', '4 ห้อง', '5 ห้อง'] },
    { key: 'bathrooms', label: 'จำนวนห้องน้ำ', kind: 'select', options: ['1 ห้อง', '2 ห้อง', '3 ห้อง', '4 ห้อง', '5 ห้อง'] },
    { key: 'kitchen', label: 'ห้องครัว', kind: 'boolean' },
    { key: 'maid_room', label: 'ห้องแม่บ้าน (ถ้ามี)', kind: 'boolean' },
    { key: 'parking', label: 'ที่จอดรถ', kind: 'select', options: ['1 คัน', '2 คัน', '3 คัน'] },
    { key: 'common_fee', label: 'ค่าส่วนกลาง', kind: 'price', unit: 'บาท / ตารางวา' },
    { key: 'common_area', label: 'พื้นที่ส่วนกลาง (กรณีโครงการจัดสรร)', kind: 'multiselect', options: ['สวน', 'สระว่ายน้ำ'] },
    { key: 'appliances', label: 'เครื่องใช้ไฟฟ้าในบ้าน', kind: 'multiselect', options: ['แอร์', 'เครื่องทำน้ำอุ่น', 'อื่นๆ'], note: 'ระบุจำนวนได้ในหมายเหตุ (มีให้กี่เครื่อง)' },
    { key: 'furniture', label: 'เฟอร์นิเจอร์', kind: 'select', options: ['มีเฟอร์นิเจอร์', 'บ้านเปล่า'] },
    F.price(),
    F.transfer(),
    LOC_HOME,
    F.photos(),
    F.video(),
    { key: 'deed_copy', label: 'สำเนาโฉนดที่ดิน (หน้า–หลัง)', kind: 'media', required: true, note: 'เอกสารสิทธิ์ — จำเป็นต้องมี' },
    { key: 'tordor13', label: 'สำเนาใบ ท.ด.13', kind: 'media', note: 'ใบซื้อขายที่ดิน (ได้มาพร้อมโฉนด) — ไม่มีก็ได้' },
  ],
};

const CONDO: PropertyType = {
  key: 'condo', label: 'คอนโด', icon: ICON_CONDO,
  fields: [
    F.deal(),
    { key: 'condo_type', label: 'ประเภทคอนโด', kind: 'select', options: ['Studio', 'Duplex', '1 ห้องนอน', '2 ห้องนอน'], required: true },
    { key: 'bathrooms', label: 'จำนวนห้องน้ำ', kind: 'select', options: ['1 ห้อง', '2 ห้อง'] },
    { key: 'kitchen', label: 'ห้องครัว', kind: 'select', options: ['1 ห้อง', '2 ห้อง'] },
    { key: 'usable_area', label: 'พื้นที่ใช้สอย', kind: 'number', unit: 'ตารางเมตร' },
    { key: 'balcony_dir', label: 'ระเบียงหันทิศไหน', kind: 'select', options: ['เหนือ', 'ใต้', 'ตะวันออก', 'ตะวันตก', 'อื่นๆ'] },
    { key: 'building', label: 'ห้องอยู่อาคารไหน', kind: 'text' },
    { key: 'floor_at', label: 'ห้องอยู่ชั้นที่เท่าไหร่', kind: 'number', unit: 'ชั้น' },
    { key: 'building_floors', label: 'ตึกสูงกี่ชั้น', kind: 'number', unit: 'ชั้น' },
    { key: 'total_buildings', label: 'ในโครงการมีทั้งหมดกี่ตึก', kind: 'number', unit: 'ตึก' },
    { key: 'common_fee', label: 'ค่าส่วนกลาง', kind: 'price', unit: 'บาท / ตารางเมตร' },
    { key: 'common_area', label: 'พื้นที่ส่วนกลาง', kind: 'multiselect', options: ['สวน', 'สระว่ายน้ำ', 'ฟิตเนส', 'อื่นๆ'] },
    { key: 'appliances', label: 'เครื่องใช้ไฟฟ้าในห้อง', kind: 'multiselect', options: ['แอร์', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'เครื่องซักผ้า', 'อื่นๆ'] },
    { key: 'furniture', label: 'เฟอร์นิเจอร์', kind: 'select', options: ['มีเฟอร์นิเจอร์', 'ห้องเปล่า'] },
    F.price(),
    F.transfer(),
    LOC_CONDO,
    F.photos(),
    F.video(),
    { key: 'deed_copy', label: 'สำเนาโฉนด (หน้า–หลัง) / ใบ อ.ช.2', kind: 'media', required: true, note: 'เอกสารสิทธิ์ — จำเป็นต้องมี' },
  ],
};

const LAND: PropertyType = {
  key: 'land', label: 'ที่ดินเปล่า', icon: ICON_LAND,
  fields: [
    F.deal(),
    LOC_LAND,
    { key: 'land_size', label: 'ขนาดพื้นที่', kind: 'group', sub: [{ key: 'rai', label: 'ไร่', kind: 'number' }, { key: 'ngan', label: 'งาน', kind: 'number' }, { key: 'wa', label: 'ตารางวา', kind: 'number' }] },
    { key: 'zoning_color', label: 'ผังเมืองสีอะไร', kind: 'select', options: ['เขียว', 'เหลือง', 'ส้ม', 'น้ำตาล', 'แดง', 'ชมพู', 'ม่วง', 'อื่นๆ'], note: 'ดูได้จากกฎหมายผังเมือง / LandsMaps' },
    { key: 'land_use', label: 'ใช้ประโยชน์อะไรได้บ้าง', kind: 'text', note: 'ดูได้จากกฎหมายผังเมือง' },
    { key: 'far', label: 'FAR', kind: 'number', note: 'ดูได้จากกฎหมายผังเมือง' },
    { key: 'osr', label: 'OSR', kind: 'number', note: 'ดูได้จากกฎหมายผังเมือง' },
    { key: 'road_frontage', label: 'ติดถนนสาธารณะกี่ด้าน', kind: 'select', options: ['ไม่ติด', 'ติด 1 ด้าน', 'ติด 2 ด้าน', 'อื่นๆ'], note: 'ดูจากโฉนด / LandsMaps' },
    { key: 'road_width', label: 'ถนนสาธารณะที่ติดกว้างกี่เมตร', kind: 'number', unit: 'เมตร' },
    { key: 'utilities', label: 'มีไฟฟ้า / น้ำประปาผ่านแปลงไหม', kind: 'multiselect', options: ['มีไฟฟ้า', 'มีน้ำประปา'] },
    { key: 'nearby', label: 'ใกล้สถานที่สำคัญ (ระยะ กม.)', kind: 'group', sub: [{ key: 'hospital', label: 'โรงพยาบาล', kind: 'number', unit: 'กม.' }, { key: 'school', label: 'โรงเรียน', kind: 'number', unit: 'กม.' }, { key: 'market', label: 'ตลาดสด', kind: 'number', unit: 'กม.' }, { key: 'mall', label: 'ห้างสรรพสินค้า', kind: 'number', unit: 'กม.' }, { key: 'other', label: 'อื่นๆ', kind: 'text' }] },
    F.price(),
    F.transfer(),
    F.photos(),
    F.video(),
    { key: 'deed_copy', label: 'สำเนาโฉนดที่ดิน (หน้า–หลัง)', kind: 'media', required: true, note: 'เอกสารสิทธิ์ — จำเป็นต้องมี' },
  ],
};

/* existing industrial types — now schema-driven too */
const FACTORY: PropertyType = {
  key: 'factory', label: 'โรงงาน', icon: ICON_FACTORY,
  fields: [
    F.deal(),
    { key: 'usable_area', label: 'พื้นที่ใช้สอย', kind: 'number', unit: 'ตร.ม.', required: true, system: true },
    { key: 'land_area', label: 'ขนาดที่ดิน', kind: 'number', unit: 'ไร่-งาน-ตร.ว.' },
    { key: 'clear_height', label: 'ความสูงใต้อาคาร', kind: 'number', unit: 'ม.', system: true },
    { key: 'floor_loading', label: 'รับน้ำหนักพื้น', kind: 'number', unit: 'ตัน/ตร.ม.', system: true },
    { key: 'power_system', label: 'ระบบไฟฟ้า', kind: 'select', options: ['1 Phase', '3 Phase 50/150A', '3 Phase 200A+', 'อื่นๆ'] },
    { key: 'zoning_color', label: 'พื้นที่สี (ผังเมือง)', kind: 'select', options: ['เขตสีม่วง — อุตสาหกรรม', 'เขตสีม่วงอ่อน', 'เขตสีเม็ดมะปราง — คลังสินค้า', 'เขตสีน้ำตาล', 'อื่นๆ'] },
    { key: 'factory_license', label: 'ขอใบ ร.ง.4 ได้', kind: 'boolean' },
    { key: 'overhead_crane', label: 'มีเครนเหนือศีรษะ', kind: 'boolean' },
    F.price(),
    LOC_LAND,
    F.photos(),
    { key: 'deed_copy', label: 'เอกสารสิทธิ์ / โฉนด', kind: 'media' },
  ],
};

/* Urban-planning zone colours (พื้นที่สี ผังเมือง) */
const ZONE_COLORS = ['เขียว — ชนบท/เกษตรกรรม', 'เหลือง — ที่อยู่อาศัยหนาแน่นน้อย', 'ส้ม — ที่อยู่อาศัยหนาแน่นปานกลาง', 'น้ำตาล — ที่อยู่อาศัยหนาแน่นมาก', 'แดง — พาณิชยกรรม', 'ม่วง — อุตสาหกรรม', 'เม็ดมะปราง — คลังสินค้า', 'ขาว-เขียว — อนุรักษ์ชนบท', 'อื่นๆ'];

/* โกดัง / คลังสินค้า — full detail set ported from the ops import form
   (AppSheet "WUT Demo"), grouped into sections matching that layout. */
/** ผู้รับผิดชอบ + จำนวนเงิน — ใช้กับภาษี/ค่าธรรมเนียมที่ระบุว่าใครจ่าย */
const payerAmount = (payers: string[]) => ([
  { key: 'payer', label: 'ผู้รับผิดชอบ', kind: 'select' as FieldKind, options: payers },
  { key: 'amount', label: 'จำนวนเงิน', kind: 'number' as FieldKind, unit: 'บาท' },
]);
const WHEN_RENT: ShowWhen = { field: 'deal_type', in: ['เช่า', 'เช่า / ขาย'] };
const WHEN_SALE: ShowWhen = { field: 'deal_type', in: ['ขาย', 'เช่า / ขาย'] };

/* ชุดฟิลด์ที่ใช้ร่วมกันระหว่าง "โกดัง / คลังสินค้า" และ "โชว์รูมและเชิงพาณิชย์"
   เรียง section ตามลำดับที่ทีมงานกำหนด (1→9) แล้วปิดท้ายด้วยข้อความสรุปอัตโนมัติ */
const WAREHOUSE_FIELDS: FieldDef[] = [
  // 1 · ประเภทและทำเล (รวมตำแหน่งบนแผนที่เข้ามาด้วย)
  { key: 'deal_type', label: 'ประเภทประกาศ', kind: 'dealtype', options: ['เช่า', 'ขาย', 'เช่า / ขาย'], required: true, section: 'ประเภทและทำเล' },
  { key: 'listing_date', label: 'วันที่ลงประกาศ', kind: 'date', required: true, section: 'ประเภทและทำเล' },
  { key: 'subdistrict', label: 'แขวง / ตำบล', kind: 'text', required: true, section: 'ประเภทและทำเล' },
  { key: 'district', label: 'เขต / อำเภอ', kind: 'text', required: true, section: 'ประเภทและทำเล' },
  { key: 'province', label: 'จังหวัด', kind: 'text', required: true, section: 'ประเภทและทำเล' },
  { key: 'zoning_color', label: 'พื้นที่สี (ผังเมือง)', kind: 'select', options: ZONE_COLORS, required: true, section: 'ประเภทและทำเล' },
  { key: 'zone', label: 'โซน', kind: 'text', section: 'ประเภทและทำเล', placeholder: 'เช่น โซน A / ฝั่งตะวันออก' },
  { key: 'nearby', label: 'อยู่ใกล้ (สถานที่สำคัญ)', kind: 'text', section: 'ประเภทและทำเล', placeholder: 'เช่น ลาดพร้าว 101, โชคชัย 4' },
  { key: 'location_map', label: 'ตำแหน่งบนแผนที่', kind: 'map', section: 'ประเภทและทำเล' },

  // 2 · ผู้ให้เช่า
  { key: 'lessor_status', label: 'สถานะผู้ให้เช่า', kind: 'select', options: ['บริษัท', 'บุคคลธรรมดา', 'นายหน้า', 'เจ้าของเอง'], section: 'ผู้ให้เช่า' },
  { key: 'lessor_company', label: 'ชื่อบริษัทผู้ให้เช่า', kind: 'text', section: 'ผู้ให้เช่า' },
  { key: 'lessor_name', label: 'ชื่อผู้ให้เช่า', kind: 'text', required: true, section: 'ผู้ให้เช่า' },
  { key: 'lessor_phone', label: 'เบอร์โทรติดต่อ', kind: 'text', required: true, section: 'ผู้ให้เช่า', placeholder: '08x-xxx-xxxx' },

  // 3 · พื้นที่
  { key: 'land_wh', label: 'กว้าง x ลึก ที่ดิน', kind: 'text', unit: 'ม.', section: 'พื้นที่', placeholder: 'เช่น 20 x 40' },
  { key: 'land_area_total', label: 'ที่ดินรวม', kind: 'group', section: 'พื้นที่', sub: [
    { key: 'rai', label: 'ไร่', kind: 'number' }, { key: 'ngan', label: 'งาน', kind: 'number' }, { key: 'wa', label: 'ตร.ว.', kind: 'number' },
  ] },
  { key: 'building_area', label: 'พื้นที่คลัง / ผลิต', kind: 'number', unit: 'ตร.ม.', section: 'พื้นที่' },
  { key: 'building_wh', label: 'กว้าง x ลึก พื้นที่คลัง / ผลิต', kind: 'text', unit: 'ม.', section: 'พื้นที่', placeholder: 'เช่น 14 x 20' },
  { key: 'office_floors', label: 'จำนวนชั้นออฟฟิศ', kind: 'select', options: ['ไม่มีออฟฟิศ', '1 ชั้น', '2 ชั้น', '3 ชั้น', 'มากกว่า 3 ชั้น'], section: 'พื้นที่' },
  { key: 'building_floors', label: 'จำนวนชั้นอาคาร', kind: 'select', options: ['1 ชั้น', '2 ชั้น', '3 ชั้น', '4 ชั้น', 'มากกว่า 4 ชั้น'], section: 'พื้นที่' },
  { key: 'office_area_f1', label: 'พื้นที่ออฟฟิศ ชั้น 1', kind: 'number', unit: 'ตร.ม.', section: 'พื้นที่' },
  { key: 'building_total_wh', label: 'กว้าง x ลึก พื้นที่อาคารรวม', kind: 'text', unit: 'ม.', section: 'พื้นที่', placeholder: 'เช่น 20 x 40' },
  { key: 'office_area_total', label: 'พื้นที่ออฟฟิศรวม', kind: 'number', unit: 'ตร.ม.', section: 'พื้นที่' },
  { key: 'building_area_total', label: 'พื้นที่อาคารรวม', kind: 'number', unit: 'ตร.ม.', section: 'พื้นที่' },

  // 4 · สเปคอาคาร
  { key: 'doors', label: 'จำนวนประตู', kind: 'number', unit: 'ประตู', section: 'สเปคอาคาร' },
  { key: 'door_wh', label: 'ประตู กว้าง x สูง', kind: 'text', unit: 'ม.', section: 'สเปคอาคาร', placeholder: 'เช่น 5 x 5' },
  { key: 'building_height', label: 'ความสูงอาคาร', kind: 'number', unit: 'ม.', section: 'สเปคอาคาร' },
  { key: 'parking', label: 'จำนวนที่จอดรถ', kind: 'number', unit: 'คัน', section: 'สเปคอาคาร' },
  { key: 'power_phase', label: 'ระบบไฟ (เฟส)', kind: 'select', options: ['1 เฟส', '3 เฟส'], section: 'สเปคอาคาร' },
  { key: 'power_system', label: 'ระบบไฟฟ้า (รายละเอียด)', kind: 'text', section: 'สเปคอาคาร', placeholder: 'เช่น 3 Phase 30/100 amp (Upgradeable)' },
  { key: 'floor_loading', label: 'น้ำหนักที่พื้นรับได้', kind: 'text', section: 'สเปคอาคาร', placeholder: 'เช่น 3 ตัน/ตร.ม.' },
  { key: 'cold_storage', label: 'ห้องเย็น / ควบคุมอุณหภูมิ', kind: 'boolean', section: 'สเปคอาคาร' },

  // 5 · ราคาและค่าใช้จ่าย — ภาษี/ค่าธรรมเนียมโผล่ตาม "ประเภทประกาศ"
  { key: 'price_rent', label: 'ราคาเช่า / เดือน', kind: 'price', unit: 'บาท/เดือน', section: 'ราคาและค่าใช้จ่าย', showWhen: WHEN_RENT },
  { key: 'price_per_sqm', label: 'ราคา / ตร.ม.', kind: 'number', unit: 'บาท/ตร.ม.', section: 'ราคาและค่าใช้จ่าย' },
  { key: 'price_sale', label: 'ราคาขาย', kind: 'price', unit: 'บาท', section: 'ราคาและค่าใช้จ่าย', showWhen: WHEN_SALE },
  { key: 'land_tax', label: 'ภาษีที่ดิน', kind: 'group', section: 'ราคาและค่าใช้จ่าย', showWhen: WHEN_RENT, sub: payerAmount(['เจ้าของ', 'ผู้เช่า']) },
  { key: 'withholding_tax', label: 'หัก ณ ที่จ่าย', kind: 'group', section: 'ราคาและค่าใช้จ่าย', showWhen: WHEN_RENT, sub: payerAmount(['เจ้าของ', 'ผู้เช่า']) },
  { key: 'vat', label: 'VAT', kind: 'select', options: ['รวม', 'ไม่รวม'], section: 'ราคาและค่าใช้จ่าย', showWhen: WHEN_RENT },
  { key: 'stamp_duty', label: 'อากรแสตมป์', kind: 'group', section: 'ราคาและค่าใช้จ่าย', note: 'เก็บทั้งกรณีเช่าและกรณีขาย', sub: payerAmount(['เจ้าของ', 'ผู้เช่า']) },
  { key: 'transfer_fee_resp', label: 'ค่าใช้จ่ายวันโอนกรรมสิทธิ์', kind: 'select', options: ['ผู้ขาย รับผิดชอบ 100%', 'ผู้ขายและผู้ซื้อ รับผิดชอบ 50/50', 'ผู้ซื้อ รับผิดชอบ 100%'], section: 'ราคาและค่าใช้จ่าย', showWhen: WHEN_SALE },
  { key: 'common_fee', label: 'ค่าส่วนกลาง', kind: 'number', unit: 'บาท/เดือน', section: 'ราคาและค่าใช้จ่าย' },
  { key: 'elec_rate', label: 'ค่าไฟ', kind: 'number', unit: 'บาท/หน่วย', section: 'ราคาและค่าใช้จ่าย' },
  { key: 'water_rate', label: 'ค่าน้ำ', kind: 'number', unit: 'บาท/หน่วย', section: 'ราคาและค่าใช้จ่าย' },

  // 6 · เงื่อนไขสัญญา
  { key: 'lease_term', label: 'อายุสัญญาเช่า', kind: 'select', options: ['1 ปี', '2 ปี', '3 ปี', '5 ปี', 'อื่นๆ'], section: 'เงื่อนไขสัญญา' },
  { key: 'deposit_months', label: 'เงินประกัน / ค่ามัดจำ', kind: 'select', options: ['1 เดือน', '2 เดือน', '3 เดือน', '6 เดือน'], section: 'เงื่อนไขสัญญา' },
  { key: 'advance_months', label: 'ค่าเช่าล่วงหน้า', kind: 'select', options: ['1 เดือน', '2 เดือน', '3 เดือน'], section: 'เงื่อนไขสัญญา' },

  // 7 · คุณสมบัติและการใช้งาน
  { key: 'features', label: 'คุณสมบัติ', kind: 'multiselect', options: ['พื้นที่สูงโปร่ง', 'มีพื้นที่สำนักงาน', 'รถบรรทุกเข้าถึงได้', 'พื้นเทคอนกรีต', 'ใกล้ถนนหลัก', 'มีลานจอด / ลานเทรลเลอร์', 'อาคารเดี่ยว', 'ยกพื้นเทียบตู้ (Dock leveler)'], section: 'คุณสมบัติและการใช้งาน' },
  { key: 'usage', label: 'การใช้งานที่เหมาะ', kind: 'multiselect', options: ['โกดัง', 'สตูดิโอ', 'โรงงาน', 'ศูนย์กระจายสินค้า', 'ครัวกลาง', 'โปรดักชั่น', 'ห้องเก็บของ', 'E-Commerce'], section: 'คุณสมบัติและการใช้งาน' },

  // 8 · หมายเหตุ
  { key: 'internal_note', label: 'หมายเหตุ', kind: 'textarea', section: 'หมายเหตุ' },

  // 9 · ข้อมูลทั่วไป (วันที่ลงประกาศ ย้ายไปอยู่กับประเภทประกาศแล้ว)
  { key: 'photos', label: 'รูปทรัพย์', kind: 'media', section: 'ข้อมูลทั่วไป', note: 'รูปแรก = ปก (แสดงบนหน้าแรก) · สูงสุด 10 รูป' },

  // 10 · ข้อความสรุปอัตโนมัติ (อ่านอย่างเดียว + ปุ่มคัดลอก)
  { key: 'summary_template', label: 'ข้อความสำหรับโพสต์ / ส่งลูกค้า', kind: 'summary', section: 'หมายเหตุ : รายละเอียดทรัพย์ (รวม)', note: 'ประกอบจากทุกฟิลด์ที่กรอกไว้ด้านบน — อัปเดตอัตโนมัติ' },
];

const WAREHOUSE: PropertyType = { key: 'warehouse', label: 'โกดัง / คลังสินค้า', icon: ICON_WAREHOUSE, fields: WAREHOUSE_FIELDS };

/* ใช้ชุดฟิลด์เดียวกับโกดังทั้งหมด (คนละ typeKey จึงตั้งค่า Field Builder แยกกันได้) */
const SHOWROOM: PropertyType = { key: 'showroom', label: 'โชว์รูมและเชิงพาณิชย์', icon: ICON_SHOWROOM, fields: WAREHOUSE_FIELDS };

export const PROPERTY_TYPES: PropertyType[] = [HOUSE, CONDO, LAND, FACTORY, WAREHOUSE, SHOWROOM];
export const propertyType = (key: string): PropertyType => PROPERTY_TYPES.find((t) => t.key === key) || PROPERTY_TYPES[0];

/* ============================================================
   Requirement intake — the CURATED essential subset collected on
   the public contact form (a buyer/renter states what they want).
   Deliberately short per type; the full listing schema above is for
   the admin cataloguing a real property, not for a lead's wishlist.
   ============================================================ */
const DEAL_INTENT: FieldDef = { key: 'deal_intent', label: 'ความต้องการ', kind: 'dealtype', options: ['เช่า', 'ซื้อ'], required: true };
const REQ_LOCATION: FieldDef = { key: 'location', label: 'ทำเล / จังหวัดที่สนใจ', kind: 'text', placeholder: 'เช่น บางนา, สมุทรปราการ' };
const REQ_BUDGET: FieldDef = { key: 'budget', label: 'งบประมาณ', kind: 'text', placeholder: 'เช่น 5–8 ล้าน หรือ 150,000/เดือน' };

export const REQUIREMENT_FIELDS: Record<string, FieldDef[]> = {
  house: [
    DEAL_INTENT,
    { key: 'bedrooms', label: 'จำนวนห้องนอน', kind: 'select', options: ['1–2 ห้อง', '3 ห้อง', '4 ห้องขึ้นไป'] },
    REQ_LOCATION,
    REQ_BUDGET,
  ],
  condo: [
    DEAL_INTENT,
    { key: 'room_type', label: 'ประเภทห้อง', kind: 'select', options: ['Studio', '1 ห้องนอน', '2 ห้องนอนขึ้นไป'] },
    { key: 'location', label: 'ทำเล / ย่านที่สนใจ', kind: 'text', placeholder: 'เช่น อโศก, ห้วยขวาง' },
    REQ_BUDGET,
  ],
  land: [
    DEAL_INTENT,
    { key: 'land_size', label: 'ขนาดที่ดินที่ต้องการ', kind: 'text', placeholder: 'เช่น 1–2 ไร่' },
    { key: 'zoning_color', label: 'ผังเมืองสี (ถ้ามีข้อกำหนด)', kind: 'select', options: ['ไม่ระบุ', 'เขียว', 'เหลือง', 'ส้ม', 'แดง', 'ม่วง', 'เม็ดมะปราง'] },
    REQ_LOCATION,
    REQ_BUDGET,
  ],
  factory: [
    DEAL_INTENT,
    { key: 'usable_area', label: 'พื้นที่ใช้สอยที่ต้องการ', kind: 'number', unit: 'ตร.ม.' },
    { key: 'power', label: 'ระบบไฟที่ต้องการ', kind: 'select', options: ['ไม่ระบุ', '1 เฟส', '3 เฟส'] },
    { key: 'rg4', label: 'ต้องขอใบ ร.ง.4', kind: 'boolean' },
    { key: 'location', label: 'ทำเล / นิคม / จังหวัด', kind: 'text', placeholder: 'เช่น นิคมบางปู, ชลบุรี' },
    { key: 'budget', label: 'งบประมาณ (เช่า/ซื้อ)', kind: 'text', placeholder: 'เช่น 200,000/เดือน หรือ 40 ล้าน' },
  ],
  warehouse: [
    DEAL_INTENT,
    { key: 'usable_area', label: 'พื้นที่ใช้สอยที่ต้องการ', kind: 'number', unit: 'ตร.ม.' },
    { key: 'location', label: 'ทำเล / จังหวัดที่สนใจ', kind: 'text', placeholder: 'เช่น บางนา, สมุทรปราการ' },
    { key: 'budget', label: 'งบประมาณ (เช่า/ซื้อ)', kind: 'text', placeholder: 'เช่น 150,000/เดือน' },
  ],
};
export const requirementFields = (typeKey: string): FieldDef[] => REQUIREMENT_FIELDS[typeKey] || REQUIREMENT_FIELDS.warehouse;

/* ============================================================
   Property-type enablement — an agency turns off the types it doesn't
   handle (e.g. only warehouse + factory). Persisted to localStorage and
   read by BOTH the front-end requirement form and the back-end create/
   edit forms + Field Builder, so front and back stay in sync.
   ============================================================ */
export type TypeConfig = { disabled: string[] };
const TC_KEY = 'jkp.typeConfig.v1';

export function loadTypeConfig(): TypeConfig {
  if (typeof window === 'undefined') return { disabled: [] };
  try {
    const raw = window.localStorage.getItem(TC_KEY);
    const o = raw ? (JSON.parse(raw) as TypeConfig) : null;
    return o && Array.isArray(o.disabled) ? { disabled: o.disabled } : { disabled: [] };
  } catch {
    return { disabled: [] };
  }
}
export function saveTypeConfig(tc: TypeConfig) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(TC_KEY, JSON.stringify({ disabled: tc.disabled })); } catch { /* ignore */ }
}
/** Enabled property types (never empty — falls back to all if everything is off). */
export function enabledPropertyTypes(tc?: TypeConfig): PropertyType[] {
  const dis = new Set((tc || loadTypeConfig()).disabled);
  const list = PROPERTY_TYPES.filter((t) => !dis.has(t.key));
  return list.length ? list : PROPERTY_TYPES;
}
export function isTypeEnabled(key: string, tc?: TypeConfig): boolean {
  return enabledPropertyTypes(tc).some((t) => t.key === key);
}

/* ============================================================
   Store — per-type overrides persisted in localStorage.
   Shape: { [typeKey]: { disabled: string[]; order: string[]; extra: FieldDef[] } }
   ============================================================ */
export type SchemaOverride = { disabled: string[]; order: string[]; extra: FieldDef[] };
const LS_KEY = 'jkp.fieldSchema.v1';

function readAll(): Record<string, SchemaOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SchemaOverride>) : {};
  } catch {
    return {};
  }
}
export function loadOverride(typeKey: string): SchemaOverride {
  return readAll()[typeKey] || { disabled: [], order: [], extra: [] };
}
export function saveOverride(typeKey: string, ov: SchemaOverride) {
  if (typeof window === 'undefined') return;
  const all = readAll();
  all[typeKey] = ov;
  window.localStorage.setItem(LS_KEY, JSON.stringify(all));
}

/** Resolve the effective, ordered field list for a type given its saved override. */
export function resolveFields(typeKey: string, ov?: SchemaOverride): (FieldDef & { enabled: boolean })[] {
  const t = propertyType(typeKey);
  const o = ov || loadOverride(typeKey);
  const all = [...t.fields, ...(o.extra || [])];
  const byKey = new Map(all.map((f) => [f.key, f]));
  // apply saved order first, then any remaining in original order
  const ordered: FieldDef[] = [];
  (o.order || []).forEach((k) => { const f = byKey.get(k); if (f) { ordered.push(f); byKey.delete(k); } });
  all.forEach((f) => { if (byKey.has(f.key)) { ordered.push(f); byKey.delete(f.key); } });
  const disabled = new Set(o.disabled || []);
  return ordered.map((f) => ({ ...f, enabled: f.required ? true : !disabled.has(f.key) }));
}
