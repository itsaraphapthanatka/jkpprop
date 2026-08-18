/* How the inventory actually spells its places.
 *
 * The geography admin listed a tree nobody could check: a district typed with
 * a typo looked exactly like a real one. Counting the properties that sit in
 * each place turns the page into something with an answer in it — a district
 * with 0 next to one with 74 is the typo. */
import { db } from './db';
import { canonicalProvince } from '@/i18n/places';

export type Counts = { prov: Map<string, number>; dist: Map<string, number>; sub: Map<string, number> };

/** The stored subdistrict carries its own prefix and the spacing varies. */
export const bareName = (s: string) => s.replace(/^(แขวง|ตำบล|ต\.|เขต|อำเภอ|อ\.)\s*/, '').replace(/\s+/g, ' ').trim();

export const countFor = (m: Map<string, number>, name: string) => {
  let n = m.get(name) ?? 0;
  if (!n) for (const [k, v] of m) if (bareName(k) === bareName(name)) n += v;
  return n;
};

export async function inventoryCounts(orgId: string): Promise<Counts> {
  const rows = await db.property.findMany({ where: { orgId, status: 'active' }, select: { values: true } });
  const prov = new Map<string, number>();
  const dist = new Map<string, number>();
  const sub = new Map<string, number>();
  const bump = (m: Map<string, number>, k: unknown) => {
    const s = typeof k === 'string' ? k.trim() : '';
    if (s) m.set(s, (m.get(s) ?? 0) + 1);
  };
  for (const r of rows) {
    const v = (r.values ?? {}) as Record<string, unknown>;
    const loc = (v.location ?? {}) as Record<string, unknown>;
    bump(prov, canonicalProvince(v.province ?? loc.province));
    bump(dist, v.district ?? loc.amphoe);
    bump(sub, v.subdistrict ?? loc.tambon);
  }
  return { prov, dist, sub };
}

/** Which district each subdistrict sits in, as the inventory records it. */
export async function subdistrictParents(orgId: string): Promise<Map<string, string>> {
  const rows = await db.property.findMany({ where: { orgId, status: 'active' }, select: { values: true } });
  const out = new Map<string, string>();
  for (const r of rows) {
    const v = (r.values ?? {}) as Record<string, unknown>;
    const loc = (v.location ?? {}) as Record<string, unknown>;
    const s = String(v.subdistrict ?? loc.tambon ?? '').trim();
    const d = String(v.district ?? loc.amphoe ?? '').trim();
    if (s && d && !out.has(bareName(s))) out.set(bareName(s), d);
  }
  return out;
}
