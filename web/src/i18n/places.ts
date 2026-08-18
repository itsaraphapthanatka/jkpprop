/* Thai place names for readers who cannot read Thai script.
 *
 * A property's province and district are stored as the team types them — Thai,
 * and rightly so: it is the address. But "ศรีราชา, ชลบุรี" on an English card
 * tells an English reader nothing, and a Chinese reader cannot even sound it
 * out. So the province is translated and the district romanised (RTGS).
 *
 * Coverage: every province, and every district and subdistrict this agency's
 * inventory actually uses, in English and Chinese. A place nobody has listed
 * in yet keeps its Thai name rather than being guessed at, and anything the
 * team spells differently can be overridden per-place in /admin/geography.
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

/** every province in Chinese: the established name where one is in use,
    a transliteration for the rest — the same rule the districts follow */
const PROVINCE_ZH: Record<string, string> = {
  กรุงเทพมหานคร: '曼谷', 'กรุงเทพฯ': '曼谷',
  ชลบุรี: '春武里', ระยอง: '罗勇', ฉะเชิงเทรา: '北柳', สมุทรปราการ: '北榄', สมุทรสาคร: '龙仔厝',
  พระนครศรีอยุธยา: '大城', นนทบุรี: '暖武里', ปทุมธานี: '巴吞他尼', นครปฐม: '佛统',
  ปราจีนบุรี: '巴真', สระบุรี: '北标', ราชบุรี: '叻丕', กาญจนบุรี: '北碧', เพชรบุรี: '碧武里',
  จันทบุรี: '尖竹汶', ตราด: '桐艾', ประจวบคีรีขันธ์: '巴蜀', เชียงใหม่: '清迈', เชียงราย: '清莱',
  ภูเก็ต: '普吉', สงขลา: '宋卡', สุราษฎร์ธานี: '素叻他尼', นครราชสีมา: '呵叻', ขอนแก่น: '孔敬',
  อุดรธานี: '乌隆', อุบลราชธานี: '乌汶', ลพบุรี: '华富里', นครสวรรค์: '北榄坡', พิษณุโลก: '彭世洛',
  สุพรรณบุรี: '素攀', อ่างทอง: '红统', สิงห์บุรี: '信武里', นครนายก: '那空那育', สระแก้ว: '沙缴',
  กระบี่: '甲米', กาฬสินธุ์: '加拉信', กำแพงเพชร: '甘烹碧', ชัยนาท: '猜纳', ชัยภูมิ: '猜也奔',
  ชุมพร: '春蓬', ตรัง: '董里', ตาก: '来兴', นครพนม: '那空拍侬', นครศรีธรรมราช: '洛坤',
  นราธิวาส: '陶公', 'น่าน': '难府', บึงกาฬ: '汶干', บุรีรัมย์: '武里南', ปัตตานี: '北大年',
  พะเยา: '帕尧', พังงา: '攀牙', พัทลุง: '博他仑', พิจิตร: '披集', เพชรบูรณ์: '碧差汶',
  'แพร่': '帕', มหาสารคาม: '玛哈沙拉堪', มุกดาหาร: '莫达汉', 'แม่ฮ่องสอน': '夜丰颂',
  ยโสธร: '益梭通', ยะลา: '惹拉', ร้อยเอ็ด: '黎逸', ระนอง: '拉廊', ลำปาง: '南邦', ลำพูน: '南奔',
  เลย: '黎府', ศรีสะเกษ: '四色菊', สกลนคร: '沙功那空', สตูล: '沙墩', สมุทรสงคราม: '夜功',
  สุโขทัย: '素可泰', สุรินทร์: '素林', หนองคาย: '廊开', หนองบัวลำภู: '农磨兰普',
  อำนาจเจริญ: '安纳乍能', อุตรดิตถ์: '程逸', อุทัยธานี: '乌泰他尼',
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
  /* The 393 imported records reach well past the factory belt this table was
     first written for — half of Bangkok appears in them. These are the rest of
     the districts that actually occur in the inventory. */
  บางกะปิ: 'Bang Kapi', คันนายาว: 'Khan Na Yao', สะพานสูง: 'Saphan Sung', บางเขน: 'Bang Khen',
  บึงกุ่ม: 'Bueng Kum', วังทองหลาง: 'Wang Thonglang', ห้วยขวาง: 'Huai Khwang', สายไหม: 'Sai Mai',
  หนองจอก: 'Nong Chok', ลาดพร้าว: 'Lat Phrao', บางซื่อ: 'Bang Sue', คลองเตย: 'Khlong Toei',
  ปทุมวัน: 'Pathum Wan', ดินแดง: 'Din Daeng', บางพลัด: 'Bang Phlat', ทวีวัฒนา: 'Thawi Watthana',
  วัฒนา: 'Watthana', ปากเกร็ด: 'Pak Kret',
};

