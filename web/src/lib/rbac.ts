/* ============================================================
   RBAC — roles, data scope, and per-user privileges.

   Three layers, deliberately separate:
     1. ROLE       — what actions the job involves
     2. SCOPE      — whose records you see (own / all), set per user
     3. PRIVILEGE  — sensitive extras toggled per user (PII, publish, …)

   Shaped for a single-branch agency with one sales team plus external
   co-agents, so there is no "team" scope tier and no approval workflow:
   an action is either granted or it is not.

   ⚠️ This module drives the ADMIN UI only. The same rules must be enforced
   at the API layer — see FRONTEND_API_SPEC.md §12.
   ============================================================ */

export type RoleKey = 'owner' | 'manager' | 'agent' | 'co_agent' | 'ops' | 'marketing' | 'translator';

/** whose records a user may read/act on */
export type Scope = 'own' | 'all';

/** sensitive capabilities granted per user on top of the role */
export type PrivKey = 'pii' | 'publish' | 'price' | 'deal_unlock' | 'internal_note' | 'export' | 'audit';

export type Role = {
  key: RoleKey;
  label: string;
  short: string; // column header in the matrix
  desc: string;
  intl: string; // equivalent title used internationally
  defaultScope: Scope;
  scopeLocked?: boolean; // scope cannot be changed (owner = all, co-agent = own)
  external?: boolean; // outside the company — needs an expiry date
  badge: { bg: string; fg: string };
};

export const ROLES: Role[] = [
  { key: 'owner', label: 'เจ้าของระบบ', short: 'Owner', intl: 'Principal / Broker of Record', desc: 'สิทธิ์สูงสุดทั้งระบบ รวมผู้ใช้ การตั้งค่า และการปลดล็อกดีล', defaultScope: 'all', scopeLocked: true, badge: { bg: '#273c33', fg: '#fff' } },
  { key: 'manager', label: 'ผู้จัดการ', short: 'Manager', intl: 'Sales Manager', desc: 'ดูแลภาพรวมงานขายทั้งหมด มอบหมายงาน ปิดดีล', defaultScope: 'all', badge: { bg: '#E8F3EC', fg: '#0D6C3B' } },
  { key: 'agent', label: 'เอเจนต์ขาย', short: 'Agent', intl: 'Agent / Negotiator', desc: 'ดูแลลูกค้าของตัวเอง ตั้งแต่ lead จนปิดดีล', defaultScope: 'own', badge: { bg: '#EEF4F3', fg: '#034956' } },
  { key: 'co_agent', label: 'Co-agent ภายนอก', short: 'Co-agent', intl: 'Co-broke / Referral Partner', desc: 'พาร์ตเนอร์นอกบริษัท เห็นเฉพาะงานที่แชร์ให้ · ต้องกำหนดวันหมดอายุ', defaultScope: 'own', scopeLocked: true, external: true, badge: { bg: '#FBF3E1', fg: '#9A741C' } },
  { key: 'ops', label: 'ธุรการ / ปฏิบัติการ', short: 'Ops', intl: 'Operations / Transaction Coordinator', desc: 'ข้อมูลทรัพย์ นัดชม เอกสาร สัญญาเช่า และการแจ้งเตือน', defaultScope: 'all', badge: { bg: '#EAF3F6', fg: '#1E5AA8' } },
  { key: 'marketing', label: 'การตลาด', short: 'Marketing', intl: 'Marketing Executive', desc: 'เว็บไซต์ เนื้อหา SEO สื่อ และการลงประกาศช่องทางต่างๆ', defaultScope: 'all', badge: { bg: '#F0ECF9', fg: '#7A3FB0' } },
  { key: 'translator', label: 'นักแปล', short: 'Translator', intl: 'Translator', desc: 'แปลเนื้อหาเป็น EN / 中文 เท่านั้น', defaultScope: 'all', badge: { bg: '#F0EEE9', fg: '#5F5A52' } },
];

export const role = (k: RoleKey) => ROLES.find((r) => r.key === k) || ROLES[0];

