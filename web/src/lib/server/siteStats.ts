/* Figures the system can actually stand behind.
 *
 * The stats strip on /about and the KPI row on the home page came with
 * defaults baked in — "2,000+ ทรัพย์ในระบบทั่วประเทศ", "100+ องค์กรที่ไว้วางใจ",
 * "12 ปีประสบการณ์" — printed as fact on a live site that has three listings.
 * The team can still type whatever it likes into the CMS (that always wins);
 * these are what stands there until they do.
 */
import { db } from './db';
import { displayProvince } from './propertyDto';

export type SiteStats = {
  published: number;
  provinces: number;
  lastUpdated: Date | null;
};

export async function siteStats(): Promise<SiteStats> {
  try {
    const rows = await db.property.findMany({
      where: { status: 'active' },
      select: { values: true, updatedAt: true },
      take: 5000,
    });
    const provinces = new Set(
      rows.map((r) => displayProvince((r.values ?? {}) as Record<string, unknown>)).filter(Boolean),
    );
    return {
      published: rows.length,
      provinces: provinces.size,
      lastUpdated: rows.reduce<Date | null>((a, r) => (!a || r.updatedAt > a ? r.updatedAt : a), null),
    };
  } catch {
    // a broken count must not take the page down with it
    return { published: 0, provinces: 0, lastUpdated: null };
  }
}