/* Subdistricts (แขวง in Bangkok, ตำบล elsewhere). Same rule as districts:
   romanised where known, left in Thai otherwise. The stored value carries its
   own prefix and the spacing is not consistent — "แขวง คันนายาว" and
   "แขวงคันนายาว" are the same place — so the lookup strips both. */
const SUBDISTRICT_EN: Record<string, string> = {
  // Bangkok
  คลองกุ่ม: 'Khlong Kum', คลองจั่น: 'Khlong Chan', คลองเจ้าคุณสิงห์: 'Khlong Chaokhun Sing',
  คลองเตย: 'Khlong Toei', คลองสองต้นนุ่น: 'Khlong Song Ton Nun', คลองสามประเวศ: 'Khlong Sam Prawet',
  คันนายาว: 'Khan Na Yao', คู้ฝั่งเหนือ: 'Khu Fang Nuea', จระเข้บัว: 'Chorakhe Bua',
  จันทร์เกษม: 'Chan Kasem', ดอกไม้: 'Dokmai', ดินแดง: 'Din Daeng', ทรายกองดิน: 'Sai Kong Din',
  ทับช้าง: 'Thap Chang', ทับยาว: 'Thap Yao', ท่าแร้ง: 'Tha Raeng', นวมินทร์: 'Nawamin',
  นวลจันทร์: 'Nuan Chan', บางกะปิ: 'Bang Kapi', บางจาก: 'Bang Chak', บางชัน: 'Bang Chan',
  บางซื่อ: 'Bang Sue', บางนาใต้: 'Bang Na Tai', บางนาเหนือ: 'Bang Na Nuea', บางอ้อ: 'Bang O',
  ประเวศ: 'Prawet', พระโขนง: 'Phra Khanong', พลับพลา: 'Phlapphla', พัฒนาการ: 'Phatthanakan',
  มีนบุรี: 'Min Buri', รามอินทรา: 'Ram Inthra', ราษฎร์พัฒนา: 'Rat Phatthana',
  ลาดกระบัง: 'Lat Krabang', ลาดพร้าว: 'Lat Phrao', ลำผักชี: 'Lam Phak Chi',
  // the register spells this ลำปลาทิว; the imported sheet writes ลำประทิว
  ลำปลาทิว: 'Lam Pla Thio', ลำประทิว: 'Lam Prathio',
  วงศ์สว่าง: 'Wong Sawang', วังใหม่: 'Wang Mai', ศาลาธรรมสพน์: 'Sala Thammasop',
  สวนหลวง: 'Suan Luang', สามวาตะวันออก: 'Sam Wa Tawan Ok', สามเสนนอก: 'Sam Sen Nok',
  สายไหม: 'Sai Mai', แสนแสบ: 'Saen Saep', หนองบอน: 'Nong Bon', ห้วยขวาง: 'Huai Khwang',
  หัวหมาก: 'Hua Mak', อนุสาวรีย์: 'Anusawari', ออเงิน: 'O Ngoen',
  // Samut Prakan · Pathum Thani · Nonthaburi
  บางแก้ว: 'Bang Kaeo', บางโฉลง: 'Bang Chalong', บางปลา: 'Bang Pla', บางปูใหม่: 'Bang Pu Mai',
  บางพลีใหญ่: 'Bang Phli Yai', บางเพรียง: 'Bang Phriang', บางเสาธง: 'Bang Sao Thong',
  บ้านระกาศ: 'Ban Rakat', แพรกษาใหม่: 'Phraeksa Mai', ราชาเทวะ: 'Racha Thewa',
  เทพารักษ์: 'Theparak', สำโรง: 'Samrong', สำโรงใต้: 'Samrong Tai', สำโรงเหนือ: 'Samrong Nuea',
  คลองหนึ่ง: 'Khlong Nueng', ลาดสวาย: 'Lat Sawai', บ้านใหม่: 'Ban Mai',
  // the register spells this ศีรษะจรเข้ใหญ่; the sheet writes ศรีสาจรเข้ใหญ่
  ศีรษะจรเข้ใหญ่: 'Sisa Chorakhe Yai', ศรีสาจรเข้ใหญ่: 'Sisa Chorakhe Yai',
};


