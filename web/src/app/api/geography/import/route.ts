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
import { canonicalProvince, builtinLabels } from '@/i18n/places';

export const runtime = 'nodejs';

/* A province's 3-letter code becomes part of every property code it issues
   (JKPBKK1255), so it is derived once and never guessed twice. */
const codeFor = (th: string) => (builtinLabels('province', th).en || th).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();

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
  const key = (kind: string, name: string) =>
    kind === 'province' ? canonicalProvince(name) : bareName(name);
  const findBy = (kind: string, name: string) =>
    byKind(kind).find((e) => key(kind, e.name) === key(kind, name));

  const added = { prov: [] as string[], dist: [] as string[], sub: [] as string[] };

  /* provinces first — districts hang off them, subdistricts off districts */
  for (const [name] of counts.prov) {
    if (findBy('province', name)) continue;
    added.prov.push(name);
    const row = dry
      ? { id: `dry-${name}`, orgId, kind: 'province', name, code: null, meta: null, parentId: null }
      : await db.geoItem.create({
        data: { orgId, kind: 'province', name, code: codeFor(name) || null, meta: builtinLabels('province', name) },
      });
    existing.push(row);
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
    const row = dry
      ? { id: `dry-${name}`, orgId, kind: 'district', name, code: null, meta: null, parentId: prov.id }
      : await db.geoItem.create({ data: { orgId, kind: 'district', name, parentId: prov.id, meta: builtinLabels('district', name) } });
    existing.push(row);
  }

  for (const [name] of counts.sub) {
    if (findBy('subdistrict', name)) continue;
    const distName = parents.get(bareName(name));
    const dist = distName ? findBy('district', distName) : undefined;
    if (!dist) { skipped.push(name); continue; }
    added.sub.push(name);
    const row = dry
      ? { id: `dry-${name}`, orgId, kind: 'subdistrict', name, code: null, meta: null, parentId: dist.id }
      : await db.geoItem.create({ data: { orgId, kind: 'subdistrict', name, parentId: dist.id, meta: builtinLabels('subdistrict', name) } });
    existing.push(row);
  }

  /* Rows that already existed before the tree carried three languages have no
     English or Chinese at all. Topping up an empty field is not an overwrite,
     and it is the difference between the claim on the page and the truth. */
  let filled = 0;
  for (const row of existing) {
    if (row.id.startsWith('dry-')) continue;
    if (!['province', 'district', 'subdistrict'].includes(row.kind)) continue;
    const meta = (row.meta ?? {}) as { en?: string; zh?: string };
    if (meta.en?.trim() && meta.zh?.trim()) continue;
    const built = builtinLabels(row.kind as 'province' | 'district' | 'subdistrict', row.name);
    const next = { ...meta, en: meta.en?.trim() || built.en, zh: meta.zh?.trim() || built.zh };
    if (next.en === (meta.en ?? '') && next.zh === (meta.zh ?? '')) continue;
    filled++;
    if (!dry) await db.geoItem.update({ where: { id: row.id }, data: { meta: next } });
  }

  if (!dry && (added.prov.length || added.dist.length || added.sub.length)) {
    await audit({
      user, orgId, action: 'geography.import', entity: 'geoItem', entityId: 'bulk',
      after: { provinces: added.prov.length, districts: added.dist.length, subdistricts: added.sub.length },
    });
  }

  return ok({ added, skipped, filled, dry });
});
