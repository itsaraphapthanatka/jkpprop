/* Thai place names for readers who cannot read Thai script.
 *
 * A property's province and district are stored as the team types them — Thai,
 * and rightly so: it is the address. But "ศรีราชา, ชลบุรี" on an English card
 * tells an English reader nothing, and a Chinese reader cannot even sound it
 * out. So the province is translated and the district romanised (RTGS).
 *
 * Two deliberate limits:
 *  - Chinese names exist only for the provinces that have an established one.
 *    Everything else falls back to the romanisation rather than to a name
 *    invented here — a made-up Chinese name for a Thai district is worse than
 *    a Latin one, because it cannot be matched against a map or a contract.
 *  - Districts are covered for the industrial belt this agency actually lists
 *    in. An unknown district stays exactly as stored.
 */
import { DEFAULT_LOCALE, type Locale } from './config';

/** every province, romanised (RTGS) */
const PROVINCE_EN: Record<string, string> = {
  กรุงเทพมหานคร: 'Bangkok', 'กรุงเทพฯ': 'Bangkok',
  กระบี่: 'Krabi', กาญจนบุรี: 'Kanchanaburi', กาฬสินธุ์: 'Kalasin', กำแพงเพชร: 'Kamphaeng Phet',
  ขอนแก่น: 'Khon Kaen', จันทบุรี: 'Chanthaburi', ฉะเชิงเทรา: 'Chachoengsao', ชลบุรี: 'Chonburi',
  ชัยนาท: 'Chai Nat', ชัยภูมิ: 'Chaiyaphum', ชุมพร: 'Chumphon', เชียงราย: 'Chiang Rai',
  เชียงใหม่: 'Chiang Mai', ตรัง: 'Trang', ตราด: 'Trat', ตาก: 'Tak', นครนายก: 'Nakhon Nayok',
  นครปฐม: 'Nakhon Pathom', นครพนม: 'Nakhon Phanom', นครราชสีมา: 'Nakhon Ratchasima',
  นครศรีธรรมราช: 'Nakhon Si Thammarat', นครสวรรค์: 'Nakhon Sawan', นนทบุรี: 'Nonthaburi',
  นราธิวาส: 'Narathiwat', น่าน: 'Nan', บึงกาฬ: 'Bueng Kan', บุรีรัมย์: 'Buriram',
  ปทุมธานี: 'Pathum Thani', ประจวบคีรีขันธ์: 'Prachuap Khiri Khan', ปราจีนบุรี: 'Prachinburi',
  ปัตตานี: 'Pattani', พระนครศรีอยุธยา: 'Ayutthaya', พะเยา: 'Phayao', พังงา: 'Phang Nga',
  พัทลุง: 'Phatthalung', พิจิตร: 'Phichit', พิษณุโลก: 'Phitsanulok', เพชรบุรี: 'Phetchaburi',
  เพชรบูรณ์: 'Phetchabun', แพร่: 'Phrae', ภูเก็ต: 'Phuket', มหาสารคาม: 'Maha Sarakham',
  มุกดาหาร: 'Mukdahan', แม่ฮ่องสอน: 'Mae Hong Son', ยโสธร: 'Yasothon', ยะลา: 'Yala',
  ร้อยเอ็ด: 'Roi Et', ระนอง: 'Ranong', ระยอง: 'Rayong', ราชบุรี: 'Ratchaburi', ลพบุรี: 'Lopburi',
  ลำปาง: 'Lampang', ลำพูน: 'Lamphun', เลย: 'Loei', ศรีสะเกษ: 'Sisaket', สกลนคร: 'Sakon Nakhon',
  สงขลา: 'Songkhla', สตูล: 'Satun', สมุทรปราการ: 'Samut Prakan', สมุทรสงคราม: 'Samut Songkhram',
  สมุทรสาคร: 'Samut Sakhon', สระแก้ว: 'Sa Kaeo', สระบุรี: 'Saraburi', สิงห์บุรี: 'Sing Buri',
  สุโขทัย: 'Sukhothai', สุพรรณบุรี: 'Suphan Buri', สุราษฎร์ธานี: 'Surat Thani', สุรินทร์: 'Surin',
  หนองคาย: 'Nong Khai', หนองบัวลำภู: 'Nong Bua Lamphu', อ่างทอง: 'Ang Thong',
  อำนาจเจริญ: 'Amnat Charoen', อุดรธานี: 'Udon Thani', อุตรดิตถ์: 'Uttaradit',
  อุทัยธานี: 'Uthai Thani', อุบลราชธานี: 'Ubon Ratchathani',
};

