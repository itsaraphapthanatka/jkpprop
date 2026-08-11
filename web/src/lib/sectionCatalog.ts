/* Every editable block on the public pages, in the order it appears.
 *
 * One list, read by four places: the seed, the script that syncs an existing
 * database, the /admin/sections editor and its list-of-items forms. It exists
 * because the two drifted apart badly — the About page rendered six blocks
 * while the CMS offered two, so four of them looked editable and were not.
 *
 * Adding a block here and running `npm run sections:sync` is the whole job;
 * wiring the component to read `copy.<key>` is the other half.
 */

export type ItemFieldKind = 'text' | 'textarea' | 'image';
export type ItemFieldDef = { key: 'title' | 'desc' | 'role' | 'img'; label: string; kind: ItemFieldKind; placeholder?: string };

/** A repeating list inside one section — team members, steps, KPI figures. */
export type ItemListDef = {
  title: string;
  /** singular noun for the "add another" button and the row heading */
  rowLabel: string;
  hint: string;
  max: number;
  fields: ItemFieldDef[];
};

/** Fields the page actually renders for a section. */
export type SectionField = 'eyebrow' | 'headline' | 'sub' | 'cta' | 'note' | 'img' | 'items';

export type SectionDef = {
  key: string;
  /** name shown in the editor's list */
  name: string;
  /** what part of the page this is, in plain words */
  desc: string;
  type: 'hero' | 'section';
  /* Which inputs the editor should offer.
   *
   * The editor used to show all six text fields plus an image on every block,
   * whatever the page did with them. Most were ignored: the KPI strip has no
   * headline, the press row has no image, the team panel had an image box
   * that went nowhere. Someone would type, save, reload the site and find
   * nothing changed — with no way to tell which of the six was the real one.
   *
   * This list is the contract. A field here must be read by the component;
   * a field the component reads must be here. tests/unit/sectionFields.test.ts
   * checks both directions against the source. */
  supports: SectionField[];
  /** false for the page's masthead — a page whose top can be switched off has no top */
  canDisable?: boolean;
  /** overrides for the generic field labels, where the block uses them for
      something specific enough that "CTA" would be a lie */
  labels?: Partial<Record<'eyebrow' | 'headline' | 'sub' | 'cta' | 'note' | 'img', string>>;
  items?: ItemListDef;
};

const TITLE_DESC = (titleLabel: string, descLabel: string): ItemFieldDef[] => [
  { key: 'title', label: titleLabel, kind: 'text' },
  { key: 'desc', label: descLabel, kind: 'textarea' },
];

