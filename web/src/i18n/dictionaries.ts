/* ============================================================
   UI copy for the public site — NFR-04 forbids hardcoded strings.

   Two mechanisms, split by what the string *is*:

     this file   chrome and prose the site author writes — headings,
                 buttons, labels, section copy. Reached by key.
     enums.ts    option values that are also stored data — deal types,
                 zone colours, size bands. Reached by the Thai value,
                 because that value is the key the database holds.

   Marketing copy lives here as the default. `PageSection.content` is keyed
   by language ({ th: {...}, en: {...}, zh: {...} }) and overrides these at
   render time, so /admin/cms can reword any section per language without a
   deploy — see lib/server/sectionCopy.
   ============================================================ */
import type { Locale } from './config';

export type Dictionary = {
  nav: {
    home: string; listing: string; about: string; faq: string; contact: string; contactTeam: string;
    forRent: string; forSale: string; factory: string; warehouse: string;
    factoryRent: string; factorySale: string; warehouseRent: string; warehouseSale: string;
    chooseLanguage: string; menu: string;
  };
  common: {
    address: string; search: string; viewDetail: string; viewAll: string; showAll: string; contactUs: string;
    perMonth: string; sqm: string; priceOnRequest: string; loading: string;
    backToHome: string; language: string; price: string; apply: string; clear: string;
    home: string; noPhoto: string; confirm: string; million: string;
  };
  hero: {
    headline1: string; headline2: string; headlineTail: string; sub: string; searchPlaceholder: string;
    filters: string; moreFilters: string; propertyType: string; size: string; priceRange: string;
    zone: string; zoneColor: string; features: string; floorLoading: string;
  };
  featured: {
    eyebrow: string; heading: string; sub: string;
    emptyTitle: string; emptyBody: string;
  };
  locations: {
    eyebrow: string; heading: string; seeInArea: string; properties: string; available: string; results: string;
    avgDistance: string; topProvinces: string; inArea: string;
    unsureTitle: string; adviceHeading: string; adviceBody: string;
    adviceQuestion: string; adviceCta: string; getAdvice: string; contactExpert: string; mapAlt: string;
  };
  steps: { eyebrow: string; heading: string; sub: string; step: string; items: { title: string; desc: string }[] };
  whyUs: {
    eyebrow: string; heading: string; sub: string; years: string; satisfaction: string;
    kpis: string[];
    items: { title: string; desc: string }[];
  };
  certs: {
    eyebrow: string; heading: string; sub: string; verified: string;
    items: { name: string; tag: string; desc: string }[];
  };
  trust: { eyebrow: string; heading: string; happyClients: string };
  cta: {
    free: string; freeShort: string; eyebrow: string;
    headline: string; headlineAccent: string; sub: string;
    primary: string; call: string; teamCount: string; teamNote: string; photoAlt: string;
  };
  footer: {
    company: string; services: string; properties: string; contact: string;
    articles: string; industrialLand: string; terms: string; privacy: string; rights: string; tagline: string;
  };
  floating: { backToTop: string };
  consent: {
    title: string; body: string; noTracking: string;
    manage: string; rejectOptional: string; acceptAll: string; save: string; back: string;
    necessary: string; necessaryBody: string; always: string;
    embeds: string; embedsBody: string; on: string; off: string;
    cookiePolicy: string; privacyPolicy: string; settings: string;
    mapBlocked: string; mapBlockedBody: string; mapAllow: string;
  };
  listing: {
    saved: string;
    totalArea: string; title: string; resultsFound: string; results: string; filters: string; sortBy: string;
    zone: string; type: string; size: string; price: string; clear: string; search: string;
    newest: string; priceAsc: string; priceDesc: string; sizeAsc: string; sizeDesc: string;
    copyLink: string; email: string;
    prevPage: string; nextPage: string; pageN: string;
    zoomClose: string; zoomPrev: string; zoomNext: string;
    /** ทรัพย์ที่ทีมกรอกว่าไม่ว่างแล้ว */
    taken: string; takenNote: string;
    noSavedTitle: string; noSavedBody: string; showAll: string;
    empty: string; emptyHint: string; emptyTitle: string; emptyBody: string;
  };
  property: {
    code: string; specs: string; features: string; usage: string; zoneType: string; location: string;
    nearby: string; similar: string; openInMaps: string; areaLevelNote: string;
    priceRent: string; priceSale: string; updatedAt: string; notGuaranteed: string;
    noPhotos: string; photos: string;
  };
  share: { copy: string; email: string; wechat: string; wechatHint: string; back: string };
  inquiry: {
    heading: string; hours: string; orFillIn: string; contactVia: string;
    interestedIn: string; wantMore: string;
    namePh: string; emailPh: string; phonePh: string;
    send: string; sent: string; sending: string; failed: string; sentNote: string;
  };
  about: {
    hero: string; breadcrumb: string;
    storyEyebrow: string; storyHeading: string; storyBody: string; storyCaption: string;
    statFounded: string; statListings: string; statTeamYears: string;
    statProvinces: string; statUpdated: string;
    pillars: { title: string; desc: string }[];
    teamEyebrow: string; teamHeading: string; teamSub: string; teamBlurb: string;
    awardEyebrow: string; awardHeading: string; awardBody: string; awardCaption: string;
    pressHeading: string; pressEyebrow: string;
  };
  contact: {
    hero: string; sub: string; breadcrumb: string;
    reachUs: string; ourPhone: string; salesEnquiry: string; generalEnquiry: string;
    ourLocation: string; contactAt: string; hours: string; weekdays: string; hoursValue: string;
    address: string; langNote: string; openInMaps: string; mapMissing: string;
  };
  requirement: {
    heading: string; sub: string; respondentStatus: string; agent: string; customer: string;
    choose: string; wanted: string; notSpecified: string; company: string; companyPh: string;
    namePh: string; details: string; detailsPh: string; sent: string;
  };
  /* The tokenized page a customer opens from a link. It has no [locale] in
     its path — the language comes from ?lang= or the switcher on the page —
     so its copy lives here rather than being written into the component, the
     way it was when only Thai existed. */
  clientShortlist: {
    badge: string; forCustomer: string; clientLogo: string; picked: string;
    heading: string; sub: string; criteria: string;
    cards: string; compare: string;
    yourOpinion: string; interested: string; undecided: string; notInterested: string;
    saveFailed: string; viewDetail: string; available: string;
    detail: string; photo: string; opinion: string;
    askMore: string; call: string; emailUs: string;
    notFound: string; notFoundBody: string; footer: string;
    sentOn: string; defaultName: string; rentOnly: string; giveOpinion: string; emailSubject: string;
    needsRor4: string; nearPort: string;
    rows: { area: string; land: string; floor: string; height: string; power: string; rent: string; rentSqm: string; sale: string; deposit: string; advance: string; term: string };
  };
  faq: {
    searchPlaceholder: string; noResults: string; copied: string; copyQuestion: string;
    hero: string; heroSub: string; categories: string; stillStuck: string; stillStuckSub: string; heroAlt: string;
    share: string;
  };
  /* Browser-tab and search-result titles.
   *
   * Thirteen pages carried a hard-coded Thai `metadata.title`, so /en and /zh
   * served "โรงงานให้เช่า | JKP Property" to English and Chinese readers —
   * including the landing pages built specifically to rank. */
  titles: {
    faq: string; listing: string;
    factoryRent: string; factorySale: string; warehouseRent: string; warehouseSale: string;
    airportDonmuang: string; airportSuvarnabhumi: string;
    bangkokCbd: string; bangkokNonthaburi: string;
    portLaemChabang: string; portMahachai: string; portMapTaPhut: string;
  };
  form: {
    name: string; phone: string; email: string; company: string;
    message: string; submit: string; sending: string;
    required: string; success: string; successBody: string;
    errName: string; errPhone: string; errRespondent: string;
  };
};

