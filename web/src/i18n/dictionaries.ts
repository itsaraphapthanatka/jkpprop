/* ============================================================
   UI copy for the public site — NFR-04 forbids hardcoded strings.

   Scope note: this covers the site *chrome* (nav, buttons, labels,
   form fields) which is mechanical to translate. The marketing body
   copy — headlines, section prose, FAQ answers — is a client deliverable
   that does not exist yet (HOME_HANDOFF_CHECKLIST §M). Those strings live
   in the CMS (`CmsPage.content` / `PageSection.content`, already keyed by
   language) and are edited in /admin/cms, not here.
   ============================================================ */
import type { Locale } from './config';

export type Dictionary = {
  nav: {
    home: string; listing: string; about: string; faq: string; contact: string;
    forRent: string; forSale: string; factory: string; warehouse: string;
  };
  common: {
    search: string; viewDetail: string; viewAll: string; contactUs: string;
    perMonth: string; sqm: string; priceOnRequest: string; loading: string;
    backToHome: string; language: string;
  };
  listing: {
    title: string; resultCount: string; filters: string; sortBy: string;
    zone: string; type: string; size: string; price: string; clear: string;
    empty: string; emptyCta: string;
  };
  property: {
    code: string; area: string; location: string; specs: string;
    enquire: string; share: string; similar: string;
  };
  form: {
    name: string; phone: string; email: string; company: string;
    message: string; submit: string; sending: string;
    required: string; success: string; successBody: string;
  };
};

const th: Dictionary = {
  nav: {
    home: 'หน้าแรก', listing: 'อสังหาริมทรัพย์', about: 'เกี่ยวกับเรา', faq: 'คำถามที่พบบ่อย', contact: 'ติดต่อเรา',
    forRent: 'ให้เช่า', forSale: 'ขาย', factory: 'โรงงาน', warehouse: 'โกดัง / คลังสินค้า',
  },
  common: {
    search: 'ค้นหา', viewDetail: 'ดูรายละเอียด', viewAll: 'ดูทั้งหมด', contactUs: 'ติดต่อเรา',
    perMonth: '/ เดือน', sqm: 'ตร.ม.', priceOnRequest: 'ติดต่อสอบถาม', loading: 'กำลังโหลด…',
    backToHome: 'กลับสู่หน้าแรก', language: 'ภาษา',
  },
  listing: {
    title: 'อสังหาริมทรัพย์ทั้งหมด', resultCount: 'รายการ', filters: 'ตัวกรอง', sortBy: 'เรียงตาม',
    zone: 'ทำเล', type: 'ประเภท', size: 'ขนาด', price: 'ราคา', clear: 'ล้างตัวกรอง',
    empty: 'ไม่พบทรัพย์ตามเงื่อนไขที่เลือก', emptyCta: 'แจ้งความต้องการให้เราหาให้',
  },
  property: {
    code: 'รหัสทรัพย์', area: 'พื้นที่', location: 'ทำเล', specs: 'รายละเอียด',
    enquire: 'สอบถามทรัพย์นี้', share: 'แชร์', similar: 'ทรัพย์ที่คล้ายกัน',
  },
  form: {
    name: 'ชื่อผู้ติดต่อ', phone: 'เบอร์โทรศัพท์', email: 'อีเมล', company: 'บริษัท / องค์กร',
    message: 'รายละเอียดเพิ่มเติม', submit: 'ส่งความต้องการ', sending: 'กำลังส่ง…',
    required: 'จำเป็น', success: 'ส่งความต้องการแล้ว',
    successBody: 'ทีมงาน JKP Property ได้รับข้อมูลของคุณแล้ว และจะติดต่อกลับโดยเร็วที่สุด',
  },
};

const en: Dictionary = {
  nav: {
    home: 'Home', listing: 'Properties', about: 'About us', faq: 'FAQ', contact: 'Contact',
    forRent: 'For rent', forSale: 'For sale', factory: 'Factories', warehouse: 'Warehouses',
  },
  common: {
    search: 'Search', viewDetail: 'View details', viewAll: 'View all', contactUs: 'Contact us',
    perMonth: '/ month', sqm: 'sqm', priceOnRequest: 'Price on request', loading: 'Loading…',
    backToHome: 'Back to home', language: 'Language',
  },
  listing: {
    title: 'All properties', resultCount: 'results', filters: 'Filters', sortBy: 'Sort by',
    zone: 'Location', type: 'Type', size: 'Size', price: 'Price', clear: 'Clear filters',
    empty: 'No properties match these filters', emptyCta: 'Tell us what you need',
  },
  property: {
    code: 'Property code', area: 'Area', location: 'Location', specs: 'Specifications',
    enquire: 'Enquire about this property', share: 'Share', similar: 'Similar properties',
  },
  form: {
    name: 'Contact name', phone: 'Phone number', email: 'Email', company: 'Company',
    message: 'Additional details', submit: 'Send enquiry', sending: 'Sending…',
    required: 'required', success: 'Enquiry sent',
    successBody: 'The JKP Property team has received your details and will be in touch shortly.',
  },
};

const zh: Dictionary = {
  nav: {
    home: '首页', listing: '房源', about: '关于我们', faq: '常见问题', contact: '联系我们',
    forRent: '出租', forSale: '出售', factory: '工厂', warehouse: '仓库',
  },
  common: {
    search: '搜索', viewDetail: '查看详情', viewAll: '查看全部', contactUs: '联系我们',
    perMonth: '/ 月', sqm: '平方米', priceOnRequest: '价格面议', loading: '加载中…',
    backToHome: '返回首页', language: '语言',
  },
  listing: {
    title: '全部房源', resultCount: '个结果', filters: '筛选', sortBy: '排序',
    zone: '地区', type: '类型', size: '面积', price: '价格', clear: '清除筛选',
    empty: '没有符合条件的房源', emptyCta: '告诉我们您的需求',
  },
  property: {
    code: '房源编号', area: '面积', location: '地区', specs: '详细规格',
    enquire: '咨询此房源', share: '分享', similar: '相似房源',
  },
  form: {
    name: '联系人姓名', phone: '电话号码', email: '电子邮箱', company: '公司名称',
    message: '补充说明', submit: '提交需求', sending: '提交中…',
    required: '必填', success: '已提交',
    successBody: 'JKP Property 团队已收到您的信息，我们会尽快与您联系。',
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { th, en, zh };

export const getDictionary = (locale: Locale): Dictionary => DICTIONARIES[locale] ?? th;
