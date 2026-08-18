/* POST /api/geography/import — build the tree out of the inventory.
   owner + ops (MATRIX "พื้นที่ & นิคม")

   The tree started empty and could only be filled one dialog at a time, while
   393 properties already said exactly which provinces, districts and
   subdistricts this agency works in. Reading them is a few seconds of work
   that nobody has to do by hand — and it makes the address fields on the
   property form selectable instead of free text, which is where the typos
   ("กิ่แก้ว", "แขวงคันนายาว" with no space) came from in the first place.

   Adds only what is missing, so it is safe to run again after new stock
   arrives. Nothing is renamed and nothing is deleted. */
import { ok, handler } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { inventoryCounts, subdistrictParents, bareName } from '@/lib/server/geoCounts';
import { provinceLabel } from '@/i18n/places';

export const runtime = 'nodejs';

/* A province's 3-letter code becomes part of every property code it issues
   (JKPBKK1255), so it is derived once and never guessed twice. */
const codeFor = (th: string) => (provinceLabel(th, 'en') || th).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'ops');
  const orgId = user.orgId;
  const dry = new URL(req.url).searchParams.get('dry') === '1';

  const [counts, parents, existing] = await Promise.all([
    inventoryCounts(orgId),
    subdistrictParents(orgId),
    db.geoItem.findMany({ where: { orgId } }),
  ]);

  const byKind = (kind: string) => existing.filter((e) => e.kind === kind);
  const findBy = (kind: string, name: string) =>
    byKind(kind).find((e) => bareName(e.name) === bareName(name));

  const added = { prov: [] as string[], dist: [] as string[], sub: [] as string[] };

  /* provinces first — districts hang off them, subdistricts off districts */
  for (const [name] of counts.prov) {
    if (findBy('province', name)) continue;
    added.prov.push(name);
    if (!dry) {
      const row = await db.geoItem.create({
        data: { orgId, kind: 'province', name, code: codeFor(name) || null, meta: { en: provinceLabel(name, 'en') } },
      });
      existing.push(row);
    }
  }

  /* a district is only placed under the province its properties are in */
  const distProvince = new Map<string, string>();
  for (const r of await db.property.findMany({ where: { orgId, status: 'active' }, select: { values: true } })) {
    const v = (r.values ?? {}) as Record<string, unknown>;
    const loc = (v.location ?? {}) as Record<string, unknown>;
    const d = String(v.district ?? loc.amphoe ?? '').trim();
    const p = String(v.province ?? loc.province ?? '').trim();
    if (d && p && !distProvince.has(bareName(d))) distProvince.set(bareName(d), p);
  }

  const skipped: string[] = [];
  for (const [name] of counts.dist) {
    if (findBy('district', name)) continue;
    const provName = distProvince.get(bareName(name));
    const prov = provName ? findBy('province', provName) : undefined;
    if (!prov) { skipped.push(name); continue; }
    added.dist.push(name);
    if (!dry) {
      const row = await db.geoItem.create({ data: { orgId, kind: 'district', name, parentId: prov.id } });
      existing.push(row);
    }
  }

  for (const [name] of counts.sub) {
    if (findBy('subdistrict', name)) continue;
    const distName = parents.get(bareName(name));
    const dist = distName ? findBy('district', distName) : undefined;
    if (!dist) { skipped.push(name); continue; }
    added.sub.push(name);
    if (!dry) {
      const row = await db.geoItem.create({ data: { orgId, kind: 'subdistrict', name, parentId: dist.id } });
      existing.push(row);
    }
  }

  if (!dry && (added.prov.length || added.dist.length || added.sub.length)) {
    await audit({
      user, orgId, action: 'geography.import', entity: 'geoItem', entityId: 'bulk',
      after: { provinces: added.prov.length, districts: added.dist.length, subdistricts: added.sub.length },
    });
  }

  return ok({ added, skipped, dry });
});
