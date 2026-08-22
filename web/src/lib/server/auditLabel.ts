/* บรรทัดกิจกรรมบนหน้า Dashboard เคยขึ้นชื่อ action ดิบกับรหัสภายใน เช่น
     กิตติพงษ์ พรหมทอง  media.delete  mediaAsset/cmt49p88x0000od0179vbbvse
   ซึ่งคนใช้งานอ่านไม่รู้เรื่อง และรหัสก็กดไปไหนไม่ได้ ไฟล์นี้แปลเป็นคำไทย
   แยกจาก dashboard.ts เพื่อให้เทสต์เรียกได้โดยไม่ต้องต่อฐานข้อมูล
   หมายเหตุ: หน้า Audit log ยังโชว์ของดิบไว้เหมือนเดิม เพราะเป็นหลักฐาน */
/* คำกริยาที่ระบบบันทึกไว้ → คำไทยที่คนอ่านรู้เรื่อง
   ไม่รู้จักก็คืนของเดิม ดีกว่าเดาผิดหรือขึ้นว่าง */
const VERB: Record<string, string> = {
  create: 'สร้าง', update: 'แก้ไข', delete: 'ลบ', save: 'บันทึก',
  upload: 'อัปโหลด', login: 'เข้าสู่ระบบ', logout: 'ออกจากระบบ',
  confirm: 'ยืนยัน', cancel: 'ยกเลิก', reopen: 'เปิดใหม่', publish: 'เผยแพร่',
  send: 'ส่ง', close: 'ปิด', unlock: 'ปลดล็อก', transfer: 'โอนสิทธิ์',
  task: 'งานติดตาม', auto_advance: 'เลื่อนสถานะอัตโนมัติ',
  availability: 'เช็คว่าง', reveal: 'ขอดูข้อมูลติดต่อ', invite: 'เชิญผู้ใช้',
};
/* ครอบคลุมทั้งชื่อ entity ที่บันทึกจริง (คอลัมน์ entity) และคำนำหน้า action */
const ENTITY: Record<string, string> = {
  property: 'ทรัพย์', listing: 'ประกาศ', lead: 'lead', requirement: 'requirement',
  shortlist: 'shortlist', visit: 'แผนเข้าชม', deal: 'ดีล',
  mediaAsset: 'ไฟล์สื่อ', media: 'ไฟล์สื่อ', user: 'ผู้ใช้', auth: 'บัญชี',
  cms: 'เนื้อหา', cmsPage: 'หน้าเนื้อหา', pageSection: 'เนื้อหาหน้าเว็บ',
  sections: 'เนื้อหาหน้าเว็บ', geography: 'พื้นที่', geoItem: 'พื้นที่',
  fieldSchema: 'ชุดฟิลด์', fieldOverride: 'ชุดฟิลด์', company: 'ข้อมูลบริษัท',
  companyProfile: 'ข้อมูลบริษัท', branding: 'แบรนด์', social: 'Social Status',
  socialChannel: 'ช่องทาง Social', lease: 'สัญญาเช่า', session: 'บัญชี',
  seoFile: 'ไฟล์ SEO', org: 'องค์กร',
};

/* บาง action ประกอบคำแล้วอ่านแปลก ('เข้าสู่ระบบ บัญชี') จึงเขียนเต็มไว้เลย */
const FULL: Record<string, string> = {
  'auth.login': 'เข้าสู่ระบบ', 'auth.logout': 'ออกจากระบบ',
  'auth.login_failed': 'เข้าสู่ระบบไม่สำเร็จ', 'auth.password': 'เปลี่ยนรหัสผ่าน',
  'lead.task': 'เพิ่มงานติดตาม', 'lead.auto_advance': 'ระบบเลื่อนสถานะ lead',
  'requirement.availability': 'เช็คว่างกับเจ้าของ',
  'deal.unlock': 'ปลดล็อกข้อมูลดีล',
};

/** ('property.update', 'property') → 'แก้ไขทรัพย์'
 *  ('lead.task.delete', 'lead')    → 'ลบงานติดตาม lead'
 *  ('cms.delete', 'cmsPage')       → 'ลบหน้าเนื้อหา'
 *  entity ใช้เป็นตัวสำรองเมื่อคำนำหน้า action ไม่รู้จัก และช่วยให้ได้คำที่ตรงกว่า */
export function actionLabel(raw: string, entity = ''): string {
  if (FULL[raw]) return FULL[raw];
  const parts = raw.split('.');
  const noun = ENTITY[entity] ?? ENTITY[parts[0]] ?? (entity || parts[0]);
  const verb = VERB[parts[parts.length - 1]] ?? '';
  const mid = parts.length > 2 ? VERB[parts[1]] ?? '' : '';
  if (!verb) return raw;
  /* ไทยต่อกันได้เลย แต่คำที่ขึ้นต้นด้วยอักษรอังกฤษ (lead, shortlist) ต้องเว้นวรรค
     ไม่งั้นได้ 'ลบงานติดตามlead' */
  const gap = /^[\u0E00-\u0E7F]/.test(noun) ? '' : ' ';
  return [verb, mid].filter(Boolean).join('') + gap + noun;
}
