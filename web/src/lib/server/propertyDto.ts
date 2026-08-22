/* Shared shaping for property responses — strips internalOnly fields for
   users without the internal_note privilege (§12.2 #4) and derives the
   display columns the admin table renders. */
import type { Property, User } from '@prisma/client';
import { PROPERTY_TYPES, propertyType } from '@/lib/propertySchema';
import { hasPriv } from './auth';
import { provinceLabel, districtLabel, subdistrictLabel, type GeoOverrides } from '@/i18n/places';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { parseI18n } from './propertyI18n';
import { canCompose, composeTitle, isAutoTitle } from '@/lib/propertyTitle';

type Vals = Record<string, unknown>;

/** keys flagged internalOnly in the base schema, per type */
const INTERNAL_KEYS: Record<string, string[]> = Object.fromEntries(
  PROPERTY_TYPES.map((t) => [t.key, t.fields.filter((f) => f.internalOnly).map((f) => f.key)]),
);

export function stripInternal(typeKey: string, values: Vals, user: User | null): Vals {
  // null user = public endpoint → always strip (FRONTEND_API_SPEC §3 🔒)
  if (user && hasPriv(user, 'internal_note')) return values;
  const out = { ...values };
  for (const k of INTERNAL_KEYS[typeKey] ?? []) delete out[k];
  return stripCoords(out);
}

/* The exact pin, wherever a record happens to keep it.
 *
 * Every public payload deletes `location_map`, which is where the map picker
 * saves. Houses, condos, plots and factories used to have a text box inside
 * the location group instead, saving to `location.map` — a key no filter knew
 * about, so those coordinates went out with the rest of the group. The field
 * is gone, but records written before it was are still in the database. */
export function stripCoords(values: Vals): Vals {
  const out = { ...values };
  delete out.location_map;
  const loc = out.location;
  if (loc && typeof loc === 'object' && !Array.isArray(loc) && 'map' in (loc as Record<string, unknown>)) {
    const copy = { ...(loc as Record<string, unknown>) };
    delete copy.map;
    out.location = copy;
  }
  return out;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

export function displayArea(values: Vals): number | null {
  return num(values.building_area_total) ?? num(values.usable_area) ?? num(values.building_area) ?? num(values.land_area) ?? null;
}

/* The address is stored in Thai, which is right — it is the address. For a
   reader who cannot read Thai script it is translated on the way out; the
   admin keeps the stored form, because that is what the team types and says. */
export function displayLocation(values: Vals, locale: Locale = DEFAULT_LOCALE, over?: GeoOverrides): string {
  const loc = (values.location ?? {}) as Vals;
  const district = districtLabel(values.district ?? loc.amphoe, locale, over);
  const province = provinceLabel(values.province ?? loc.province, locale, over);
  return [district, province].filter(Boolean).join(', ');
}

/** ทำเลแบบเต็มสามชั้น — สไลด์ 22 "แขวง เขต จังหวัด"
 *
 *  หน้าเว็บฝั่งลูกค้าใช้แบบสองชั้นต่อไป (การ์ดยาวเกินถ้าใส่แขวงด้วย) ส่วน
 *  ตารางหลังบ้านต้องเห็นครบ เพราะทีมใช้แยกทรัพย์ที่ชื่ออำเภอซ้ำกัน
 */
export function displayFullLocation(values: Vals, locale: Locale = DEFAULT_LOCALE, over?: GeoOverrides): string {
  const loc = (values.location ?? {}) as Vals;
  const sub = subdistrictLabel(values.subdistrict ?? loc.tambon, locale, over);
  const district = districtLabel(values.district ?? loc.amphoe, locale, over);
  const province = provinceLabel(values.province ?? loc.province, locale, over);
  return [sub, district, province].filter(Boolean).join(', ');
}

/** the stored (Thai) province — filters and code prefixes match on this */
export function displayProvince(values: Vals): string {
  const loc = (values.location ?? {}) as Vals;
  return String(values.province ?? loc.province ?? '');
}

/** ชื่อที่เครื่องสร้างไว้ ประกอบใหม่ตามลำดับปัจจุบัน · ชื่อที่คนตั้งเองคงไว้ */
export function autoOrStored(title: string, code: string, typeKey: string, values: Vals): string {
  const parts = { typeLabel: propertyType(typeKey).label, values, area: displayArea(values), code };
  return isAutoTitle(title, code) && canCompose(parts) ? composeTitle(parts, DEFAULT_LOCALE) : title;
}

export function propertyDto(p: Property, user: User | null) {
  const values = stripInternal(p.typeKey, (p.values ?? {}) as Vals, user);
  return {
    id: p.id,
    publicCode: p.publicCode,
    typeKey: p.typeKey,
    typeLabel: propertyType(p.typeKey).label,
    /* ชื่อที่เอาไปแสดง — ถ้าเป็นชื่อที่เครื่องสร้างไว้ในลำดับเก่า ประกอบใหม่ตาม
       ลำดับที่ลูกค้ากำหนด (สไลด์ 24) หลังบ้านกับหน้าเว็บจะได้เห็นชื่อเดียวกัน */
    title: autoOrStored(p.title, p.publicCode, p.typeKey, values),
    /* ชื่อที่เก็บอยู่จริงในฐานข้อมูล — ฟอร์มแก้ไขต้องเห็นของจริง ไม่ใช่ของที่
       ประกอบให้ดู ไม่งั้นกดบันทึกทีเดียวชื่อที่ประกอบจะกลายเป็นชื่อถาวร */
    storedTitle: p.title,
    // the EN/ZH title and description, so the editor can load what is stored
    i18n: parseI18n(p.i18n),
    status: p.status,
    values,
    location: displayLocation(values),
    area: displayArea(values),
    ownerId: p.ownerId,
    createdAt: p.createdAt.getTime(),
    updatedAt: p.updatedAt.getTime(),
  };
}
