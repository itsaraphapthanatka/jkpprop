/* Shared shaping for property responses — strips internalOnly fields for
   users without the internal_note privilege (§12.2 #4) and derives the
   display columns the admin table renders. */
import type { Property, User } from '@prisma/client';
import { PROPERTY_TYPES, propertyType } from '@/lib/propertySchema';
import { hasPriv } from './auth';

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
  return out;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

export function displayArea(values: Vals): number | null {
  return num(values.building_area_total) ?? num(values.usable_area) ?? num(values.building_area) ?? num(values.land_area) ?? null;
}

export function displayLocation(values: Vals): string {
  const loc = (values.location ?? {}) as Vals;
  const district = values.district ?? loc.amphoe;
  const province = values.province ?? loc.province;
  return [district, province].filter(Boolean).join(', ');
}

export function displayProvince(values: Vals): string {
  const loc = (values.location ?? {}) as Vals;
  return String(values.province ?? loc.province ?? '');
}

export function propertyDto(p: Property, user: User | null) {
  const values = stripInternal(p.typeKey, (p.values ?? {}) as Vals, user);
  return {
    id: p.id,
    publicCode: p.publicCode,
    typeKey: p.typeKey,
    typeLabel: propertyType(p.typeKey).label,
    title: p.title,
    status: p.status,
    values,
    location: displayLocation(values),
    area: displayArea(values),
    ownerId: p.ownerId,
    createdAt: p.createdAt.getTime(),
    updatedAt: p.updatedAt.getTime(),
  };
}