export const PRIVILEGES: { key: PrivKey; label: string; desc: string }[] = [
  { key: 'pii', label: 'เห็นเบอร์ / อีเมลลูกค้าเต็ม', desc: 'ค่าเริ่มต้นระบบจะปิดบังไว้ (081-xxx-8888) · การกดดูจะถูกบันทึกลง Audit log ตาม PDPA' },
  { key: 'publish', label: 'เผยแพร่ประกาศ / หน้าเว็บ', desc: 'ดันขึ้นหน้าเว็บสาธารณะ หรือถอดออก' },
  { key: 'price', label: 'แก้ราคาหลังเผยแพร่แล้ว', desc: 'แยกจากการแก้ข้อมูลทั่วไป เพราะกระทบราคาที่ประกาศไปแล้ว' },
  { key: 'deal_unlock', label: 'ปลดล็อกดีลที่ปิดแล้ว', desc: 'ควรให้เฉพาะระดับบริหาร — ป้องกันการแก้ยอดย้อนหลัง' },
  { key: 'internal_note', label: 'เห็นหมายเหตุลับของทรัพย์', desc: 'โน้ตภายในทีม เช่น เงื่อนไขต่อรอง เบอร์คนเฝ้า' },
  { key: 'export', label: 'ส่งออกข้อมูล (CSV)', desc: 'เฉพาะเจ้าของระบบเท่านั้น — การดึงข้อมูลออกนอกระบบพาข้อมูลลูกค้าออกไปด้วย' },
  { key: 'audit', label: 'ดู Audit log', desc: 'ประวัติการแก้ไขทั้งระบบ ใครทำอะไรเมื่อไหร่' },
];

/** สิทธิ์พิเศษที่เปิดให้อัตโนมัติเมื่อเลือกบทบาทนั้น */
export const DEFAULT_PRIVS: Record<RoleKey, PrivKey[]> = {
  owner: ['pii', 'publish', 'price', 'deal_unlock', 'internal_note', 'export', 'audit'],
  manager: ['pii', 'publish', 'price', 'internal_note'],
  agent: ['pii', 'internal_note'],
  co_agent: [],
  ops: ['pii', 'publish', 'internal_note'],
  marketing: ['publish'],
  translator: [],
};

/** สิทธิ์พิเศษที่ "ให้ไม่ได้" กับบทบาทนั้น (กันตั้งค่าผิด)
 *  `export` ห้ามทุกบทบาทยกเว้น owner — การดึงข้อมูลออกนอกระบบพาข้อมูลลูกค้าออกไปด้วย */
export const FORBIDDEN_PRIVS: Partial<Record<RoleKey, PrivKey[]>> = {
  manager: ['export'],
  agent: ['deal_unlock', 'audit', 'export'],
  co_agent: ['deal_unlock', 'audit', 'export', 'price', 'publish', 'internal_note'],
  marketing: ['deal_unlock', 'audit', 'pii', 'export'],
  translator: ['deal_unlock', 'audit', 'pii', 'price', 'export', 'internal_note'],
  ops: ['deal_unlock', 'audit', 'export'],
};

/* ---- permission matrix ------------------------------------------------
   'yes'    ทำได้
   'scope'  ทำได้ตามขอบเขตที่ตั้งไว้ (ของตัวเอง / ทั้งหมด)
   'read'   อ่านอย่างเดียว
   'priv'   ต้องเปิดสิทธิ์พิเศษให้ก่อน
   'no'     ไม่ได้
   ---------------------------------------------------------------------- */
export type Cell = 'yes' | 'scope' | 'read' | 'priv' | 'no';

export type MatrixRow = { action: string; note?: string; cells: Record<RoleKey, Cell> };
export type MatrixGroup = { group: string; rows: MatrixRow[] };

const row = (action: string, o: Partial<Record<RoleKey, Cell>>, note?: string): MatrixRow => ({
  action, note,
  cells: { owner: 'yes', manager: 'no', agent: 'no', co_agent: 'no', ops: 'no', marketing: 'no', translator: 'no', ...o },
});

