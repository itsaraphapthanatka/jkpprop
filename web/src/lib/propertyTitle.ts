/* ============================================================
   A property's headline for a reader who does not read Thai.

   The team types one Thai title per record and the English/Chinese versions
   are translations kept in `Property.i18n`. That works for records entered by
   hand — and left the site untranslated the moment 393 records arrived from a
   spreadsheet with no translations at all: switching to English changed the
   chrome around a wall of Thai headlines.

   Waiting for 393 hand translations is not a plan, and machine-translating an
   address is how a listing ends up pointing at the wrong district. But these
   titles are not prose — the team writes them to a fixed pattern:

     โกดัง ให้เช่า 1,344 ตร.ม. ตำบล ราชาเทวะ, บางพลี, สมุทรปราการ (รหัส : JKPSPK1001)
     └type┘ └deal┘ └─area─┘        └────── the address fields ──────┘   └─code─┘

   Every one of those parts already exists as a structured value with a
   translation table behind it, so the same sentence can be composed in the
   reader's language from the record itself. A real translation, when someone
   writes one, still wins — this is the floor, not the ceiling.
   ============================================================ */
import { enumLabel } from '@/i18n/enums';
import { provinceLabel, districtLabel, subdistrictLabel, type GeoOverrides } from '@/i18n/places';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

export type TitleParts = {
  typeLabel: string;   // the Thai type label, e.g. 'โรงงาน'
  values: Record<string, unknown>;
  area: number | null;
  code: string;
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** "Factory for rent, 5,040 sqm — Lam Prathio, Lat Krabang, Bangkok (JKPBKK1255)" */
export function composeTitle({ typeLabel, values, area, code }: TitleParts, locale: Locale, over?: GeoOverrides): string {
  const d = getDictionary(locale);
  const loc = (values.location ?? {}) as Record<string, unknown>;

  const type = enumLabel(typeLabel, locale);
  const deal = enumLabel(str(values.deal_type), locale);
  const size = area !== null && Number.isFinite(area)
    ? `${area.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')} ${d.common.sqm}`
    : '';

  const where = [
    subdistrictLabel(values.subdistrict ?? loc.tambon, locale, over),
    districtLabel(values.district ?? loc.amphoe, locale, over),
    provinceLabel(values.province ?? loc.province, locale, over),
  ].map(str).filter(Boolean).join(', ');

  /* สไลด์ 23 · "เรียงใหม่ตามนี้ 1ประเภททรัพย์ 2ขนาดอาคารรวม 3ประเภทประกาศ
     ที่(เพิ่มคำ) 4แขวง 5เขต 6จังหวัด 7(รหัสทรัพย์)"
     เดิมเรียง ประเภท → ประเภทประกาศ → ขนาด → ที่ตั้ง และไม่มีคำว่า "ที่" คั่น */
  const at = locale === 'th' ? 'ที่ ' : locale === 'zh' ? '位于' : 'in ';
  const body = [type, size, locale === 'en' ? deal.toLowerCase() : deal].filter(Boolean).join(' ');
  /* จีนไม่เว้นวรรคก่อนคำบอกสถานที่ */
  const tail = where ? (locale === 'zh' ? `${at}${where}` : `${at}${where}`) : '';
  return [[body, tail].filter(Boolean).join(' '), code ? `(${code})` : '']
    .filter(Boolean).join(' ');
}

/* Whether composing is even worth it: with no type and no address the result
   would be little more than the code, and the Thai title says more than that. */
export function canCompose(parts: TitleParts): boolean {
  const loc = (parts.values.location ?? {}) as Record<string, unknown>;
  const hasPlace = !!(str(parts.values.province) || str(loc.province)
    || str(parts.values.district) || str(loc.amphoe));
  return !!str(parts.typeLabel) && hasPlace;
}

/** The headline to show: the record's own translation, else one composed. */
export function displayTitle(
  thaiTitle: string,
  translated: string | undefined,
  parts: TitleParts,
  locale: Locale,
  over?: GeoOverrides,
): string {
  if (locale === DEFAULT_LOCALE) return thaiTitle;
  if (translated) return translated;
  return canCompose(parts) ? composeTitle(parts, locale, over) : thaiTitle;
}