export const SECTION_CATALOG: Record<'home' | 'about' | 'contact' | 'faq', SectionDef[]> = {
  home: [
    {
      key: 'h', type: 'hero', name: 'Hero',
      supports: ['headline', 'sub', 'img'], canDisable: false,
      desc: 'แถบบนสุด — หัวข้อใหญ่ กล่องค้นหา และรูปพื้นหลัง',
      labels: { headline: 'หัวข้อบรรทัดแรก', sub: 'คำโปรยใต้หัวข้อ', img: 'รูปพื้นหลัง' },
    },
    {
      key: 'n', type: 'section', name: 'ทรัพย์มาใหม่',
      supports: ['eyebrow', 'headline', 'sub'],
      desc: 'การ์ดทรัพย์ล่าสุด — รายการดึงจากประกาศอัตโนมัติ แก้ได้แค่หัวข้อ',
    },
    {
      key: 'l', type: 'section', name: 'ค้นหาตามทำเล',
      supports: ['eyebrow', 'headline'],
      desc: 'แผนที่ + แท็บทำเล — จำนวนทรัพย์นับจากฐานข้อมูลจริง',
    },
    {
      key: 's', type: 'section', name: '4 ขั้นตอน',
      supports: ['eyebrow', 'headline', 'sub', 'items'],
      desc: 'ไทม์ไลน์ขั้นตอนการใช้บริการ',
      items: {
        title: 'ขั้นตอน', rowLabel: 'ขั้นตอน', max: 4,
        hint: 'ต้องมี 4 ขั้นตอนพอดี เพราะไทม์ไลน์แบ่งเป็น 4 ช่วง — เว้นว่างทั้งหมดจะใช้ค่าตั้งต้น',
        fields: TITLE_DESC('ชื่อขั้นตอน', 'คำอธิบาย'),
      },
    },
    {
      key: 'w', type: 'section', name: 'ทำไมต้องเลือกเรา',
      supports: ['eyebrow', 'headline', 'sub', 'cta', 'note', 'img', 'items'],
      desc: 'รูปใหญ่ + ป้ายรางวัล + คะแนนรีวิว + การ์ดจุดเด่น 6 ใบ',
      labels: {
        img: 'รูปใหญ่ทางซ้าย',
        note: 'ข้อความป้ายรางวัลบนรูป (เว้นว่าง = ไม่มีป้าย)',
        cta: 'คะแนนรีวิว เช่น 4.9 (เว้นว่าง = ไม่แสดงการ์ดคะแนน)',
      },
      items: {
        title: 'การ์ดจุดเด่น', rowLabel: 'การ์ด', max: 6,
        hint: 'การ์ดเรียง 3 คอลัมน์ใต้รูป',
        fields: TITLE_DESC('หัวข้อ', 'คำอธิบาย'),
      },
    },
    {
      key: 'wk', type: 'section', name: 'ตัวเลข KPI',
      supports: ['items'],
      desc: 'แถบตัวเลขนับขึ้นในบล็อก “ทำไมต้องเลือกเรา”',
      items: {
        title: 'ตัวเลข', rowLabel: 'ตัวเลข', max: 4,
        hint: 'ใส่ตัวเลขที่ยืนยันได้เท่านั้น — ถ้ายังไม่มีตัวเลขจริง ปิดสวิตช์บล็อกนี้',
        fields: [
          { key: 'title', label: 'ตัวเลข', kind: 'text', placeholder: '2,000+' },
          { key: 'desc', label: 'คำอธิบาย', kind: 'text', placeholder: 'ทรัพย์ในระบบทั่วประเทศ' },
        ],
      },
    },
    {
      key: 'ct', type: 'section', name: 'มาตรฐานและการรับรอง',
      supports: ['eyebrow', 'headline', 'sub', 'items'],
      desc: 'การ์ด TREBA / DBD / มาตรฐานวิชาชีพ',
      items: {
        title: 'การรับรอง', rowLabel: 'การรับรอง', max: 4,
        hint: 'ใส่เฉพาะที่มีหลักฐานจริง — การ์ดแต่ละใบติดป้าย “ตรวจสอบแล้ว”',
        fields: [
          { key: 'title', label: 'ชื่อย่อ', kind: 'text', placeholder: 'DBD' },
          { key: 'role', label: 'บรรทัดใต้ชื่อ', kind: 'text', placeholder: 'จดทะเบียนถูกต้องตามกฎหมาย' },
          { key: 'desc', label: 'คำอธิบาย', kind: 'textarea' },
        ],
      },
    },
    {
      key: 'tg', type: 'section', name: 'ผลงานส่งมอบ',
      supports: ['eyebrow', 'headline', 'sub', 'items'],
      desc: 'แถบรูปเลื่อนอัตโนมัติท้ายหน้า',
      items: {
        title: 'รูปผลงาน', rowLabel: 'รูป', max: 24,
        hint: 'รูปงานส่งมอบจริง — ถ้ายังไม่มี ปิดสวิตช์บล็อกนี้ไว้ก่อน',
        fields: [
          { key: 'img', label: 'รูป', kind: 'image' },
          { key: 'title', label: 'คำบรรยายรูป (สำหรับ screen reader)', kind: 'text' },
        ],
      },
    },
    {
      key: 'c', type: 'section', name: 'CTA ท้ายหน้า',
      supports: ['eyebrow', 'headline', 'sub', 'cta', 'img'],
      desc: 'การ์ดเขียวชวนติดต่อ + รูปทีมงาน',
      labels: { cta: 'ข้อความปุ่มหลัก' },
    },
  ],

  about: [
    { key: 'ah', type: 'hero', name: 'Hero', desc: 'แถบรูปใหญ่บนสุด — หัวข้อ + คำโปรย', supports: ['headline', 'sub', 'img'], canDisable: false },
    {
      key: 'st', type: 'section', name: 'เรื่องราวของเรา',
      supports: ['eyebrow', 'headline', 'sub', 'cta', 'img', 'items'],
      desc: 'กล่องขาว: เรื่องราว + ตัวเลขสถิติ + รูปผู้ก่อตั้ง',
      labels: { cta: 'ชื่อใต้รูปผู้ก่อตั้ง', img: 'รูปผู้ก่อตั้ง' },
      items: {
        title: 'ตัวเลขสถิติ', rowLabel: 'ตัวเลข', max: 4,
        hint: 'แถวตัวเลขใต้คำอธิบาย — เว้นว่างทั้งหมดจะใช้ค่าตั้งต้น',
        fields: [
          { key: 'title', label: 'ตัวเลข', kind: 'text', placeholder: '2019' },
          { key: 'desc', label: 'คำอธิบาย', kind: 'text', placeholder: 'ก่อตั้ง' },
        ],
      },
    },
    {
      key: 'pl', type: 'section', name: 'จุดแข็ง 3 ข้อ',
      supports: ['items'],
      desc: 'การ์ดเรียงกันใต้เส้นคั่นในกล่องเรื่องราว',
      items: {
        title: 'จุดแข็ง', rowLabel: 'จุดแข็ง', max: 6,
        hint: 'การ์ดเรียง 3 คอลัมน์',
        fields: TITLE_DESC('หัวข้อ', 'คำอธิบาย'),
      },
    },
    {
      key: 'as', type: 'section', name: 'ทีมงาน',
      supports: ['eyebrow', 'headline', 'sub', 'img', 'items'],
      desc: 'แถบดำ + การ์ดทีมงานเลื่อนซ้ายขวา',
      items: {
        title: 'รายชื่อทีมงาน', rowLabel: 'คน', max: 24,
        hint: 'ชื่อและรูปใช้ร่วมกันทุกภาษาถ้าไม่กรอกซ้ำ',
        fields: [
          { key: 'title', label: 'ชื่อ', kind: 'text', placeholder: 'คุณสมชาย ใจดี' },
          { key: 'role', label: 'ตำแหน่ง', kind: 'text', placeholder: 'Sales Executive' },
          { key: 'img', label: 'รูป', kind: 'image' },
        ],
      },
    },
    {
      key: 'aw', type: 'section', name: 'รางวัล',
      supports: ['eyebrow', 'headline', 'sub', 'cta', 'note', 'img'],
      desc: 'กล่องรางวัล — รูปซ้าย ข้อความขวา',
      labels: { note: 'ชื่อรางวัลและปีที่ได้รับ (เว้นว่าง = ไม่แสดงบรรทัดนี้)' },
    },
    {
      key: 'pr', type: 'section', name: 'ได้รับการนำเสนอใน',
      supports: ['eyebrow', 'headline', 'items'],
      desc: 'โลโก้/ชื่อสื่อ ท้ายหน้า',
      items: {
        title: 'ชื่อสื่อ', rowLabel: 'สื่อ', max: 12,
        hint: 'ใส่เฉพาะสื่อที่เคยลงข่าวจริง — ถ้ายังไม่มี ให้ปิดสวิตช์บล็อกนี้แทน',
        fields: [{ key: 'title', label: 'ชื่อสื่อ', kind: 'text', placeholder: 'THE STANDARD' }],
      },
    },
  ],

  faq: [
    {
      key: 'fh', type: 'hero', name: 'Hero',
      supports: ['headline', 'sub', 'img'], canDisable: false,
      desc: 'แถบรูปใหญ่บนสุด — คำถามและคำตอบอยู่ในเมนู CMS › FAQ',
    },
  ],

  contact: [
    { key: 'ch', type: 'hero', name: 'Hero', desc: 'แถบรูปใหญ่บนสุดของหน้าติดต่อ', supports: ['headline', 'sub', 'img'], canDisable: false },
    { key: 'cm', type: 'section', name: 'แผนที่ & ช่องทาง', desc: 'แผนที่ + ช่องทางติดต่อ', supports: ['headline', 'sub', 'img'] },
  ],
};

export const PAGE_KEYS = Object.keys(SECTION_CATALOG) as (keyof typeof SECTION_CATALOG)[];

export const sectionDef = (page: string, key: string): SectionDef | undefined =>
  SECTION_CATALOG[page as keyof typeof SECTION_CATALOG]?.find((s) => s.key === key);