export const MATRIX: MatrixGroup[] = [
  {
    group: 'ทรัพย์ & ประกาศ',
    rows: [
      row('ดูทรัพย์ / ประกาศ', { manager: 'yes', agent: 'yes', co_agent: 'scope', ops: 'yes', marketing: 'yes', translator: 'read' }),
      row('สร้าง / แก้ไขทรัพย์', { manager: 'yes', agent: 'scope', ops: 'yes' }),
      row('เผยแพร่ประกาศ', { manager: 'priv', agent: 'priv', ops: 'priv', marketing: 'priv' }),
      row('แก้ราคาหลังเผยแพร่', { manager: 'priv', agent: 'priv', ops: 'priv' }),
      row('เช็คสถานะว่าง (Availability)', { manager: 'yes', agent: 'yes', co_agent: 'scope', ops: 'yes' }),
      row('Social Status — ติ๊กช่องทาง / แก้ caption', { manager: 'yes', agent: 'scope', marketing: 'yes' }),
      row('คลังสื่อ (อัปโหลด / ลบ)', { manager: 'yes', agent: 'scope', ops: 'yes', marketing: 'yes' }),
    ],
  },
  {
    group: 'งานขาย & ลูกค้า',
    rows: [
      row('Leads / Requirements', { manager: 'scope', agent: 'scope', co_agent: 'scope', ops: 'scope' }),
      row('เห็นเบอร์ / อีเมลลูกค้าเต็ม', { manager: 'priv', agent: 'priv', ops: 'priv' }, 'ค่าเริ่มต้นปิดบัง · การเปิดดูถูกบันทึก (PDPA)'),
      row('Shortlists', { manager: 'scope', agent: 'scope', co_agent: 'scope', ops: 'scope' }),
      row('นัดชมทรัพย์ (Visits)', { manager: 'scope', agent: 'scope', co_agent: 'scope', ops: 'scope' }),
      row('ดีล (Deals)', { manager: 'scope', agent: 'scope', co_agent: 'read', ops: 'read' }),
      row('ปิดดีล', { manager: 'yes', agent: 'scope' }),
      row('ปลดล็อกดีลที่ปิดแล้ว', { manager: 'priv' }, 'ป้องกันการแก้ยอดย้อนหลัง'),
      row('หมายเหตุลับของทรัพย์', { manager: 'priv', agent: 'priv', ops: 'priv' }),
    ],
  },
  {
    group: 'สัญญาเช่า & แจ้งเตือน',
    rows: [
      row('สัญญาเช่า + แจ้งเตือนใกล้หมดอายุ', { manager: 'yes', agent: 'scope', ops: 'yes' }),
      row('ตั้งเกณฑ์แจ้งเตือน (1 / 2 / 3 เดือน)', { manager: 'yes', ops: 'yes' }),
    ],
  },
  {
    group: 'เนื้อหา & เว็บไซต์',
    rows: [
      row('CMS / Page Builder / Sections', { marketing: 'yes' }),
      row('เผยแพร่หน้าเว็บ', { marketing: 'priv' }),
      row('SEO / GEO', { marketing: 'yes' }),
      row('แปลภาษา (EN / 中文)', { marketing: 'yes', translator: 'yes' }),
      row('Branding (โลโก้ / สี / ฟอนต์)', { marketing: 'yes' }),
    ],
  },
  {
    group: 'ระบบ & ตั้งค่า',
    rows: [
      row('Field Builder (ฟิลด์เก็บข้อมูลทรัพย์)', { ops: 'yes' }),
      row('เปิด / ปิดประเภททรัพย์', {}),
      row('พื้นที่ & นิคม (Geography)', { ops: 'yes' }),
      row('ผู้ใช้ & บทบาท', {}),
      row('Audit log', { manager: 'priv' }),
      row('ส่งออกข้อมูล (CSV)', {}, 'เฉพาะเจ้าของระบบ — กันข้อมูลลูกค้าถูกดึงออกนอกระบบ'),
      row('ตั้งค่าระบบ', { ops: 'yes' }),
    ],
  },
];

/* ---- helpers used by the UI ---- */
export const scopeLabel = (s: Scope) => (s === 'own' ? 'เฉพาะของตัวเอง' : 'ทั้งหมด');

export function privAllowed(r: RoleKey, p: PrivKey) {
  return !(FORBIDDEN_PRIVS[r] || []).includes(p);
}

/** สิทธิ์พิเศษตั้งต้นเมื่อเพิ่งเลือกบทบาท (กรองอันที่ห้ามออก) */
export function initialPrivs(r: RoleKey): PrivKey[] {
  return DEFAULT_PRIVS[r].filter((p) => privAllowed(r, p));
}