/* Chinese for districts and subdistricts.
 *
 * This file used to say Chinese existed for provinces only, on the grounds
 * that inventing a Chinese name for a Thai district is worse than leaving a
 * Latin one. That reasoning holds for a name pulled out of thin air; it does
 * not hold for transliteration, which is how Chinese has always written Thai
 * places and how Chinese-language media in Thailand write these exact
 * districts (拉甲挽 for ลาดกระบัง, 是拉差 for ศรีราชา, 惠康 for ห้วยขวาง).
 *
 * So: established renderings where the Thai-Chinese community has one,
 * consistent transliteration where it does not — and every one of them is
 * editable in /admin/geography, which is where a correction belongs. A
 * Chinese reader now gets an address they can say out loud to a taxi driver
 * instead of a Latin string in the middle of a Chinese sentence. */
const DISTRICT_ZH: Record<string, string> = {
  // Bangkok
  บางนา: '挽那', ลาดกระบัง: '拉甲挽', ประเวศ: '巴威', บางขุนเทียน: '挽坤天',
  หนองแขม: '廊仟', มีนบุรี: '民武里', คลองสามวา: '空三华', บางบอน: '挽汶',
  จตุจักร: '乍都乍', พระโขนง: '帕卡农', สวนหลวง: '素銮', ราษฎร์บูรณะ: '叻武拉那',
  ทุ่งครุ: '通克鲁', บางแค: '挽卡', ตลิ่งชัน: '汀清',
  บางกะปิ: '挽甲必', คันนายาว: '甘那尧', สะพานสูง: '沙潘颂', บางเขน: '挽鉴',
  บึงกุ่ม: '汶昆', วังทองหลาง: '旺通朗', ห้วยขวาง: '惠康', สายไหม: '塞迈',
  หนองจอก: '廊卓', ลาดพร้าว: '拉抛', บางซื่อ: '挽是', คลองเตย: '空堤',
  ปทุมวัน: '巴吞旺', ดินแดง: '汀丹', บางพลัด: '挽帕', ทวีวัฒนา: '他威瓦他那',
  วัฒนา: '瓦他那',
  // Samut Prakan
  บางพลี: '挽披', บางบ่อ: '挽波', บางเสาธง: '挽绍通', พระประแดง: '帕巴登',
  พระสมุทรเจดีย์: '帕沙木哲迪', เมืองสมุทรปราการ: '北榄市',
  // Chonburi
  ศรีราชา: '是拉差', บางละมุง: '挽拉蒙', พานทอง: '潘通', พนัสนิคม: '帕那尼空',
  สัตหีบ: '梭桃邑', บ้านบึง: '班汶', เมืองชลบุรี: '春武里市', หนองใหญ่: '廊亚',
  // Rayong
  ปลวกแดง: '巴楼丹', นิคมพัฒนา: '尼空帕他那', บ้านค่าย: '班盖',
  เมืองระยอง: '罗勇市', แกลง: '格朗', บ้านฉาง: '班昌',
  // Chachoengsao
  บางปะกง: '挽巴功', แปลงยาว: '平尧', บ้านโพธิ์: '班坡', เมืองฉะเชิงเทรา: '北柳市',
  // Samut Sakhon
  เมืองสมุทรสาคร: '龙仔厝市', กระทุ่มแบน: '甲统万', บ้านแพ้ว: '班沛',
  // Ayutthaya
  วังน้อย: '旺莱', บางปะอิน: '挽巴茵', อุทัย: '乌泰', นครหลวง: '那空銮',
  // Pathum Thani · Nonthaburi
  คลองหลวง: '空銮', ลำลูกกา: '兰卢卡', ธัญบุรี: '探武里',
  เมืองปทุมธานี: '巴吞他尼市', สามโคก: '三谷', ลาดหลุมแก้ว: '拉伦交',
  ปากเกร็ด: '巴革',
  // Saraburi / Prachinburi
  หนองแค: '廊卡', แก่งคอย: '甘蔻', ศรีมหาโพธิ: '西玛哈坡', กบินทร์บุรี: '甲民武里',
};