const th: Dictionary = {
  nav: {
    home: 'หน้าแรก', listing: 'อสังหาริมทรัพย์', about: 'เกี่ยวกับเรา', faq: 'คำถามพบบ่อย',
    contact: 'ติดต่อเรา', contactTeam: 'ติดต่อทีมงาน',
    forRent: 'ให้เช่า', forSale: 'ขาย', factory: 'โรงงาน', warehouse: 'โกดัง',
    factoryRent: 'โรงงานให้เช่า', factorySale: 'โรงงานสำหรับขาย',
    warehouseRent: 'โกดังให้เช่า', warehouseSale: 'โกดังสำหรับขาย',
    chooseLanguage: 'เลือกภาษา', menu: 'เมนู',
  },
  common: {
    address: 'กรุงเทพมหานคร, ประเทศไทย', search: 'ค้นหา', viewDetail: 'ดูรายละเอียด', viewAll: 'ดูทั้งหมด', showAll: 'แสดงทั้งหมด',
    contactUs: 'ติดต่อเรา', perMonth: '/ เดือน', sqm: 'ตร.ม.', priceOnRequest: 'ติดต่อสอบถาม',
    loading: 'กำลังโหลด…', backToHome: 'กลับสู่หน้าแรก', language: 'ภาษา', price: 'ราคา',
    apply: 'นำไปใช้', clear: 'ล้างค่า', home: 'หน้าแรก', noPhoto: 'ยังไม่มีรูป', confirm: 'ยืนยัน', million: 'ล้าน',
  },
  hero: {
    headline1: 'สำรวจอสังหาริมทรัพย์อุตสาหกรรม', headline2: 'หรือโรงงานทั่วประเทศไทย',
    headlineTail: 'ที่เหมาะกับคุณ',
    sub: 'รวมรายการโรงงานและโกดังให้เช่า–ขายทั่วประเทศ ที่ผ่านการตรวจสอบและคัดกรองโดยทีมงานมืออาชีพ',
    searchPlaceholder: 'ค้นหาตามทำเล, จังหวัด, รหัสทรัพย์…',
    filters: 'ตัวกรองการค้นหา', moreFilters: 'ตัวกรองเพิ่มเติม', propertyType: 'ประเภทอสังหา',
    size: 'ขนาดพื้นที่', priceRange: 'ช่วงราคา', zone: 'โซน', zoneColor: 'พื้นที่สี (ผังเมือง)', features: 'คุณสมบัติ',
    floorLoading: 'น้ำหนักที่พื้นรับได้',
  },
  featured: {
    eyebrow: 'ทรัพย์มาใหม่', heading: 'อสังหาริมทรัพย์ล่าสุด',
    sub: 'คัดสรรทรัพย์คุณภาพที่ผ่านการตรวจสอบ อัปเดตใหม่ทุกสัปดาห์',
    emptyTitle: 'ยังไม่มีทรัพย์ที่เผยแพร่',
    emptyBody: 'ทรัพย์ที่ทีมงานเผยแพร่แล้วจะแสดงที่นี่ ติดต่อเราเพื่อแจ้งความต้องการไว้ล่วงหน้าได้',
  },
  locations: {
    eyebrow: 'ทำเลยุทธศาสตร์', heading: 'ค้นหาทำเลธุรกิจที่เหมาะกับคุณ', seeInArea: 'ดูทรัพย์ในทำเลนี้', properties: 'ทรัพย์',
    available: 'ทรัพย์พร้อมใช้งานในทำเลนี้', results: 'รายการ',
    avgDistance: 'ระยะเฉลี่ยถึงจุดยุทธศาสตร์', topProvinces: 'จังหวัดเด่น', inArea: 'ในเขต',
    unsureTitle: 'ยังไม่แน่ใจใช่ไหม? ให้เราช่วยแนะนำทำเลที่เหมาะกับคุณ',
    adviceHeading: 'บอกความต้องการของคุณ แล้วทีมเราจะช่วยแนะนำโซนอุตสาหกรรมที่เหมาะที่สุด',
    adviceBody: 'ปัจจัยไหนสำคัญที่สุดสำหรับคุณ?',
    adviceQuestion: 'ปัจจัยไหนสำคัญที่สุดสำหรับคุณ?',
    adviceCta: 'รับคำแนะนำทำเลฟรี', getAdvice: 'ขอคำแนะนำ',
    contactExpert: 'ติดต่อผู้เชี่ยวชาญของเรา', mapAlt: 'แผนที่ทำเล',
  },
  steps: {
    eyebrow: 'ขั้นตอนง่ายๆ', heading: 'ค้นหาทรัพย์ใน 4 ขั้นตอน',
    sub: 'ตั้งแต่บอกความต้องการจนถึงปิดดีล เราดูแลให้ทุกขั้นราบรื่นและมั่นใจ', step: 'ขั้นตอน',
    items: [
      { title: 'บอกความต้องการ', desc: 'แจ้งพื้นที่ ทำเล งบประมาณ และเงื่อนไขที่คุณต้องการ' },
      { title: 'รับรายการที่คัดกรอง', desc: 'ทีมผู้เชี่ยวชาญคัดทรัพย์ที่เหมาะสมและส่งตัวเลือกให้' },
      { title: 'นัดเข้าชมสถานที่', desc: 'ประสานงานและพาเข้าชมทรัพย์จริงตามวันเวลาที่สะดวก' },
      { title: 'ปิดดีลอย่างมั่นใจ', desc: 'ดูแลสัญญาและเอกสารทางกฎหมายจนจบกระบวนการ' },
    ],
  },
  whyUs: {
    eyebrow: 'ทำไมต้องเลือกเรา', heading: 'เหตุผลที่ลูกค้าเลือกเรา',
    sub: 'เราได้รับความไว้วางใจจากทั้งนักลงทุนต่างชาติและเจ้าของทรัพย์ไทย ด้วยความเชี่ยวชาญ ความโปร่งใส และเทคโนโลยีที่ช่วยให้ทุกดีลเดินหน้าได้จริง',
    years: ' ปี', satisfaction: 'ทีมงานดูแลตั้งแต่คัดทรัพย์จนถึงวันเซ็นสัญญา',
    kpis: ['ทรัพย์ที่เผยแพร่อยู่', 'จังหวัดที่มีทรัพย์', 'อัปเดตล่าสุด'],
    items: [
      { title: 'จดทะเบียนถูกต้องและได้รับการรับรอง', desc: 'จดทะเบียนกับ DBD สมาชิก TREBA พร้อมประสบการณ์จริงในดีลอุตสาหกรรม' },
      { title: 'รองรับหลายภาษา', desc: 'สื่อสารได้ทั้งจีน อังกฤษ และไทย ลดช่องว่างด้านภาษาและวัฒนธรรม' },
      { title: 'เข้าใจทั้งสองฝั่ง', desc: 'เข้าใจมุมมองทั้งเจ้าของทรัพย์และผู้เช่า เจรจาอย่างเป็นธรรมและได้ประโยชน์ร่วมกัน' },
      { title: 'ทรัพย์ที่ตรวจสอบแล้วทุกรายการ', desc: 'ร่วมงานกับดีเวลลอปเปอร์และเจ้าของทรัพย์โดยตรง ตรวจเอกสารสิทธิ์และสถานะว่างก่อนลงประกาศ' },
      { title: 'ราคาโปร่งใส', desc: 'ไม่มีการบวกราคาเหนือเจ้าของทรัพย์ สร้างความเชื่อมั่นให้ผู้เช่าและผู้ซื้อ' },
      { title: 'ขับเคลื่อนด้วยเทคโนโลยี', desc: 'ระบบอัตโนมัติและเครื่องมือ AI ช่วยให้บริการได้รวดเร็ว แม่นยำ และตรงโจทย์' },
    ],
  },
  certs: {
    eyebrow: 'ความน่าเชื่อถือ', heading: 'ใบรับรองและการกำกับดูแล', verified: 'ยืนยันแล้ว',
    sub: 'ดำเนินงานภายใต้มาตรฐานวิชาชีพและการกำกับดูแลที่ตรวจสอบได้ทุกขั้นตอน',
    items: [
      { name: 'TREBA', tag: 'สมาชิกสมาคมวิชาชีพ', desc: 'สมาชิกสมาคมนายหน้าอสังหาริมทรัพย์ไทย ปฏิบัติตามจรรยาบรรณและมาตรฐานวิชาชีพ' },
      { name: 'DBD', tag: 'จดทะเบียนถูกต้องตามกฎหมาย', desc: 'จดทะเบียนกับกรมพัฒนาธุรกิจการค้า กระทรวงพาณิชย์ ดำเนินธุรกิจอย่างโปร่งใส' },
      { name: 'มาตรฐานวิชาชีพ', tag: 'ผ่านการอบรมและรับรอง', desc: 'ทีมนายหน้าผ่านการอบรมหลักสูตรอสังหาริมทรัพย์ พร้อมประสบการณ์จริงในดีลอุตสาหกรรม' },
    ],
  },
  trust: { eyebrow: 'ความสำเร็จของลูกค้า', heading: 'ธุรกิจทั่วประเทศที่ไว้วางใจเรา', happyClients: 'ธุรกิจที่เราเคยช่วยหาทำเล' },
  cta: {
    free: 'ปรึกษาฟรี ไม่มีค่าใช้จ่าย', freeShort: 'ปรึกษาฟรี!', eyebrow: 'ปรึกษาฟรี ไม่มีค่าใช้จ่าย',
    headline: 'พร้อมหาโรงงานหรือโกดังที่ใช่ ', headlineAccent: 'ให้เราช่วยคุณ',
    sub: 'ให้ทีมผู้เชี่ยวชาญของเราช่วยคัดทรัพย์ที่ตรงโจทย์ที่สุด พร้อมดูแลตั้งแต่ค้นหาจนปิดดีล',
    primary: 'ปรึกษาฟรีวันนี้', call: 'โทรเลย',
    teamCount: 'ทีมผู้เชี่ยวชาญ 12 คน', teamNote: 'พร้อมดูแลคุณทุกขั้นตอน',
    photoAlt: 'ทีมงาน JKP Property',
  },
  footer: {
    company: 'บริษัท', services: 'บริการ', properties: 'อสังหาริมทรัพย์', contact: 'ข้อมูลติดต่อ',
    articles: 'บทความ', industrialLand: 'ที่ดินอุตสาหกรรม',
    terms: 'ข้อกำหนดการใช้งาน', privacy: 'นโยบายความเป็นส่วนตัว',
    rights: '© 2026 JKP PROPERTY. สงวนลิขสิทธิ์',
    tagline: 'แพลตฟอร์มนายหน้าโรงงานและโกดังอุตสาหกรรม เชื่อมนักลงทุนกับทรัพย์ที่ผ่านการคัดกรองทั่วประเทศไทย',
  },
  floating: { backToTop: 'กลับขึ้นด้านบน' },
  consent: {
    title: 'คุกกี้และความเป็นส่วนตัว',
    body: 'เว็บไซต์นี้ไม่มีระบบวิเคราะห์ผู้เข้าชม ไม่มีคุกกี้โฆษณา และไม่มีการติดตามพฤติกรรมข้ามเว็บไซต์ สิ่งเดียวที่ต้องขอความยินยอมคือแผนที่จากภายนอกสองจุด คือแผนที่ทำเลบนหน้าแรก (CARTO / OpenStreetMap) และแผนที่ Google ที่ฝังอยู่ในหน้าติดต่อเรา ทั้งสองเป็นบริการของบุคคลภายนอก',
    noTracking: 'ท่านเลือกปฏิเสธได้โดยไม่กระทบการใช้งานส่วนอื่นของเว็บไซต์',
    manage: 'จัดการการตั้งค่า', rejectOptional: 'ปฏิเสธที่ไม่จำเป็น', acceptAll: 'ยอมรับทั้งหมด',
    save: 'บันทึกการตั้งค่า', back: 'ย้อนกลับ',
    necessary: 'จำเป็นต่อการใช้งาน', necessaryBody: 'เก็บสถานะเข้าสู่ระบบของเจ้าหน้าที่ รายการทรัพย์ที่ท่านกดบันทึกไว้ และตัวเลือกความยินยอมนี้ ทั้งหมดเก็บไว้ในเบราว์เซอร์ของท่านเอง', always: 'เปิดเสมอ',
    embeds: 'แผนที่จากภายนอก', embedsBody: 'แสดงแผนที่ทำเลบนหน้าแรก (CARTO / OpenStreetMap) และแผนที่ Google ในหน้าติดต่อเรา ถ้าปิดไว้ เราจะไม่โหลดแผนที่ทั้งสองเลย และยังกดเปิดใน Google Maps ได้ตามปกติ',
    on: 'เปิด', off: 'ปิด',
    cookiePolicy: 'นโยบายคุกกี้', privacyPolicy: 'นโยบายความเป็นส่วนตัว', settings: 'การตั้งค่าคุกกี้',
    mapBlocked: 'แผนที่ยังไม่ได้โหลด',
    mapBlockedBody: 'แผนที่นี้ให้บริการโดยบุคคลภายนอก การโหลดจะส่งหมายเลขไอพีของท่านไปยังผู้ให้บริการ จะโหลดก็ต่อเมื่อท่านอนุญาต',
    mapAllow: 'แสดงแผนที่',
  },
  listing: {
    saved: 'บันทึกไว้', totalArea: 'ขนาดพื้นที่รวม', title: 'อสังหาริมทรัพย์ทั้งหมด', resultsFound: 'พบ', results: 'รายการ',
    filters: 'ตัวกรองการค้นหา', sortBy: 'เรียงตาม:',
    zone: 'ทำเล', type: 'ประเภทอสังหา', size: 'ขนาดพื้นที่', price: 'ช่วงราคา',
    clear: 'ล้างค่า', search: 'ค้นหา',
    newest: 'ใหม่ล่าสุด', priceAsc: 'ราคา (น้อย → มาก)', priceDesc: 'ราคา (มาก → น้อย)',
    sizeAsc: 'ขนาด (เล็ก → ใหญ่)', sizeDesc: 'ขนาด (ใหญ่ → เล็ก)',
    copyLink: 'คัดลอกลิงก์', email: 'อีเมล',
    prevPage: 'หน้าก่อนหน้า', nextPage: 'หน้าถัดไป', pageN: 'หน้า',
    zoomClose: 'ปิด', zoomPrev: 'รูปก่อนหน้า', zoomNext: 'รูปถัดไป',
    taken: 'ไม่ว่าง', takenNote: 'ทรัพย์นี้มีผู้เช่า/ผู้ซื้อแล้ว ติดต่อเราเพื่อดูทรัพย์ที่ใกล้เคียงกัน', 
    noSavedTitle: 'ยังไม่มีทรัพย์ที่บันทึกไว้', noSavedBody: 'กดรูปหัวใจบนทรัพย์ที่สนใจ แล้วกลับมาที่นี่เพื่อดูรายการที่เก็บไว้', showAll: 'ดูทรัพย์ทั้งหมด',
    empty: 'ไม่พบทรัพย์ตามเงื่อนไขที่เลือก', emptyHint: 'ลองปรับตัวกรอง หรือกด "ล้างค่า" เพื่อดูทั้งหมด',
    emptyTitle: 'ยังไม่มีทรัพย์ที่เผยแพร่', emptyBody: 'ทรัพย์ที่ทีมงานเผยแพร่แล้วจะแสดงที่นี่',
  },
  property: {
    code: 'รหัสทรัพย์', specs: 'รายละเอียดทรัพย์', features: 'คุณสมบัติของทรัพย์', usage: 'การใช้งานที่เหมาะ',
    zoneType: 'ประเภทโซน', location: 'ตำแหน่งทรัพย์', nearby: 'สถานที่ใกล้เคียง',
    similar: 'อสังหาริมทรัพย์ที่คล้ายกัน', openInMaps: 'เปิดพื้นที่นี้ใน Google Maps',
    areaLevelNote: 'แสดงระดับพื้นที่เพื่อความเป็นส่วนตัว',
    priceRent: 'ราคาเช่า', priceSale: 'ราคาขาย',
    updatedAt: 'อัปเดตล่าสุด', notGuaranteed: 'ราคา/สถานะไม่การันตี ต้องตรวจสอบอีกครั้ง',
    noPhotos: 'ยังไม่มีรูปทรัพย์นี้', photos: 'รูป',
  },
  share: {
    copy: 'คัดลอกลิงก์', email: 'อีเมล', wechat: 'WeChat',
    wechatHint: 'เปิด WeChat แล้วสแกนรหัสนี้เพื่อเปิดหน้านี้',
    back: 'ย้อนกลับ',
  },
  inquiry: {
    heading: 'ขอข้อมูลเพิ่มเติม', hours: 'ทีมขายพร้อมดูแล จ–ศ 9:00–18:00',
    orFillIn: 'หรือกรอกฟอร์ม', contactVia: 'ติดต่อผ่าน ',
    interestedIn: 'สนใจทรัพย์', wantMore: 'ต้องการข้อมูลเพิ่มเติม…',
    namePh: 'ชื่อของคุณ', emailPh: 'อีเมล', phonePh: 'เบอร์โทรศัพท์',
    send: 'ส่งคำถาม', sent: 'ส่งแล้ว', sending: 'กำลังส่ง…',
    failed: 'ส่งไม่สำเร็จ กรุณาลองใหม่ หรือโทรหาเราได้เลย',
    sentNote: 'ทีมงานได้รับคำถามของท่านแล้ว จะติดต่อกลับโดยเร็วที่สุด',
  },
  about: {
    hero: 'เกี่ยวกับเรา', breadcrumb: 'เกี่ยวกับเรา',
    storyEyebrow: 'ก่อตั้ง', storyHeading: 'เรื่องราวของเรา',
    storyBody: 'JKP Property ก่อตั้งขึ้นเพื่อเป็นตัวกลางที่น่าเชื่อถือระหว่างนักลงทุนและเจ้าของทรัพย์อสังหาริมทรัพย์อุตสาหกรรมทั่วประเทศไทย ด้วยความเข้าใจตลาดโรงงานและโกดังอย่างลึกซึ้ง ทีมงานของเราคัดกรองทรัพย์ทุกรายการก่อนเผยแพร่ พร้อมดูแลลูกค้าตั้งแต่ค้นหาจนปิดดีลอย่างโปร่งใสและเป็นธรรม',
    storyCaption: 'JKP Property · Founded by ทีมผู้ก่อตั้ง',
    statFounded: 'ก่อตั้ง', statListings: 'ทรัพย์ในระบบ', statTeamYears: 'ประสบการณ์ทีมงาน',
    statProvinces: 'จังหวัดที่มีทรัพย์', statUpdated: 'อัปเดตล่าสุด',
    pillars: [
      { title: 'การสื่อสาร', desc: 'สื่อสารได้ทั้งไทย อังกฤษ และจีน ไม่มีช่องว่างด้านภาษา' },
      { title: 'ความน่าเชื่อถือ', desc: 'ทีมงานเฉพาะทางด้านอสังหาริมทรัพย์อุตสาหกรรมและโลจิสติกส์' },
      { title: 'ความรู้ตลาด', desc: 'เข้าใจทำเลและกฎระเบียบของทุกจังหวัดในประเทศไทย' },
    ],
    teamEyebrow: 'ทีมงาน', teamHeading: 'พบกับทีมงานของเรา',
    teamSub: 'ทีมผู้เชี่ยวชาญด้านอสังหาริมทรัพย์อุตสาหกรรมที่เชื่อถือได้ทั่วประเทศไทย',
    teamBlurb: 'ทีมผู้เชี่ยวชาญที่คัดเลือกด้วยความรอบคอบทุกด้าน ด้านอสังหาริมทรัพย์อุตสาหกรรมในประเทศไทย ด้วยความเข้าใจในพื้นที่และความชำนาญในการให้บริการ เรามีประสบการณ์การทำงานที่หลากหลายเพื่อสร้างความไว้วางใจให้กับลูกค้าทุกท่าน',
    awardEyebrow: 'รางวัล', awardHeading: 'เอเจนต์อสังหาริมทรัพย์อุตสาหกรรมที่ดีที่สุด',
    awardBody: 'JKP Property ได้รับรางวัล The Best Agent in Industrial Property จากสมาคมอสังหาริมทรัพย์ไทย ตอกย้ำความมุ่งมั่นในการให้บริการที่มีคุณภาพและความโปร่งใสในธุรกิจอสังหาริมทรัพย์อุตสาหกรรมของไทย',
    awardCaption: 'Founder · กรุงเทพฯ – ชลบุรี',
    pressHeading: 'ได้รับการนำเสนอใน', pressEyebrow: 'การรับรองจากวงการ',
  },
  contact: {
    hero: 'ติดต่อเรา', sub: 'ติดต่อสอบถามข้อมูลเกี่ยวกับอสังหาริมทรัพย์ของเรา', breadcrumb: 'ติดต่อเรา',
    reachUs: 'ติดต่อเราได้ที่', ourPhone: 'โทรศัพท์ของเรา',
    salesEnquiry: 'สอบถามการขาย:', generalEnquiry: 'สอบถามทั่วไป:',
    ourLocation: 'ที่ตั้งของเรา', contactAt: 'ติดต่อเราที่:',
    hours: 'เวลาทำการ', weekdays: 'จันทร์ - ศุกร์:', hoursValue: '9:00 - 18:00 น.',
    address: '41/6 หมู่ 7 ถ.บางนาตราด กม. 16.5 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540 (สำนักงานใหญ่)',
    langNote: '(English / ไทย)',
    openInMaps: 'เปิดใน Google Maps', mapMissing: 'ยังไม่ได้ตั้งพิกัดที่ตั้ง — ใส่ได้ที่ CMS › จัดการ Section › ติดต่อเรา',
  },
  requirement: {
    heading: 'แจ้งความต้องการ',
    sub: 'เลือกประเภททรัพย์ที่สนใจ แล้วกรอกเฉพาะรายละเอียดที่จำเป็น — ทีมงานจะติดต่อกลับ',
    respondentStatus: 'สถานะของผู้ตอบแบบสอบถาม', agent: 'เป็น Agent ตัวแทน', customer: 'เป็น ลูกค้า (ผู้เช่า)',
    choose: 'เลือก…', wanted: 'ต้องการ', notSpecified: 'ไม่ระบุ',
    company: 'ชื่อบริษัท / องค์กรของคุณ', companyPh: 'เช่น บ. ไทยโลจิสติกส์',
    namePh: 'กรอกชื่อของคุณ', details: 'รายละเอียดเพิ่มเติม',
    detailsPh: 'บอกเราเกี่ยวกับความต้องการของคุณเพิ่มเติม…', sent: 'ส่งความต้องการแล้ว',
  },
  clientShortlist: {
    badge: 'ลิงก์ส่วนตัว · ไม่ต้องเข้าสู่ระบบ', forCustomer: 'คัดทรัพย์สำหรับ', clientLogo: 'โลโก้ลูกค้า', picked: 'รายการที่คัดให้',
    heading: 'ทรัพย์ที่ตรงกับความต้องการของคุณ',
    sub: 'ทีมงาน JKP Property คัดเลือกรายการที่ตรงเงื่อนไขและตรวจสอบว่าว่างแล้ว — กรุณาให้ความเห็นแต่ละรายการเพื่อให้เราจัดนัดเข้าชมต่อไป',
    criteria: 'ความต้องการ:', cards: 'การ์ด', compare: 'ตารางเปรียบเทียบ',
    yourOpinion: 'ความเห็นของคุณ', interested: 'สนใจ', undecided: 'ยังไม่ตัดสินใจ', notInterested: 'ไม่สนใจ',
    saveFailed: 'ส่งความเห็นไม่สำเร็จ — ลองใหม่อีกครั้ง', viewDetail: 'ดูรายละเอียด', available: 'ว่าง',
    detail: 'รายละเอียด', photo: 'รูปทรัพย์', opinion: 'ความเห็น',
    askMore: 'สอบถามเพิ่มเติมหรือจัดนัดเข้าชมได้เลย', call: 'โทร', emailUs: 'อีเมลหาทีมงาน',
    notFound: 'ไม่พบรายการนี้ หรือลิงก์หมดอายุแล้ว', notFoundBody: 'กรุณาติดต่อทีมงาน JKP Property เพื่อขอลิงก์ใหม่',
    footer: 'ราคาและสถานะว่างอาจเปลี่ยนแปลง — ทีมงานจะยืนยันอีกครั้งก่อนนัดเข้าชม · Powered by JKP Property',
    sentOn: 'ส่งเมื่อ', defaultName: 'ทรัพย์ที่คัดให้คุณ', rentOnly: 'ให้เช่าเท่านั้น', giveOpinion: 'ให้ความเห็น',
    emailSubject: 'ขอนัดเข้าชมทรัพย์',
    needsRor4: 'ต้องการ ร.ง.4', nearPort: 'ใกล้ท่าเรือ',
    rows: { area: 'พื้นที่ทรัพย์', land: 'ขนาดที่ดิน', floor: 'รับน้ำหนักพื้น', height: 'ความสูง', power: 'ระบบไฟฟ้า', rent: 'ค่าเช่า/เดือน', rentSqm: 'ค่าเช่า/ตร.ม.', sale: 'ราคาขาย', deposit: 'เงินประกัน', advance: 'ชำระล่วงหน้า', term: 'ระยะสัญญา' },
  },
  faq: {
    searchPlaceholder: 'ค้นหาคำถาม…', noResults: 'ไม่พบคำถามที่ตรงกับคำค้น', copied: 'คัดลอกแล้ว', copyQuestion: 'คัดลอกคำถาม',
    hero: 'คำถามที่พบบ่อย', heroSub: 'รวมคำตอบเกี่ยวกับการเช่า การขาย เอกสาร และการจดทะเบียนอสังหาริมทรัพย์อุตสาหกรรม',
    categories: 'หมวดหมู่', stillStuck: 'ยังหาคำตอบไม่เจอ?', stillStuckSub: 'ทีมงานของเราพร้อมช่วยตอบคำถามทุกข้อสงสัย ติดต่อเราได้ที่นี่', heroAlt: 'ภาพเมืองและย่านอุตสาหกรรม',
    share: 'แชร์',
  },
  titles: {
    faq: 'คำถามที่พบบ่อย', listing: 'อสังหาริมทรัพย์ทั้งหมด',
    factoryRent: 'โรงงานให้เช่า', factorySale: 'โรงงานสำหรับขาย',
    warehouseRent: 'โกดังให้เช่า', warehouseSale: 'โกดังสำหรับขาย',
    airportDonmuang: 'ทรัพย์ใกล้สนามบินดอนเมือง', airportSuvarnabhumi: 'ทรัพย์ใกล้สนามบินสุวรรณภูมิ',
    bangkokCbd: 'ทรัพย์ในกรุงเทพฯ', bangkokNonthaburi: 'ทรัพย์ในนนทบุรี',
    portLaemChabang: 'ทรัพย์ใกล้ท่าเรือแหลมฉบัง', portMahachai: 'ทรัพย์ใกล้ท่าเรือมหาชัย',
    portMapTaPhut: 'ทรัพย์ใกล้ท่าเรือมาบตาพุด',
  },
  form: {
    name: 'ชื่อผู้ติดต่อ', phone: 'เบอร์โทรศัพท์', email: 'อีเมล', company: 'บริษัท / องค์กร',
    message: 'รายละเอียดเพิ่มเติม', submit: 'ส่งความต้องการ', sending: 'กำลังส่ง…',
    required: 'จำเป็น', success: 'ส่งความต้องการแล้ว',
    successBody: 'ทีมงาน JKP Property ได้รับข้อมูลของคุณแล้ว และจะติดต่อกลับโดยเร็วที่สุด',
    errName: 'กรุณากรอกชื่อของคุณ',
    errPhone: 'กรุณากรอกเบอร์โทรศัพท์ เพื่อให้ทีมงานติดต่อกลับได้',
    errRespondent: 'กรุณาเลือกสถานะของผู้ตอบแบบสอบถาม',
  },
};

