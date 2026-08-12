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
};

type Tr = Partial<Record<Locale, string>>;

const DEFAULTS = {
  legalName: 'JKP PROPERTY CO., LTD.',
  address: {
    th: '41/6 หมู่ 7 ถ.บางนาตราด กม. 16.5 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540 (สำนักงานใหญ่)',
    en: '41/6 Moo 7, Bangna-Trad Rd km 16.5, Bang Chalong, Bang Phli, Samut Prakan 10540 (head office)',
    zh: '41/6 Moo 7, Bangna-Trad Rd km 16.5, Bang Chalong, Bang Phli, Samut Prakan 10540（总部）',
  } as Tr,
  shortLocation: { th: 'สมุทรปราการ, ประเทศไทย', en: 'Samut Prakan, Thailand', zh: '北榄府，泰国' } as Tr,
  phones: [
    { number: '+66 80-830-4005', label: 'English / ไทย' },
    { number: '+66 90-217-4005', label: '中文' },
  ] as Phone[],
  salesEmail: 'atsokoproperty.sales@gmail.com',
  generalEmail: 'atsokoproperty@gmail.com',
  hoursDays: { th: 'จันทร์ - ศุกร์:', en: 'Monday – Friday:', zh: '周一至周五：' } as Tr,
  hoursValue: '9:00 - 18:00 น.',
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
    salesEmail: row?.salesEmail?.trim() || DEFAULTS.salesEmail,
    generalEmail: row?.generalEmail?.trim() || DEFAULTS.generalEmail,
    hoursDays: tr(row?.hoursDays, locale, DEFAULTS.hoursDays),
    hoursValue: row?.hoursValue?.trim() || DEFAULTS.hoursValue,
  };
}

/** strip everything a tel: href cannot carry, so the link is built not pasted */
export const telHref = (number: string) => 'tel:' + number.replace(/[^\d+]/g, '');

export { DEFAULTS as COMPANY_DEFAULTS };
