/* What /admin/geography says a place is called in English and Chinese.
 *
 * The page has always claimed "แต่ละระดับมี 3 ภาษา (TH/EN/ZH)". It offered one
 * English box, on provinces only, and nothing read it — the public site
 * translated place names purely from the tables in i18n/places.ts, so an
 * English name typed by the team changed nothing anywhere.
 *
 * This turns the tree into the override layer that claim implies: what the
 * team writes wins, and anything they have not written falls through to the
 * built-in romanisation exactly as before. */
import { db } from './db';
import { geoKey, type GeoOverrides } from '@/i18n/places';

const EMPTY: GeoOverrides = {};

export async function loadGeoLabels(orgId: string): Promise<GeoOverrides> {
  const rows = await db.geoItem
    .findMany({
      where: { orgId, kind: { in: ['province', 'district', 'subdistrict'] } },
      select: { kind: true, name: true, meta: true },
    })
    .catch(() => []);
  if (!rows.length) return EMPTY;

  const out: GeoOverrides = { province: new Map(), district: new Map(), subdistrict: new Map() };
  for (const r of rows) {
    const meta = (r.meta ?? {}) as { en?: unknown; zh?: unknown };
    const en = typeof meta.en === 'string' ? meta.en.trim() : '';
    const zh = typeof meta.zh === 'string' ? meta.zh.trim() : '';
    if (!en && !zh) continue;
    const bucket = out[r.kind as 'province' | 'district' | 'subdistrict'];
    bucket?.set(geoKey(r.name), { en: en || undefined, zh: zh || undefined });
  }
  return out;
}