const en: Dictionary = {
  nav: {
    home: 'Home', listing: 'Properties', about: 'About us', faq: 'FAQ',
    contact: 'Contact', contactTeam: 'Contact the team',
    forRent: 'For rent', forSale: 'For sale', factory: 'Factories', warehouse: 'Warehouses',
    factoryRent: 'Factories for rent', factorySale: 'Factories for sale',
    warehouseRent: 'Warehouses for rent', warehouseSale: 'Warehouses for sale',
    chooseLanguage: 'Choose language', menu: 'Menu',
  },
  common: {
    address: 'Bangkok, Thailand', search: 'Search', viewDetail: 'View details', viewAll: 'View all', showAll: 'Show all',
    contactUs: 'Contact us', perMonth: '/ month', sqm: 'sqm', priceOnRequest: 'Price on request',
    loading: 'Loading…', backToHome: 'Back to home', language: 'Language', price: 'Price',
    apply: 'Apply', clear: 'Clear', home: 'Home', noPhoto: 'No photo yet', confirm: 'Confirm', million: 'million',
  },
  hero: {
    headline1: 'Find industrial property', headline2: 'and factories across Thailand',
    headlineTail: 'that fits your business',
    sub: 'Factories and warehouses for rent and sale nationwide, each one checked and screened by our team.',
    searchPlaceholder: 'Search by area, province or property code…',
    filters: 'Search filters', moreFilters: 'More filters', propertyType: 'Property type',
    size: 'Floor area', priceRange: 'Price range', zone: 'Zone', zoneColor: 'Zoning colour', features: 'Features',
    floorLoading: 'Floor loading',
  },
  featured: {
    eyebrow: 'New listings', heading: 'Latest properties',
    sub: 'Verified industrial property, updated every week.',
    emptyTitle: 'No properties published yet',
    emptyBody: 'Published listings appear here. Tell us what you are looking for and we will get in touch when something fits.',
  },
  locations: {
    eyebrow: 'Strategic locations', heading: 'Find the right location for your business', seeInArea: 'See properties in this area', properties: 'properties',
    available: 'Available in this area', results: 'listings',
    avgDistance: 'Average distance to key infrastructure', topProvinces: 'Main provinces', inArea: 'in',
    unsureTitle: 'Not sure yet? Let us suggest a location that fits.',
    adviceHeading: 'Tell us your requirements and our team will recommend the industrial zones that suit you best.',
    adviceBody: 'What matters most to you?',
    adviceQuestion: 'What matters most to you?',
    adviceCta: 'Get a free location recommendation', getAdvice: 'Ask for advice',
    contactExpert: 'Talk to one of our specialists', mapAlt: 'Map of Thailand',
  },
  steps: {
    eyebrow: 'How it works', heading: 'Find a property in four steps',
    sub: 'From your first brief to signing, we keep every step smooth and predictable.', step: 'Step',
    items: [
      { title: 'Tell us what you need', desc: 'Share the floor area, location, budget and any conditions that matter.' },
      { title: 'Get a shortlist', desc: 'Our specialists select the properties that fit and send you the options.' },
      { title: 'Arrange a site visit', desc: 'We coordinate the viewing and take you to the property at a time that suits you.' },
      { title: 'Close with confidence', desc: 'We handle the contract and the legal paperwork through to completion.' },
    ],
  },
  whyUs: {
    eyebrow: 'Why choose us', heading: 'Why clients choose JKP',
    sub: 'Foreign investors and Thai property owners both rely on us — for the expertise, the transparency, and the technology that keeps a deal moving.',
    years: ' years', satisfaction: 'We stay with you from shortlist to signature',
    kpis: ['Properties published', 'Provinces covered', 'Last updated'],
    items: [
      { title: 'Licensed and accredited', desc: 'Registered with the DBD and a TREBA member, with real experience in industrial deals.' },
      { title: 'Multilingual service', desc: 'We work in Chinese, English and Thai, closing the language and culture gap.' },
      { title: 'Both sides understood', desc: 'We see it from the owner’s side and the tenant’s, and negotiate fairly for both.' },
      { title: 'Every listing verified', desc: 'We work directly with developers and owners, and check the title documents and availability before a property goes up.' },
      { title: 'Transparent pricing', desc: 'No mark-up over the owner’s price, so tenants and buyers know where they stand.' },
      { title: 'Technology-driven', desc: 'Automation and AI tools let us respond quickly, accurately and on brief.' },
    ],
  },
  certs: {
    eyebrow: 'Credentials', heading: 'Licences and oversight', verified: 'Verified',
    sub: 'We work to professional standards, with every step open to scrutiny.',
    items: [
      { name: 'TREBA', tag: 'Professional association member', desc: 'A member of the Thai Real Estate Broker Association, bound by its code of conduct and professional standards.' },
      { name: 'DBD', tag: 'Legally registered', desc: 'Registered with the Department of Business Development, Ministry of Commerce, and operating transparently.' },
      { name: 'Professional standards', tag: 'Trained and certified', desc: 'Our brokers have completed accredited real-estate training and worked real industrial deals.' },
    ],
  },
  trust: { eyebrow: 'Client results', heading: 'Businesses across Thailand that trust us', happyClients: 'Businesses we have helped find space' },
  cta: {
    free: 'Free, no obligation', freeShort: 'Free consultation', eyebrow: 'Free, no obligation',
    headline: 'Looking for the right factory or warehouse? ', headlineAccent: 'Let us help.',
    sub: 'Our specialists shortlist the properties that fit your brief and stay with you from search to signing.',
    primary: 'Book a free consultation', call: 'Call now',
    teamCount: 'A team of 12 specialists', teamNote: 'with you at every step',
    photoAlt: 'The JKP Property team',
  },
  footer: {
    company: 'Company', services: 'Services', properties: 'Properties', contact: 'Contact details',
    articles: 'Articles', industrialLand: 'Industrial land',
    terms: 'Terms of use', privacy: 'Privacy policy',
    rights: '© 2026 JKP PROPERTY. All rights reserved.',
    tagline: 'An industrial factory and warehouse brokerage, connecting investors with vetted property across Thailand.',
  },
  floating: { backToTop: 'Back to top' },
  consent: {
    title: 'Cookies and privacy',
    body: 'This site runs no visitor analytics, no advertising cookies and no cross-site tracking. The one thing we have to ask about is two maps drawn by other people: the location map on the home page (CARTO / OpenStreetMap) and the Google map embedded on our contact page.',
    noTracking: 'Declining changes nothing else about how the site works.',
    manage: 'Manage settings', rejectOptional: 'Reject optional', acceptAll: 'Accept all',
    save: 'Save settings', back: 'Back',
    necessary: 'Strictly necessary', necessaryBody: 'Keeps a staff member signed in to the admin area, remembers the properties you hearted, and stores this choice. All of it stays in your own browser.', always: 'Always on',
    embeds: 'Maps from elsewhere', embedsBody: 'Shows the location map on the home page (CARTO / OpenStreetMap) and the embedded Google map on the contact page. With this off we load neither, and the "open in Google Maps" link still works.',
    on: 'On', off: 'Off',
    cookiePolicy: 'Cookie Policy', privacyPolicy: 'Privacy Policy', settings: 'Cookie settings',
    mapBlocked: 'Map not loaded',
    mapBlockedBody: 'This map is drawn by someone else, and loading it hands them your IP address. It loads only if you allow it.',
    mapAllow: 'Show the map',
  },
  listing: {
    saved: 'Saved', totalArea: 'Total area', title: 'All properties', resultsFound: 'Found', results: 'listings',
    filters: 'Search filters', sortBy: 'Sort by:',
    zone: 'Location', type: 'Property type', size: 'Floor area', price: 'Price range',
    clear: 'Clear', search: 'Search',
    newest: 'Newest first', priceAsc: 'Price (low → high)', priceDesc: 'Price (high → low)',
    sizeAsc: 'Size (small → large)', sizeDesc: 'Size (large → small)',
    copyLink: 'Copy link', email: 'Email',
    prevPage: 'Previous page', nextPage: 'Next page', pageN: 'Page',
    zoomClose: 'Close', zoomPrev: 'Previous photo', zoomNext: 'Next photo',
    taken: 'Not available', takenNote: 'This property is already taken — contact us for similar ones.', 
    noSavedTitle: 'Nothing saved yet', noSavedBody: 'Tap the heart on a property you like, then come back here to find it again', showAll: 'Show all properties',
    empty: 'No properties match these filters', emptyHint: 'Adjust the filters, or press "Clear" to see everything.',
    emptyTitle: 'No properties published yet', emptyBody: 'Published listings appear here.',
  },
  property: {
    code: 'Property code', specs: 'Property details', features: 'Features', usage: 'Suitable uses',
    zoneType: 'Zoning', location: 'Location', nearby: 'Nearby',
    similar: 'Similar properties', openInMaps: 'Open this area in Google Maps',
    areaLevelNote: 'Shown at area level for privacy',
    priceRent: 'Rent', priceSale: 'Sale price',
    updatedAt: 'Last updated', notGuaranteed: 'Price and availability are not guaranteed — please confirm with us.',
    noPhotos: 'No photos for this property yet', photos: 'photos',
  },
  share: {
    copy: 'Copy link', email: 'Email', wechat: 'WeChat',
    wechatHint: 'Open WeChat and scan this to open the page',
    back: 'Back',
  },
  inquiry: {
    heading: 'Request more information', hours: 'Our sales team is available Mon–Fri, 9:00–18:00',
    orFillIn: 'or use the form', contactVia: 'Contact via ',
    interestedIn: 'Enquiry about', wantMore: '— please send more information.',
    namePh: 'Your name', emailPh: 'Email', phonePh: 'Phone number',
    send: 'Send enquiry', sent: 'Sent', sending: 'Sending…',
    failed: 'That did not go through. Please try again, or call us.',
    sentNote: 'We have your enquiry and will be in touch shortly.',
  },
  about: {
    hero: 'About us', breadcrumb: 'About us',
    storyEyebrow: 'Founded', storyHeading: 'Our story',
    storyBody: 'JKP Property was founded to be a broker that both sides can rely on — investors looking for industrial space, and the owners who hold it. We know the factory and warehouse market in depth, we vet every property before it is published, and we stay with the client from the first search through to signing, openly and fairly.',
    storyCaption: 'JKP Property · Founded by our partners',
    statFounded: 'Founded', statListings: 'Listings', statTeamYears: 'Team experience',
    statProvinces: 'Provinces covered', statUpdated: 'Last updated',
    pillars: [
      { title: 'Communication', desc: 'We work in Thai, English and Chinese — no language gap.' },
      { title: 'Track record', desc: 'A team that works only on industrial and logistics property.' },
      { title: 'Market knowledge', desc: 'We know the locations and the regulations in every province of Thailand.' },
    ],
    teamEyebrow: 'The team', teamHeading: 'Meet the team',
    teamSub: 'Industrial property specialists you can rely on, nationwide.',
    teamBlurb: 'A carefully chosen team of specialists in Thai industrial property. We combine local knowledge with hands-on service, and a breadth of experience that earns our clients\' trust.',
    awardEyebrow: 'Award', awardHeading: 'Best agent in industrial property',
    awardBody: 'JKP Property received the Best Agent in Industrial Property award from the Thai Real Estate Association — recognition of our commitment to quality of service and transparency in Thailand\'s industrial property market.',
    awardCaption: 'Founder · Bangkok – Chonburi',
    pressHeading: 'Featured in', pressEyebrow: 'Industry recognition',
  },
  contact: {
    hero: 'Contact us', sub: 'Get in touch about any of our properties.', breadcrumb: 'Contact',
    reachUs: 'Reach us at', ourPhone: 'Phone',
    salesEnquiry: 'Sales enquiries:', generalEnquiry: 'General enquiries:',
    ourLocation: 'Our office', contactAt: 'Contact us at:',
    hours: 'Opening hours', weekdays: 'Monday – Friday:', hoursValue: '9:00 – 18:00',
    address: '41/6 Moo 7, Bangna-Trad Rd km 16.5, Bang Chalong, Bang Phli, Samut Prakan 10540 (head office)',
    langNote: '(English / Thai)',
    openInMaps: 'Open in Google Maps', mapMissing: 'No location set yet — add the coordinates under CMS › Sections › Contact.',
  },
  requirement: {
    heading: 'Tell us what you need',
    sub: 'Pick the type of property, fill in only what matters — our team will get back to you.',
    respondentStatus: 'You are', agent: 'An agent', customer: 'A client (tenant)',
    choose: 'Select…', wanted: 'Required', notSpecified: 'Not specified',
    company: 'Company / organisation', companyPh: 'e.g. Thai Logistics Co.',
    namePh: 'Your name', details: 'Additional details',
    detailsPh: 'Tell us more about what you are looking for…', sent: 'Enquiry sent',
  },
  clientShortlist: {
    badge: 'Private link · no sign-in needed', forCustomer: 'Selected for', clientLogo: 'Client logo', picked: 'Your shortlist',
    heading: 'Properties that match what you asked for',
    sub: 'Our team picked these against your criteria and confirmed each one is still free — tell us what you think of each so we can arrange the viewings.',
    criteria: 'Requirements:', cards: 'Cards', compare: 'Comparison',
    yourOpinion: 'What you think', interested: 'Interested', undecided: 'Not sure yet', notInterested: 'Not for us',
    saveFailed: 'Could not send your answer — please try again', viewDetail: 'View details', available: 'Available',
    detail: 'Detail', photo: 'Photo', opinion: 'Your answer',
    askMore: 'Ask us anything, or book a viewing', call: 'Call', emailUs: 'Email the team',
    notFound: 'This shortlist was not found, or the link has expired', notFoundBody: 'Please contact JKP Property for a new link',
    footer: 'Prices and availability can change — we confirm both again before a viewing · Powered by JKP Property',
    sentOn: 'Sent', defaultName: 'Your shortlist', rentOnly: 'For rent only', giveOpinion: 'Tell us',
    emailSubject: 'Request a viewing',
    needsRor4: 'Ror. 4 licence needed', nearPort: 'Near a port',
    rows: { area: 'Floor area', land: 'Land size', floor: 'Floor loading', height: 'Clear height', power: 'Power supply', rent: 'Rent / month', rentSqm: 'Rent / sqm', sale: 'Sale price', deposit: 'Deposit', advance: 'Advance payment', term: 'Lease term' },
  },
  faq: {
    searchPlaceholder: 'Search the questions…', noResults: 'No questions match your search', copied: 'Copied', copyQuestion: 'Copy question',
    hero: 'Frequently asked questions', heroSub: 'Answers on renting, buying, paperwork and registering industrial property.',
    categories: 'Categories', stillStuck: 'Still no answer?', stillStuckSub: 'Our team is happy to work through anything that is not covered here — get in touch.', heroAlt: 'City and industrial district',
    share: 'Share',
  },
  titles: {
    faq: 'Frequently asked questions', listing: 'All properties',
    factoryRent: 'Factories for rent', factorySale: 'Factories for sale',
    warehouseRent: 'Warehouses for rent', warehouseSale: 'Warehouses for sale',
    airportDonmuang: 'Property near Don Mueang Airport', airportSuvarnabhumi: 'Property near Suvarnabhumi Airport',
    bangkokCbd: 'Property in Bangkok', bangkokNonthaburi: 'Property in Nonthaburi',
    portLaemChabang: 'Property near Laem Chabang Port', portMahachai: 'Property near Mahachai Port',
    portMapTaPhut: 'Property near Map Ta Phut Port',
  },
  form: {
    name: 'Contact name', phone: 'Phone number', email: 'Email', company: 'Company',
    message: 'Additional details', submit: 'Send enquiry', sending: 'Sending…',
    required: 'required', success: 'Enquiry sent',
    successBody: 'The JKP Property team has received your details and will be in touch shortly.',
    errName: 'Please enter your name',
    errPhone: 'Please enter a phone number so our team can call you back',
    errRespondent: 'Please tell us whether you are an agent or a client',
  },
};