/** provinces with an established Chinese name — the rest use the romanisation */
const PROVINCE_ZH: Record<string, string> = {
  กรุงเทพมหานคร: '曼谷', 'กรุงเทพฯ': '曼谷',
  ชลบุรี: '春武里', ระยอง: '罗勇', ฉะเชิงเทรา: '北柳', สมุทรปราการ: '北榄', สมุทรสาคร: '龙仔厝',
  พระนครศรีอยุธยา: '大城', นนทบุรี: '暖武里', ปทุมธานี: '巴吞他尼', นครปฐม: '佛统',
  ปราจีนบุรี: '巴真', สระบุรี: '北标', ราชบุรี: '叻丕', กาญจนบุรี: '北碧', เพชรบุรี: '碧武里',
  จันทบุรี: '尖竹汶', ตราด: '桐艾', ประจวบคีรีขันธ์: '巴蜀', เชียงใหม่: '清迈', เชียงราย: '清莱',
  ภูเก็ต: '普吉', สงขลา: '宋卡', สุราษฎร์ธานี: '素叻他尼', นครราชสีมา: '呵叻', ขอนแก่น: '孔敬',
  อุดรธานี: '乌隆', อุบลราชธานี: '乌汶', ลพบุรี: '华富里', นครสวรรค์: '北榄坡', พิษณุโลก: '彭世洛',
  สุพรรณบุรี: '素攀', อ่างทอง: '红统', สิงห์บุรี: '信武里', นครนายก: '那空那育', สระแก้ว: '沙缴',
};

/* Districts of the industrial belt — Bangkok's factory districts, the EEC and
   the provinces around them. Anything not here keeps its Thai name. */
