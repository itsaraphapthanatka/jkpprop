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

  /* search-filter option values shown on the hero and the listing sidebar.
     The Thai string is the key here too, so a filter and a stored value that
     read the same in Thai also read the same in English and Chinese. */
  'คลังสินค้า': { en: 'Warehouse', zh: '仓库' },
  'โกดัง/คลังสินค้า ': { en: 'Warehouse', zh: '仓库' },

  '500 ตร.ม.': { en: '500 sqm', zh: '500 平方米' },
  '1,000 ตร.ม.': { en: '1,000 sqm', zh: '1,000 平方米' },
  '2,000 ตร.ม.': { en: '2,000 sqm', zh: '2,000 平方米' },
  '3,000 ตร.ม.': { en: '3,000 sqm', zh: '3,000 平方米' },
  '5,000 ตร.ม.': { en: '5,000 sqm', zh: '5,000 平方米' },
  '10,000 ตร.ม.+': { en: '10,000 sqm+', zh: '10,000 平方米以上' },
  'ต่ำกว่า 1,000 ตร.ม.': { en: 'Under 1,000 sqm', zh: '1,000 平方米以下' },
  '1,000–3,000 ตร.ม.': { en: '1,000–3,000 sqm', zh: '1,000–3,000 平方米' },
  'สูงกว่า 3,000 ตร.ม.': { en: 'Over 3,000 sqm', zh: '3,000 平方米以上' },

  'ต่ำกว่า ฿50,000': { en: 'Under ฿50,000', zh: '฿50,000 以下' },
  '฿50,000–100,000': { en: '฿50,000–100,000', zh: '฿50,000–100,000' },
  '฿100,000–200,000': { en: '฿100,000–200,000', zh: '฿100,000–200,000' },
  '฿200,000–500,000': { en: '฿200,000–500,000', zh: '฿200,000–500,000' },
  'สูงกว่า ฿500,000': { en: 'Over ฿500,000', zh: '฿500,000 以上' },
  'ต่ำกว่า ฿100,000': { en: 'Under ฿100,000', zh: '฿100,000 以下' },
  '฿100,000–300,000': { en: '฿100,000–300,000', zh: '฿100,000–300,000' },
  'สูงกว่า ฿300,000': { en: 'Over ฿300,000', zh: '฿300,000 以上' },

  'ไม่ระบุต่ำสุด': { en: 'No minimum', zh: '不限' },

  /* hero feature checkboxes */
  'เครนเหนือศีรษะ': { en: 'Overhead crane', zh: '行车吊' },
  'บนถนนสายหลัก': { en: 'On a main road', zh: '临主干道' },
  'พนักงานรักษาความปลอดภัย': { en: 'On-site security', zh: '保安值守' },
  'พร้อมพื้นที่สำนักงาน': { en: 'Office space included', zh: '含办公区' },
  'พื้นที่ขนถ่ายสินค้าแบบยกพื้น': { en: 'Raised loading dock', zh: '高台装卸区' },
  'พื้นที่ขนถ่ายแบบยกพื้น': { en: 'Raised loading dock', zh: '高台装卸区' },
  'อาคารเดี่ยว': { en: 'Standalone building', zh: '独栋建筑' },
  'มีพื้นที่สำนักงานในตัว': { en: 'Built-in office space', zh: '自带办公区' },

  /* zone chips + the colour-zone legend */
  'เขตปลอดอากร': { en: 'Free Zone', zh: '自由区' },
  'นิคมอุตสาหกรรม': { en: 'Industrial estate', zh: '工业园区' },
  'เขตสีม่วง': { en: 'Purple zone', zh: '紫区' },
  'เขตสีม่วงอ่อน': { en: 'Light purple zone', zh: '浅紫区' },
  'เขตสีเม็ดมะปราง': { en: 'Plum zone', zh: '梅红区' },
  'เขตสีน้ำตาล': { en: 'Brown zone', zh: '棕区' },
  'เขตสีแดง': { en: 'Red zone', zh: '红区' },
  'เขตสีส้ม': { en: 'Orange zone', zh: '橙区' },
  'เขตสีเหลือง': { en: 'Yellow zone', zh: '黄区' },
  'เขตสีเขียว': { en: 'Green zone', zh: '绿区' },
  'เขตสีน้ำเงิน': { en: 'Blue zone', zh: '蓝区' },
  'ที่ดินประเภทอุตสาหกรรม': { en: 'Industrial land', zh: '工业用地' },
  'พัฒนา/ส่งเสริมอุตสาหกรรม (EEC)': { en: 'Industrial development (EEC)', zh: '工业发展区 (EEC)' },
  'ที่ดินประเภทคลังสินค้า': { en: 'Warehousing land', zh: '仓储用地' },
  'ส่งเสริมเศรษฐกิจพิเศษ (EEC)': { en: 'Special economic promotion (EEC)', zh: '特别经济促进区 (EEC)' },
  'ที่ดินประเภทพาณิชยกรรม': { en: 'Commercial land', zh: '商业用地' },
  'ชุมชนเมือง / ที่อยู่อาศัยปานกลาง': { en: 'Urban / medium-density residential', zh: '城市 / 中密度住宅' },
  'ที่อยู่อาศัยหนาแน่นน้อย': { en: 'Low-density residential', zh: '低密度住宅' },
  'ชนบทและเกษตรกรรม': { en: 'Rural and agricultural', zh: '乡村与农业' },
  'สถาบันราชการ / สาธารณูปโภค': { en: 'Government / public utilities', zh: '政府机构 / 公共设施' },

  /* location finder — factors, landmarks and provinces */
  'ใกล้สนามบิน': { en: 'Near an airport', zh: '靠近机场' },
  'ใกล้ท่าเรือ': { en: 'Near a port', zh: '靠近港口' },
  'ใกล้กรุงเทพฯ': { en: 'Near Bangkok', zh: '靠近曼谷' },
  'ระเบียงเศรษฐกิจภาคตะวันออก (EEC)': { en: 'Eastern Economic Corridor (EEC)', zh: '东部经济走廊 (EEC)' },
  'ขนส่งทางอากาศและด่วน': { en: 'Air freight and express', zh: '空运与快递' },
  'ศูนย์กลางนำเข้า / ส่งออก': { en: 'Import / export hub', zh: '进出口枢纽' },
  'เข้าเมืองสะดวก โลจิสติกส์เมือง': { en: 'Easy city access, urban logistics', zh: '进城便利，城市物流' },
  'หัวใจอุตสาหกรรม EEC': { en: 'Heart of the EEC industrial belt', zh: 'EEC 工业核心区' },
  'ดอนเมือง': { en: 'Don Mueang', zh: '廊曼' },
  'สุวรรณภูมิ': { en: 'Suvarnabhumi', zh: '素万那普' },
  'CBD กรุงเทพฯ': { en: 'Bangkok CBD', zh: '曼谷中央商务区' },
  'ท่าเรือมหาชัย': { en: 'Mahachai Port', zh: '马哈猜港' },
  'ท่าเรือแหลมฉบัง': { en: 'Laem Chabang Port', zh: '林查班港' },
  'ท่าเรือมาบตาพุด': { en: 'Map Ta Phut Port', zh: '马达普港' },
  'เลือกสนามบิน': { en: 'Choose an airport', zh: '选择机场' },
  'เลือกท่าเรือ': { en: 'Choose a port', zh: '选择港口' },
  'เลือกพื้นที่ในกรุงเทพฯ': { en: 'Choose an area in Bangkok', zh: '选择曼谷区域' },
  'เลือกพื้นที่ใน EEC': { en: 'Choose an area in the EEC', zh: '选择 EEC 区域' },
  'เลือกสนามบินที่ต้องการดูทรัพย์ใกล้เคียง': { en: 'Pick an airport to see nearby properties', zh: '选择机场查看周边房源' },
  'เลือกท่าเรือที่ต้องการดูทรัพย์ใกล้เคียง': { en: 'Pick a port to see nearby properties', zh: '选择港口查看周边房源' },
  'เลือกพื้นที่ที่ต้องการดูทรัพย์ใกล้เคียง': { en: 'Pick an area to see nearby properties', zh: '选择区域查看周边房源' },
  'เลือกพื้นที่ในเขต EEC ที่ต้องการดูทรัพย์ใกล้เคียง': { en: 'Pick an EEC area to see nearby properties', zh: '选择 EEC 区域查看周边房源' },
  'ในเขต': { en: 'within the zone', zh: '区域内' },
  'กรุงเทพฯ': { en: 'Bangkok', zh: '曼谷' },
  'กรุงเทพมหานคร': { en: 'Bangkok', zh: '曼谷' },
  'นนทบุรี': { en: 'Nonthaburi', zh: '暖武里' },
  'ชลบุรี': { en: 'Chonburi', zh: '春武里' },
  'ระยอง': { en: 'Rayong', zh: '罗勇' },
  'ฉะเชิงเทรา': { en: 'Chachoengsao', zh: '北柳' },
  'สมุทรปราการ': { en: 'Samut Prakan', zh: '北榄' },
  'สมุทรสาคร': { en: 'Samut Sakhon', zh: '龙仔厝' },
  'พระนครศรีอยุธยา': { en: 'Ayutthaya', zh: '大城' },

  'สนามบิน': { en: 'Airport', zh: '机场' },
  'ท่าเรือ': { en: 'Port', zh: '港口' },
  'ใจกลางกรุงเทพฯ': { en: 'Central Bangkok', zh: '曼谷市中心' },
  '8 กม.': { en: '8 km', zh: '8 公里' },
  '12 กม.': { en: '12 km', zh: '12 公里' },
  '15 กม.': { en: '15 km', zh: '15 公里' },

  /* SEO/area page breadcrumbs */
  'โรงงานให้เช่า': { en: 'Factories for rent', zh: '工厂出租' },
  'โรงงานสำหรับขาย': { en: 'Factories for sale', zh: '工厂出售' },
  'โกดังสำหรับเช่า': { en: 'Warehouses for rent', zh: '仓库出租' },
  'โกดังสำหรับขาย': { en: 'Warehouses for sale', zh: '仓库出售' },
  'สนามบินดอนเมือง': { en: 'Don Mueang Airport', zh: '廊曼机场' },
  'สนามบินสุวรรณภูมิ': { en: 'Suvarnabhumi Airport', zh: '素万那普机场' },

  /* requirement-form field labels (lib/propertySchema) */
  'ประเภททรัพย์ที่ต้องการ': { en: 'Property type', zh: '房源类型' },
  'ประเภททรัพย์': { en: 'Property type', zh: '房源类型' },
  'ความต้องการ': { en: 'Looking to', zh: '需求类型' },
  'จังหวัดที่สนใจ': { en: 'Province of interest', zh: '意向府' },
  'งบประมาณ': { en: 'Budget', zh: '预算' },
  'ทำเล': { en: 'Location', zh: '区位' },
  'พื้นที่ใช้สอยที่ต้องการ': { en: 'Floor area needed', zh: '所需使用面积' },
  'ขนาดที่ดินที่ต้องการ': { en: 'Land size needed', zh: '所需土地面积' },
  'จำนวนห้องนอน': { en: 'Bedrooms', zh: '卧室数量' },
  'ประเภทห้อง': { en: 'Room type', zh: '房型' },
  'ระบบไฟ': { en: 'Power supply', zh: '供电' },
  'ต้องขอใบ ร.ง.4': { en: 'Needs a factory licence (Rg.4)', zh: '需要工厂许可证' },
  'ผังเมืองสีอะไร': { en: 'Zoning colour', zh: '城市规划分区' },

  /* misc option values that surface publicly */
  'อื่นๆ': { en: 'Other', zh: '其他' },
  'ไม่ระบุ': { en: 'Not specified', zh: '未指定' },
  '1 เฟส': { en: 'Single phase', zh: '单相电' },
  '3 เฟส': { en: 'Three phase', zh: '三相电' },

  /* ---- everything the 393 imported records actually store ----
     These were all falling through to Thai on the English and Chinese site:
     an English visitor read "3 ชั้น" for the number of floors and "ไม่ใช่"
     for cold storage. The list came from the stored values themselves, not
     from the schema's option lists, so it covers what is really on the site. */
  'ใช่': { en: 'Yes', zh: '有' },
  'ไม่ใช่': { en: 'No', zh: '无' },
  'ไม่มี': { en: 'None', zh: '无' },
  'ไม่มีออฟฟิศ': { en: 'No office', zh: '无办公室' },
  'มากกว่า 3 ชั้น': { en: 'More than 3 floors', zh: '3 层以上' },
  '1 ชั้น': { en: '1 floor', zh: '1 层' },
  '2 ชั้น': { en: '2 floors', zh: '2 层' },
  '3 ชั้น': { en: '3 floors', zh: '3 层' },
  '4 ชั้น': { en: '4 floors', zh: '4 层' },
  '1 เดือน': { en: '1 month', zh: '1 个月' },
  '2 เดือน': { en: '2 months', zh: '2 个月' },
  '3 เดือน': { en: '3 months', zh: '3 个月' },
  '4 เดือน': { en: '4 months', zh: '4 个月' },
  '6 เดือน': { en: '6 months', zh: '6 个月' },
  '1 ปี': { en: '1 year', zh: '1 年' },
  '1-3 ปี': { en: '1–3 years', zh: '1–3 年' },
  '3 ปี': { en: '3 years', zh: '3 年' },
  '5 ปี': { en: '5 years', zh: '5 年' },
  'ผู้ขายและผู้ซื้อ รับผิดชอบ 50/50': { en: 'Split 50/50 between buyer and seller', zh: '买卖双方各承担 50%' },

  /* features shown as chips on the property page */
  'มีพื้นที่สำนักงาน': { en: 'Office space', zh: '含办公区' },
  'มีที่จอดรถ': { en: 'Parking', zh: '有停车位' },
  'มีลานจอด / ลานเทรลเลอร์': { en: 'Trailer yard', zh: '拖车停放场' },
  'รถคอนเทนเนอร์เข้าได้': { en: 'Container truck access', zh: '集装箱车可进出' },
  'ยกพื้นเทียบตู้ (Dock leveler)': { en: 'Dock leveler', zh: '装卸平台' },
  'ใกล้ถนนหลัก': { en: 'Near a main road', zh: '靠近主干道' },
  'พื้นที่โครงการ': { en: 'Within an estate', zh: '园区内' },

  /* what the space is used for */
  'ผลิต': { en: 'Manufacturing', zh: '生产' },
  'โปรดักชั่น': { en: 'Production', zh: '制作' },
  'ครัวกลาง': { en: 'Central kitchen', zh: '中央厨房' },
  'ศูนย์กระจายสินค้า': { en: 'Distribution centre', zh: '配送中心' },
  'ห้องเก็บของ': { en: 'Storage', zh: '仓储' },
  'สตูดิโอ': { en: 'Studio', zh: '摄影棚' },
  'โชว์รูม': { en: 'Showroom', zh: '展厅' },

  'เขียวอ่อน — อนุรักษ์สิ่งแวดล้อม': { en: 'Light green — conservation', zh: '浅绿区 — 环境保护' },
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