const zh: Dictionary = {
  nav: {
    home: '首页', listing: '房源', about: '关于我们', faq: '常见问题',
    contact: '联系我们', contactTeam: '联系团队',
    forRent: '出租', forSale: '出售', factory: '工厂', warehouse: '仓库',
    factoryRent: '工厂出租', factorySale: '工厂出售',
    warehouseRent: '仓库出租', warehouseSale: '仓库出售',
    chooseLanguage: '选择语言', menu: '菜单',
  },
  common: {
    address: '泰国曼谷', search: '搜索', viewDetail: '查看详情', viewAll: '查看全部', showAll: '显示全部',
    contactUs: '联系我们', perMonth: '/ 月', sqm: '平方米', priceOnRequest: '价格面议',
    loading: '加载中…', backToHome: '返回首页', language: '语言', price: '价格',
    apply: '应用', clear: '清除', home: '首页', noPhoto: '暂无照片', confirm: '确认', million: '百万',
  },
  hero: {
    headline1: '寻找泰国工业地产', headline2: '与厂房资源',
    headlineTail: '找到适合您的那一处',
    sub: '汇集全泰国出租与出售的厂房和仓库，每一处均经过团队核验筛选。',
    searchPlaceholder: '按地区、府或房源编号搜索…',
    filters: '搜索筛选', moreFilters: '更多筛选', propertyType: '房源类型',
    size: '建筑面积', priceRange: '价格区间', zone: '区域', zoneColor: '城市规划分区颜色', features: '设施特点',
    floorLoading: '楼板承重',
  },
  featured: {
    eyebrow: '最新房源', heading: '最新上架房源',
    sub: '经过核验的优质工业地产，每周更新。',
    emptyTitle: '暂无已发布房源',
    emptyBody: '已发布的房源会显示在这里。欢迎先告知您的需求，有合适房源我们会主动联系。',
  },
  locations: {
    eyebrow: '战略区位', heading: '找到适合您业务的区位', seeInArea: '查看该区域房源', properties: '个房源',
    available: '该区域可选房源', results: '个',
    avgDistance: '到主要枢纽的平均距离', topProvinces: '主要府', inArea: '位于',
    unsureTitle: '还不确定？让我们为您推荐合适的区位。',
    adviceHeading: '告诉我们您的需求，我们的团队会推荐最合适的工业区。',
    adviceBody: '您最看重哪一点？',
    adviceQuestion: '您最看重哪一点？',
    adviceCta: '免费获取选址建议', getAdvice: '咨询建议',
    contactExpert: '联系我们的专家', mapAlt: '泰国地图',
  },
  steps: {
    eyebrow: '服务流程', heading: '四步找到合适房源',
    sub: '从提出需求到签约成交，每一步我们都协助您顺利完成。', step: '步骤',
    items: [
      { title: '告诉我们您的需求', desc: '说明所需面积、区位、预算以及其他条件。' },
      { title: '收到精选清单', desc: '专业团队筛选合适房源，并把可选方案发送给您。' },
      { title: '预约实地看房', desc: '我们安排看房行程，在您方便的时间陪同实地查看。' },
      { title: '安心成交', desc: '合同与法律文件由我们全程跟进，直至手续完成。' },
    ],
  },
  whyUs: {
    eyebrow: '为什么选择我们', heading: '客户选择 JKP 的理由',
    sub: '外国投资者与泰国业主都信赖我们——凭借专业能力、透明作风，以及让每笔交易顺利推进的技术支持。',
    years: ' 年', satisfaction: '从筛选房源到签约全程陪同',
    kpis: ['已发布房源', '覆盖府数', '最近更新'],
    items: [
      { title: '合法注册并具备资质', desc: '已在 DBD 注册并为 TREBA 会员，具备真实的工业地产成交经验。' },
      { title: '多语种服务', desc: '可用中文、英文和泰文沟通，减少语言与文化上的障碍。' },
      { title: '兼顾业主与租户', desc: '同时理解业主与租户的立场，公平谈判，实现双赢。' },
      { title: '每一条房源都经过核实', desc: '与开发商及业主直接合作，上架前核对产权文件与可租售状态。' },
      { title: '价格透明', desc: '不在业主报价上加价，让租户与买家心里有数。' },
      { title: '技术驱动', desc: '自动化系统与 AI 工具让我们响应更快、更准、更贴合需求。' },
    ],
  },
  certs: {
    eyebrow: '资质与信誉', heading: '执照与监管', verified: '已核实',
    sub: '我们按照专业标准运作，每一个环节都可追溯核查。',
    items: [
      { name: 'TREBA', tag: '行业协会会员', desc: '泰国房地产经纪协会会员，遵守协会的职业道德与专业标准。' },
      { name: 'DBD', tag: '依法注册', desc: '已在商业部商业发展厅注册，经营公开透明。' },
      { name: '专业标准', tag: '受训并获认证', desc: '经纪团队均完成房地产专业培训，并有真实的工业地产成交经验。' },
    ],
  },
  trust: { eyebrow: '客户成果', heading: '泰国各地信赖我们的企业', happyClients: '我们协助过的企业' },
  cta: {
    free: '免费咨询，无需付费', freeShort: '免费咨询', eyebrow: '免费咨询，无需付费',
    headline: '正在寻找合适的厂房或仓库？', headlineAccent: '让我们来帮您。',
    sub: '由我们的专业团队筛选最符合需求的房源，从寻找到签约全程协助。',
    primary: '立即免费咨询', call: '马上致电',
    teamCount: '12 位专业顾问', teamNote: '全程为您服务',
    photoAlt: 'JKP Property 团队',
  },
  footer: {
    company: '公司', services: '服务', properties: '房源', contact: '联系方式',
    articles: '文章', industrialLand: '工业用地',
    terms: '使用条款', privacy: '隐私政策',
    rights: '© 2026 JKP PROPERTY. 版权所有',
    tagline: '工业厂房与仓库经纪平台，为投资者对接全泰国经过筛选的优质房源。',
  },
  floating: { backToTop: '返回顶部' },
  consent: {
    title: 'Cookie 与隐私',
    body: '本网站没有访客分析、没有广告 Cookie，也没有跨站追踪。唯一需要征得同意的，是两处由第三方提供的地图：首页的区位地图（CARTO / OpenStreetMap），以及"联系我们"页面内嵌的 Google 地图。',
    noTracking: '选择拒绝不会影响网站其他功能的使用。',
    manage: '管理设置', rejectOptional: '拒绝非必要', acceptAll: '全部接受',
    save: '保存设置', back: '返回',
    necessary: '必要功能', necessaryBody: '用于保持管理人员的后台登录状态、记住您收藏的房源，以及保存本次同意选项。以上内容均仅存放在您自己的浏览器中。', always: '始终开启',
    embeds: '外部地图', embedsBody: '显示首页的区位地图（CARTO / OpenStreetMap）与联系页面内嵌的 Google 地图。关闭后两者均不加载，"在 Google 地图中打开"的链接仍可正常使用。',
    on: '开启', off: '关闭',
    cookiePolicy: 'Cookie 政策', privacyPolicy: '隐私政策', settings: 'Cookie 设置',
    mapBlocked: '地图尚未加载',
    mapBlockedBody: '该地图由第三方提供，加载时会将您的 IP 地址发送给服务商，仅在您允许后才会加载。',
    mapAllow: '显示地图',
  },
  listing: {
    saved: '已保存', totalArea: '总面积', title: '全部房源', resultsFound: '共找到', results: '个房源',
    filters: '搜索筛选', sortBy: '排序：',
    zone: '地区', type: '房源类型', size: '建筑面积', price: '价格区间',
    clear: '清除', search: '搜索',
    newest: '最新优先', priceAsc: '价格（低 → 高）', priceDesc: '价格（高 → 低）',
    sizeAsc: '面积（小 → 大）', sizeDesc: '面积（大 → 小）',
    copyLink: '复制链接', email: '电子邮件',
    prevPage: '上一页', nextPage: '下一页', pageN: '第',
    zoomClose: '关闭', zoomPrev: '上一张', zoomNext: '下一张',
    taken: '已租/已售', takenNote: '此房源已被承租或售出，欢迎联系我们查看同类房源。', 
    noSavedTitle: '还没有收藏的房源', noSavedBody: '点击房源上的爱心图标收藏，之后回到这里即可查看', showAll: '查看全部房源',
    empty: '没有符合条件的房源', emptyHint: '请调整筛选条件，或点击“清除”查看全部。',
    emptyTitle: '暂无已发布房源', emptyBody: '已发布的房源会显示在这里。',
  },
  property: {
    code: '房源编号', specs: '房源详情', features: '设施特点', usage: '适用用途',
    zoneType: '城市规划分区', location: '位置', nearby: '周边设施',
    similar: '相似房源', openInMaps: '在 Google 地图中查看该区域',
    areaLevelNote: '出于隐私考虑仅显示到区域级别',
    priceRent: '租金', priceSale: '售价',
    updatedAt: '最近更新', notGuaranteed: '价格与状态不作保证，请再次向我们确认。',
    noPhotos: '该房源暂无照片', photos: '张照片',
  },
  share: {
    copy: '复制链接', email: '电子邮件', wechat: '微信',
    wechatHint: '打开微信扫一扫，即可打开本页',
    back: '返回',
  },
  inquiry: {
    heading: '索取更多资料', hours: '销售团队服务时间：周一至周五 9:00–18:00',
    orFillIn: '或填写表单', contactVia: '通过以下方式联系 ',
    interestedIn: '咨询房源', wantMore: '，希望了解更多信息。',
    namePh: '您的姓名', emailPh: '电子邮箱', phonePh: '电话号码',
    send: '发送咨询', sent: '已发送', sending: '发送中…',
    failed: '发送失败，请重试，或直接致电我们。',
    sentNote: '我们已收到您的咨询，会尽快与您联系。',
  },
  about: {
    hero: '关于我们', breadcrumb: '关于我们',
    storyEyebrow: '成立', storyHeading: '我们的故事',
    storyBody: 'JKP Property 成立的目的，是在寻找工业厂房的投资者与持有物业的业主之间，做一个双方都能信赖的中介。我们深入了解泰国的厂房与仓库市场，每一处房源在发布前都经过核验，并从初次寻找一路陪伴客户到签约，全程公开、公平。',
    storyCaption: 'JKP Property · 由创始团队创立',
    statFounded: '成立年份', statListings: '在库房源', statTeamYears: '团队经验',
    statProvinces: '覆盖府数', statUpdated: '最近更新',
    pillars: [
      { title: '沟通无碍', desc: '可用泰文、英文与中文沟通，没有语言隔阂。' },
      { title: '可靠履历', desc: '专注工业与物流地产的团队。' },
      { title: '市场理解', desc: '熟悉泰国各府的区位条件与法规要求。' },
    ],
    teamEyebrow: '团队', teamHeading: '认识我们的团队',
    teamSub: '值得信赖的泰国工业地产专业团队。',
    teamBlurb: '一支经过精心挑选的泰国工业地产专业团队。我们兼具在地了解与实务服务经验，以扎实的工作积累赢得客户信任。',
    awardEyebrow: '奖项', awardHeading: '最佳工业地产经纪',
    awardBody: 'JKP Property 获得泰国房地产协会颁发的「最佳工业地产经纪」奖，肯定我们在泰国工业地产市场对服务品质与透明度的坚持。',
    awardCaption: '创始人 · 曼谷 – 春武里',
    pressHeading: '媒体报道', pressEyebrow: '行业认可',
  },
  contact: {
    hero: '联系我们', sub: '欢迎就任何房源与我们联系。', breadcrumb: '联系我们',
    reachUs: '联系方式', ourPhone: '联系电话',
    salesEnquiry: '销售咨询：', generalEnquiry: '一般咨询：',
    ourLocation: '办公地址', contactAt: '联系我们：',
    hours: '营业时间', weekdays: '周一至周五：', hoursValue: '9:00 – 18:00',
    address: '41/6 Moo 7, Bangna-Trad Rd km 16.5, Bang Chalong, Bang Phli, Samut Prakan 10540（总部）',
    langNote: '（英文 / 泰文）',
    openInMaps: '在 Google 地图中打开', mapMissing: '尚未设置坐标 — 请在 CMS › 页面区块 › 联系我们 中填写。',
  },
  requirement: {
    heading: '提交需求',
    sub: '选择房源类型，只需填写必要信息 — 我们的团队会与您联系。',
    respondentStatus: '您的身份', agent: '中介代理', customer: '客户（承租方）',
    choose: '请选择…', wanted: '需要', notSpecified: '不限',
    company: '公司 / 机构名称', companyPh: '例如：泰国物流有限公司',
    namePh: '您的姓名', details: '补充说明',
    detailsPh: '请告诉我们更多您的需求…', sent: '已提交需求',
  },
  clientShortlist: {
    badge: '专属链接 · 无需登录', forCustomer: '为您精选', clientLogo: '客户标识', picked: '为您筛选的房源',
    heading: '符合您需求的房源',
    sub: 'JKP Property 团队按您的条件筛选，并已确认每一处目前仍可租售 — 请对每处给出意见，方便我们安排看房。',
    criteria: '需求条件：', cards: '卡片', compare: '对比表',
    yourOpinion: '您的意见', interested: '有兴趣', undecided: '尚未决定', notInterested: '不合适',
    saveFailed: '提交失败 — 请再试一次', viewDetail: '查看详情', available: '可租售',
    detail: '项目', photo: '照片', opinion: '您的意见',
    askMore: '如需咨询或安排看房，请随时联系', call: '致电', emailUs: '邮件联系团队',
    notFound: '未找到此清单，或链接已失效', notFoundBody: '请联系 JKP Property 索取新链接',
    footer: '价格与可租售状态可能变动 — 看房前我们会再次确认 · Powered by JKP Property',
    sentOn: '发送于', defaultName: '为您甄选的物业', rentOnly: '仅出租', giveOpinion: '给出意见',
    emailSubject: '预约看房',
    needsRor4: '需要 ร.ง.4 工厂许可证', nearPort: '靠近港口',
    rows: { area: '建筑面积', land: '土地面积', floor: '楼板承重', height: '净高', power: '供电', rent: '月租金', rentSqm: '每平方米租金', sale: '售价', deposit: '押金', advance: '预付款', term: '租期' },
  },
  faq: {
    searchPlaceholder: '搜索问题…', noResults: '没有符合搜索条件的问题', copied: '已复制', copyQuestion: '复制问题',
    hero: '常见问题', heroSub: '关于租赁、购买、文件与工业地产登记的解答。',
    categories: '分类', stillStuck: '还没找到答案？', stillStuckSub: '这里没写到的问题，欢迎直接联系我们的团队。', heroAlt: '城市与工业区',
    share: '分享',
  },
  titles: {
    faq: '常见问题', listing: '全部房源',
    factoryRent: '厂房出租', factorySale: '厂房出售',
    warehouseRent: '仓库出租', warehouseSale: '仓库出售',
    airportDonmuang: '廊曼机场周边房源', airportSuvarnabhumi: '素万那普机场周边房源',
    bangkokCbd: '曼谷房源', bangkokNonthaburi: '暖武里房源',
    portLaemChabang: '林查班港周边房源', portMahachai: '马哈猜港周边房源',
    portMapTaPhut: '马达普港周边房源',
  },
  form: {
    name: '联系人姓名', phone: '电话号码', email: '电子邮箱', company: '公司名称',
    message: '补充说明', submit: '提交需求', sending: '提交中…',
    required: '必填', success: '已提交',
    successBody: 'JKP Property 团队已收到您的信息，我们会尽快与您联系。',
    errName: '请填写您的姓名',
    errPhone: '请填写电话号码，以便我们的团队与您联系',
    errRespondent: '请选择您的身份',
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { th, en, zh };

export const getDictionary = (locale: Locale): Dictionary => DICTIONARIES[locale] ?? th;