const DISTRICT_EN: Record<string, string> = {
  // Bangkok
  บางนา: 'Bangna', ลาดกระบัง: 'Lat Krabang', ประเวศ: 'Prawet', บางขุนเทียน: 'Bang Khun Thian',
  หนองแขม: 'Nong Khaem', มีนบุรี: 'Min Buri', คลองสามวา: 'Khlong Sam Wa', บางบอน: 'Bang Bon',
  จตุจักร: 'Chatuchak', พระโขนง: 'Phra Khanong', สวนหลวง: 'Suan Luang', ราษฎร์บูรณะ: 'Rat Burana',
  ทุ่งครุ: 'Thung Khru', บางแค: 'Bang Khae', ตลิ่งชัน: 'Taling Chan',
  // Samut Prakan
  บางพลี: 'Bang Phli', บางบ่อ: 'Bang Bo', บางเสาธง: 'Bang Sao Thong', พระประแดง: 'Phra Pradaeng',
  พระสมุทรเจดีย์: 'Phra Samut Chedi', เมืองสมุทรปราการ: 'Mueang Samut Prakan',
  // Chonburi
  ศรีราชา: 'Si Racha', บางละมุง: 'Bang Lamung', พานทอง: 'Phan Thong', พนัสนิคม: 'Phanat Nikhom',
  สัตหีบ: 'Sattahip', บ้านบึง: 'Ban Bueng', เมืองชลบุรี: 'Mueang Chonburi', หนองใหญ่: 'Nong Yai',
  // Rayong
  ปลวกแดง: 'Pluak Daeng', นิคมพัฒนา: 'Nikhom Phatthana', บ้านค่าย: 'Ban Khai',
  เมืองระยอง: 'Mueang Rayong', แกลง: 'Klaeng', บ้านฉาง: 'Ban Chang',
  // Chachoengsao
  บางปะกง: 'Bang Pakong', แปลงยาว: 'Plaeng Yao', บ้านโพธิ์: 'Ban Pho',
  เมืองฉะเชิงเทรา: 'Mueang Chachoengsao',
  // Samut Sakhon
  เมืองสมุทรสาคร: 'Mueang Samut Sakhon', กระทุ่มแบน: 'Krathum Baen', บ้านแพ้ว: 'Ban Phaeo',
  // Ayutthaya
  วังน้อย: 'Wang Noi', บางปะอิน: 'Bang Pa-in', อุทัย: 'Uthai', นครหลวง: 'Nakhon Luang',
  // Pathum Thani
  คลองหลวง: 'Khlong Luang', ลำลูกกา: 'Lam Luk Ka', ธัญบุรี: 'Thanyaburi',
  เมืองปทุมธานี: 'Mueang Pathum Thani', สามโคก: 'Sam Khok', ลาดหลุมแก้ว: 'Lat Lum Kaeo',
  // Saraburi / Prachinburi
  หนองแค: 'Nong Khae', แก่งคอย: 'Kaeng Khoi', ศรีมหาโพธิ: 'Si Maha Phot', กบินทร์บุรี: 'Kabin Buri',
};

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/* คนกรอกข้อมูลเขียนชื่อจังหวัดกันคนละแบบ และแผนที่ก็ใช้ชื่อทางการ:
   ข้อมูลจริงของทีมเขียน "กรุงเทพ" 256 รายการ ขณะที่ลิงก์จากแผนที่ส่ง
   "กรุงเทพมหานคร" ไปกรอง — ไม่มีอะไรตรงกัน หน้ารายการจึงว่างเปล่า
   ทุกที่ที่เทียบชื่อจังหวัดต้องเทียบด้วยรูปนี้ */
const PROVINCE_ALIAS: Record<string, string> = {
  'กรุงเทพ': 'กรุงเทพมหานคร',
  'กรุงเทพฯ': 'กรุงเทพมหานคร',
  'กทม': 'กรุงเทพมหานคร',
  'กทม.': 'กรุงเทพมหานคร',
  'จังหวัดกรุงเทพมหานคร': 'กรุงเทพมหานคร',
  'พระนคร': 'กรุงเทพมหานคร',
  'อยุธยา': 'พระนครศรีอยุธยา',
  'โคราช': 'นครราชสีมา',
};

/** ชื่อจังหวัดในรูปเดียว ไม่ว่าจะพิมพ์มาแบบไหน */
export function canonicalProvince(name: unknown): string {
  const th = clean(name).replace(/^จังหวัด\s*/, '');
  return PROVINCE_ALIAS[th] ?? th;
}

/** ชื่อสองชื่อนี้หมายถึงจังหวัดเดียวกันไหม */
export const sameProvince = (a: unknown, b: unknown): boolean => {
  const x = canonicalProvince(a), y = canonicalProvince(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
};

/** The province in the reader's language: Chinese name, romanisation, or Thai. */
export function provinceLabel(name: unknown, locale: Locale): string {
  const th = canonicalProvince(name);
  if (!th || locale === DEFAULT_LOCALE) return th;
  if (locale === 'zh') return PROVINCE_ZH[th] ?? PROVINCE_EN[th] ?? th;
  return PROVINCE_EN[th] ?? th;
}

/** The district, romanised where we know it. Chinese uses the same Latin form. */
export function districtLabel(name: unknown, locale: Locale): string {
  const th = clean(name);
  if (!th || locale === DEFAULT_LOCALE) return th;
  return DISTRICT_EN[th] ?? th;
}
