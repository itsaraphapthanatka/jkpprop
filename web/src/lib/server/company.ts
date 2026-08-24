/* The company's own contact details, in one place.
 *
 * They used to live in three: the address and opening hours in the dictionary,
 * the phones and mailboxes hard-coded in ContactBody, and a third set passed
 * as props to the footer — which only the Contact page bothered to pass. So
 * About and FAQ served a mailbox on a domain the company does not own and a
 * phone number that does not ring, and nobody could see the difference without
 * opening three files.
 *
 * The defaults below are what the site shipped with, so an org that has not
 * filled the form in yet looks exactly as it did.
 */
import { db } from './db';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

export type Phone = { number: string; label: string };

export type Company = {
  legalName: string;
  address: string;
  shortLocation: string;
  phones: Phone[];
  salesEmail: string;
  generalEmail: string;
  hoursDays: string;
  hoursValue: string;
  /** only the channels that have a link — an empty one renders no icon */
  socials: Social[];
  /** WeChat is an ID, not a URL: shown to be copied rather than linked */
  wechatId: string;
};

export type SocialKey = 'line' | 'facebook' | 'whatsapp' | 'instagram';
export type Social = { key: SocialKey; url: string };

type Tr = Partial<Record<Locale, string>>;

const DEFAULTS = {
  legalName: 'JKP PROPERTY CO., LTD.',
  address: {
    th: '41/6 หมู่ 7 ถ.บางนาตราด กม. 16.5 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540 (สำนักงานใหญ่)',
    en: '41/6 Moo 7, Bangna-Trad Rd km 16.5, Bang Chalong, Bang Phli, Samut Prakan 10540 (head office)',
    zh: '41/6 Moo 7, Bangna-Trad Rd km 16.5, Bang Chalong, Bang Phli, Samut Prakan 10540（总部）',
  } as Tr,
  shortLocation: { th: 'สมุทรปราการ, ประเทศไทย', en: 'Samut Prakan, Thailand', zh: '北榄府，泰国' } as Tr,
  /* เด็ค Web 2026 ข้อ 20 · "ที่คุยกันต้องเป็นข้อมูลบริษัทเราครับ"
     ค่าตั้งต้นชุดนี้เคยมีเบอร์และอีเมลของอีกบริษัทที่ติดมากับเทมเพลตเดิม
     ตอนนี้ฐานข้อมูลจริงกรอกครบแล้ว หน้าเว็บจึงไม่เคยเอาค่าพวกนั้นขึ้นจริง
     แต่มันรออยู่ — องค์กรใหม่ หรือวันที่ใครล้างช่องอีเมลฝ่ายขายทิ้ง
     หน้าติดต่อจะพาลูกค้าไปหาคนอื่นทันทีโดยไม่มีใครรู้

     ช่องที่พาคนออกไปข้างนอกจึงต้องไม่มีค่าตั้งต้นเด็ดขาด — ว่างแล้วให้ไม่แสดง
     ส่วนชื่อบริษัท ที่อยู่ และเวลาทำการยังมีค่าตั้งต้นได้ เพราะเป็นของ JKP เอง
     และไม่ได้พาใครไปไหน */
  phones: [] as Phone[],
  salesEmail: '',
  generalEmail: '',
  hoursDays: { th: 'จันทร์ - ศุกร์:', en: 'Monday – Friday:', zh: '周一至周五：' } as Tr,
  hoursValue: '9:00 - 18:00 น.',
};

/* ข้อความตัวอย่างในช่องกรอกของ /admin/company (components/admin/CompanyBody)
   ที่ถูกบันทึกเป็นค่าจริง — production เก็บทั้งสามอันนี้ไว้ หน้าเว็บจึงโชว์ปุ่ม
   Line / Facebook / Instagram ที่กดแล้วไปหน้าไม่มีอยู่จริงมาตลอด
   ค่าที่เท่ากับข้อความตัวอย่างของช่องตัวเองเป๊ะ ๆ ไม่เคยเป็นคำตอบ */