const SUBDISTRICT_ZH: Record<string, string> = {
  // Bangkok
  คลองกุ่ม: '空昆', คลองจั่น: '空展', คลองเจ้าคุณสิงห์: '空昭坤信',
  คลองเตย: '空堤', คลองสองต้นนุ่น: '空松吞嫩', คลองสามประเวศ: '空三巴威',
  คันนายาว: '甘那尧', คู้ฝั่งเหนือ: '库枫勒', จระเข้บัว: '乍拉客布阿',
  จันทร์เกษม: '占卡宋', ดอกไม้: '多迈', ดินแดง: '汀丹', ทรายกองดิน: '赛贡丁',
  ทับช้าง: '塔昌', ทับยาว: '塔尧', ท่าแร้ง: '塔亮', นวมินทร์: '那瓦明',
  นวลจันทร์: '暖占', บางกะปิ: '挽甲必', บางจาก: '挽乍', บางชัน: '挽产',
  บางซื่อ: '挽是', บางนาใต้: '南挽那', บางนาเหนือ: '北挽那', บางอ้อ: '挽奥',
  ประเวศ: '巴威', พระโขนง: '帕卡农', พลับพลา: '帕帕拉', พัฒนาการ: '帕他那干',
  มีนบุรี: '民武里', รามอินทรา: '拉玛因他拉', ราษฎร์พัฒนา: '叻帕他那',
  ลาดกระบัง: '拉甲挽', ลาดพร้าว: '拉抛', ลำผักชี: '兰帕奇',
  ลำปลาทิว: '兰帕拉提奥', ลำประทิว: '兰巴提奥',
  วงศ์สว่าง: '翁沙旺', วังใหม่: '旺迈', ศาลาธรรมสพน์: '沙拉探玛索',
  สวนหลวง: '素銮', สามวาตะวันออก: '东三华', สามเสนนอก: '外三盛',
  สายไหม: '塞迈', แสนแสบ: '盛撒', หนองบอน: '廊崩', ห้วยขวาง: '惠康',
  หัวหมาก: '华马', อนุสาวรีย์: '阿努沙里', ออเงิน: '奥能',
  // Samut Prakan · Pathum Thani · Nonthaburi
  บางแก้ว: '挽交', บางโฉลง: '挽乍隆', บางปลา: '挽帕拉', บางปูใหม่: '新挽普',
  บางพลีใหญ่: '大挽披', บางเพรียง: '挽普良', บางเสาธง: '挽绍通',
  บ้านระกาศ: '班拉甲', แพรกษาใหม่: '新帕叻沙', ราชาเทวะ: '拉差贴瓦',
  เทพารักษ์: '贴帕叻', สำโรง: '三隆', สำโรงใต้: '南三隆', สำโรงเหนือ: '北三隆',
  คลองหนึ่ง: '空能', ลาดสวาย: '拉沙外', บ้านใหม่: '班迈',
  ศีรษะจรเข้ใหญ่: '西沙乍拉客亚', ศรีสาจรเข้ใหญ่: '西沙乍拉客亚',
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

/* What the team typed in /admin/geography, when they typed anything.
   The tables below are a starting point, not the last word: a district this
   agency lists in every week may have a name the team prefers, and until this
   existed the page promised "3 ภาษา ต่อระดับ" while offering one box for one
   language on one level. An entry with no override falls straight through. */
export type GeoOverride = Map<string, { en?: string; zh?: string }>;
export type GeoOverrides = { province?: GeoOverride; district?: GeoOverride; subdistrict?: GeoOverride };

/** the prefix the team types varies ("แขวง คันนายาว" / "แขวงคันนายาว") */
export const geoKey = (v: unknown) =>
  clean(v).replace(/^(แขวง|ตำบล|ต\.|เขต|อำเภอ|อ\.)\s*/, '').replace(/\s+/g, ' ');

const pick = (o: GeoOverride | undefined, key: string, locale: Locale) => {
  const row = o?.get(key);
  const v = locale === 'zh' ? row?.zh : row?.en;
  return v && v.trim() ? v.trim() : '';
};

/** The province in the reader's language: Chinese name, romanisation, or Thai. */
export function provinceLabel(name: unknown, locale: Locale, over?: GeoOverrides): string {
  const th = canonicalProvince(name);
  if (!th || locale === DEFAULT_LOCALE) return th;
  const own = pick(over?.province, geoKey(th), locale);
  if (own) return own;
  if (locale === 'zh') return PROVINCE_ZH[th] ?? PROVINCE_EN[th] ?? th;
  return PROVINCE_EN[th] ?? th;
}

/** The district, romanised where we know it. Chinese uses the same Latin form. */
export function districtLabel(name: unknown, locale: Locale, over?: GeoOverrides): string {
  const raw = clean(name);
  if (!raw || locale === DEFAULT_LOCALE) return raw;
  const own = pick(over?.district, geoKey(raw), locale);
  if (own) return own;
  // the prefix is only stripped to look the name up; an unknown place is
  // handed back exactly as stored rather than half-trimmed
  const bare = raw.replace(/^(เขต|อำเภอ|อ\.)\s*/, '');
  if (locale === 'zh') return DISTRICT_ZH[bare] ?? DISTRICT_EN[bare] ?? raw;
  return DISTRICT_EN[bare] ?? raw;
}

/** The subdistrict, romanised where we know it. The stored prefix is dropped. */
export function subdistrictLabel(name: unknown, locale: Locale, over?: GeoOverrides): string {
  const raw = clean(name);
  if (!raw || locale === DEFAULT_LOCALE) return raw;
  const own = pick(over?.subdistrict, geoKey(raw), locale);
  if (own) return own;
  const bare = raw.replace(/^(แขวง|ตำบล|ต\.)\s*/, '');
  if (locale === 'zh') return SUBDISTRICT_ZH[bare] ?? SUBDISTRICT_EN[bare] ?? raw;
  return SUBDISTRICT_EN[bare] ?? raw;
}

/** The English/Chinese this file knows, used to prefill a fresh tree. */
/** every place name this file knows, for the test that keeps the set complete */
export const KNOWN_PLACES = {
  province: () => Object.keys(PROVINCE_EN),
  district: () => Object.keys(DISTRICT_EN),
  subdistrict: () => Object.keys(SUBDISTRICT_EN),
};

export const builtinLabels = (kind: 'province' | 'district' | 'subdistrict', th: string) => {
  const key = geoKey(th);
  if (kind === 'province') {
    const p = canonicalProvince(th);
    return { en: PROVINCE_EN[p] ?? '', zh: PROVINCE_ZH[p] ?? '' };
  }
  const en = kind === 'district' ? DISTRICT_EN : SUBDISTRICT_EN;
  const zh = kind === 'district' ? DISTRICT_ZH : SUBDISTRICT_ZH;
  return { en: en[key] ?? '', zh: zh[key] ?? '' };
};
