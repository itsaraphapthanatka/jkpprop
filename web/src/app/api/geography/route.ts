/* Geography (§10 step 3) — provinces / districts / subdistricts + industrial
   estates, assembled into the exact shape GeographyBody renders.
   GET  — any signed-in user (form options come from here)
   POST — owner + ops (MATRIX "พื้นที่ & นิคม")  body:
          { level: 'prov'|'dist'|'sub'|'zone', ...fields }

   Every node carries its id and how many published properties sit in it. The
   page could only add before, so a typo was permanent and nothing on it could
   be checked against reality; the counts are what make a wrong district
   visible ("บางพลี 74" next to "บางพลี 0" says which one the team types). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { inventoryCounts, countFor, bareName as bare } from '@/lib/server/geoCounts';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  const user = await requireUser();
  const [items, counts] = await Promise.all([
    db.geoItem.findMany({ where: { orgId: user.orgId }, orderBy: { name: 'asc' } }),
    inventoryCounts(user.orgId),
  ]);

  /* Every level carries all three languages — the page has always said so in
     its own subtitle while storing English on provinces alone. */
  const lang = (x: { meta: unknown }) => {
    const m = (x.meta ?? {}) as { en?: string; zh?: string };
    return { en: m.en ?? '', zh: m.zh ?? '' };
  };

  const provinces = items.filter((i) => i.kind === 'province').map((p) => ({
    id: p.id,
    th: p.name,
    ...lang(p),
    code: p.code ?? '',
    count: countFor(counts.prov, p.name),
    districts: items
      .filter((d) => d.kind === 'district' && d.parentId === p.id)
      .map((d) => ({ id: d.id, name: d.name, ...lang(d), count: countFor(counts.dist, d.name) })),
  }));

  const subMap: Record<string, { id: string; name: string; count: number }[]> = {};
  for (const d of items.filter((i) => i.kind === 'district')) {
    const subs = items
      .filter((s) => s.kind === 'subdistrict' && s.parentId === d.id)
      .map((s) => ({ id: s.id, name: s.name, ...lang(s), count: countFor(counts.sub, s.name) }));
    if (subs.length) subMap[d.name] = subs;
  }

  const zones = items.filter((i) => i.kind === 'estate').map((z) => {
    const meta = (z.meta ?? {}) as { type?: string; active?: boolean };
    const prov = items.find((p) => p.id === z.parentId);
    return {
      id: z.id,
      name: z.name,
      ...lang(z),
      type: meta.type ?? 'นิคมอุตสาหกรรม',
      province: prov?.name ?? '',
      /* was a number typed into the form and shown as if it meant something.
         An estate's property count is a fact about the inventory. */
      count: prov ? countFor(counts.prov, prov.name) : 0,
      active: meta.active !== false,
    };
  });

  /* Places the inventory uses that the tree has never heard of. This is the
     list that turns the page from a form into something worth opening. */
  const known = {
    prov: new Set(items.filter((i) => i.kind === 'province').map((i) => bare(i.name))),
    dist: new Set(items.filter((i) => i.kind === 'district').map((i) => bare(i.name))),
    sub: new Set(items.filter((i) => i.kind === 'subdistrict').map((i) => bare(i.name))),
  };
  const missing = {
    prov: [...counts.prov].filter(([n]) => !known.prov.has(bare(n))).map(([name, count]) => ({ name, count })),
    dist: [...counts.dist].filter(([n]) => !known.dist.has(bare(n))).map(([name, count]) => ({ name, count })),
    sub: [...counts.sub].filter(([n]) => !known.sub.has(bare(n))).map(([name, count]) => ({ name, count })),
  };

  return ok({ provinces, subMap, zones, missing });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'ops');

  const body = (await req.json().catch(() => null)) as
    | { level?: string; th?: string; en?: string; zh?: string; code?: string; parent?: string; type?: string }
    | null;
  const name = String(body?.th || '').trim();
  if (!body || !name) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อ', 400, { th: 'กรุณากรอกชื่อ' });

  const orgId = user.orgId;
  const findParent = async (kind: string, parentName: string) => {
    const p = await db.geoItem.findFirst({ where: { orgId, kind, name: parentName } });
    if (!p) throw new ApiError('VALIDATION', 'ไม่พบพื้นที่แม่ที่เลือก', 400);
    return p;
  };
  /* Two districts with the same name under one province is a typo every time,
     and it produced two rows that could not be told apart on the page. */
  const mustBeNew = async (kind: string, parentId: string | null) => {
    const dup = await db.geoItem.findFirst({ where: { orgId, kind, name, parentId } });
    if (dup) throw new ApiError('VALIDATION', `มี "${name}" อยู่แล้ว`, 400, { th: `มี "${name}" อยู่แล้ว` });
  };

  let created;
  if (body.level === 'prov') {
    await mustBeNew('province', null);
    created = await db.geoItem.create({
      data: { orgId, kind: 'province', name, code: (body.code || '').toUpperCase().slice(0, 3) || null, meta: { en: body.en || '', zh: body.zh || '' } },
    });
  } else if (body.level === 'dist') {
    const p = await findParent('province', String(body.parent || ''));
    await mustBeNew('district', p.id);
    created = await db.geoItem.create({ data: { orgId, kind: 'district', name, parentId: p.id, meta: { en: body.en || '', zh: body.zh || '' } } });
  } else if (body.level === 'sub') {
    const p = await findParent('district', String(body.parent || ''));
    await mustBeNew('subdistrict', p.id);
    created = await db.geoItem.create({ data: { orgId, kind: 'subdistrict', name, parentId: p.id, meta: { en: body.en || '', zh: body.zh || '' } } });
  } else if (body.level === 'zone') {
    const p = await findParent('province', String(body.parent || ''));
    await mustBeNew('estate', p.id);
    created = await db.geoItem.create({ data: { orgId, kind: 'estate', name, parentId: p.id, meta: { type: body.type || 'นิคมอุตสาหกรรม', active: true, en: body.en || '', zh: body.zh || '' } } });
  } else {
    throw new ApiError('VALIDATION', 'ระดับพื้นที่ไม่ถูกต้อง', 400);
  }

  await audit({ user, orgId, action: 'geography.create', entity: 'geoItem', entityId: created.id, after: { kind: created.kind, name } });
  return ok({ id: created.id });
});