const PLACEHOLDERS = new Set([
  'https://line.me/R/ti/p/@yourid',
  'https://facebook.com/yourpage',
  'https://instagram.com/youraccount',
  /* ไม่รวม WhatsApp — ข้อความตัวอย่างของช่องนั้นเป็นเบอร์จริง แยกไม่ออกว่าเป็น
     ค่าที่ตั้งใจกรอกหรือเผลอบันทึกตัวอย่างไว้ ตัดทิ้งเองเสี่ยงกว่าปล่อยไว้ */
]);

/* Only http(s) — a contact icon is a link out, and `javascript:` has no
   business being one. Stored values come from an admin form, but the form is
   not the last line of defence. */
export const safeUrl = (v: unknown): string => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (PLACEHOLDERS.has(s)) return '';
  return /^https?:\/\/[^\s<>"']+$/i.test(s) ? s : '';
};

/* ไอดี WeChat ที่ production เก็บไว้คือ "#" — ไม่มีตัวอักษรหรือตัวเลขสักตัว
   คัดลอกไปก็ใช้ไม่ได้ ป๊อปอัปที่โชว์ "#" แย่กว่าไม่มีปุ่ม */
export const safeId = (v: unknown): string => {
  const s = typeof v === 'string' ? v.trim().slice(0, 100) : '';
  return /[A-Za-z0-9\u0E00-\u0E7F]/.test(s) ? s : '';
};

/** the visitor's language, then Thai — an address is the same place either way */
const tr = (v: unknown, locale: Locale, fallback: Tr): string => {
  const o = (v && typeof v === 'object' ? v : {}) as Tr;
  return (o[locale] || o[DEFAULT_LOCALE] || fallback[locale] || fallback[DEFAULT_LOCALE] || '').trim();
};

const phonesOf = (v: unknown): Phone[] => {
  if (!Array.isArray(v)) return DEFAULTS.phones;
  const rows = v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ({
      number: typeof x.number === 'string' ? x.number.trim() : '',
      label: typeof x.label === 'string' ? x.label.trim() : '',
    }))
    .filter((p) => p.number);
  return rows.length ? rows : DEFAULTS.phones;
};

export async function loadCompany(locale: Locale): Promise<Company> {
  const row = await db.companyProfile.findFirst().catch(() => null);
  return {
    legalName: row?.legalName?.trim() || DEFAULTS.legalName,
    address: tr(row?.address, locale, DEFAULTS.address),
    shortLocation: tr(row?.shortLocation, locale, DEFAULTS.shortLocation),
    phones: phonesOf(row?.phones),
    /* กรอกมาอันเดียวก็ใช้อันนั้นทั้งสองที่ ดีกว่าปล่อยให้ช่องหนึ่งว่างเปล่า */
    salesEmail: row?.salesEmail?.trim() || row?.generalEmail?.trim() || '',
    generalEmail: row?.generalEmail?.trim() || row?.salesEmail?.trim() || '',
    hoursDays: tr(row?.hoursDays, locale, DEFAULTS.hoursDays),
    hoursValue: row?.hoursValue?.trim() || DEFAULTS.hoursValue,
    socials: ([
      ['line', row?.lineUrl],
      ['facebook', row?.facebookUrl],
      ['whatsapp', row?.whatsappUrl],
      ['instagram', row?.instagramUrl],
    ] as const)
      .map(([key, url]) => ({ key, url: safeUrl(url) }))
      .filter((sc): sc is Social => !!sc.url),
    /* an ID to copy, not a link to follow */
    wechatId: safeId(row?.wechatId),
  };
}

/** strip everything a tel: href cannot carry, so the link is built not pasted */
export const telHref = (number: string) => 'tel:' + number.replace(/[^\d+]/g, '');

export { DEFAULTS as COMPANY_DEFAULTS };
