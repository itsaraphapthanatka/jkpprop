/* Geography (§10 step 3) — provinces / districts / subdistricts + industrial
   estates, assembled into the exact shape GeographyBody renders.
   GET  — any signed-in user (form options come from here)
   POST — owner + ops (MATRIX "พื้นที่ & นิคม")  body:
          { level: 'prov'|'dist'|'sub'|'zone', ...fields } */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const GET = handler(async () => {
  const user = await requireUser();
  const items = await db.geoItem.findMany({ where: { orgId: user.orgId }, orderBy: { name: 'asc' } });

  const provinces = items.filter((i) => i.kind === 'province').map((p) => {
    const meta = (p.meta ?? {}) as { en?: string };
    return {
      id: p.id,
      th: p.name,
      en: meta.en ?? '',
      code: p.code ?? '',
      districts: items.filter((d) => d.kind === 'district' && d.parentId === p.id).map((d) => d.name),
    };
  });

  const subMap: Record<string, string[]> = {};
  for (const d of items.filter((i) => i.kind === 'district')) {
    const subs = items.filter((s) => s.kind === 'subdistrict' && s.parentId === d.id).map((s) => s.name);
    if (subs.length) subMap[d.name] = subs;
  }

  const zones = items.filter((i) => i.kind === 'estate').map((z) => {
    const meta = (z.meta ?? {}) as { type?: string; count?: string };
    const prov = items.find((p) => p.id === z.parentId);
    return { id: z.id, name: z.name, type: meta.type ?? 'นิคมอุตสาหกรรม', province: prov?.name ?? '', count: meta.count ?? '0' };
  });

  return ok({ provinces, subMap, zones });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'ops');

  const body = (await req.json().catch(() => null)) as
    | { level?: string; th?: string; en?: string; code?: string; parent?: string; type?: string }
    | null;
  const name = String(body?.th || '').trim();
  if (!body || !name) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อ', 400, { th: 'กรุณากรอกชื่อ' });

  const orgId = user.orgId;
  const findParent = async (kind: string, parentName: string) => {
    const p = await db.geoItem.findFirst({ where: { orgId, kind, name: parentName } });
    if (!p) throw new ApiError('VALIDATION', 'ไม่พบพื้นที่แม่ที่เลือก', 400);
    return p;
  };

  let created;
  if (body.level === 'prov') {
    created = await db.geoItem.create({
      data: { orgId, kind: 'province', name, code: (body.code || '').toUpperCase().slice(0, 3) || null, meta: { en: body.en || '' } },
    });
  } else if (body.level === 'dist') {
    const p = await findParent('province', String(body.parent || ''));
    created = await db.geoItem.create({ data: { orgId, kind: 'district', name, parentId: p.id } });
  } else if (body.level === 'sub') {
    const p = await findParent('district', String(body.parent || ''));
    created = await db.geoItem.create({ data: { orgId, kind: 'subdistrict', name, parentId: p.id } });
  } else if (body.level === 'zone') {
    const p = await findParent('province', String(body.parent || ''));
    created = await db.geoItem.create({ data: { orgId, kind: 'estate', name, parentId: p.id, meta: { type: body.type || 'นิคมอุตสาหกรรม', count: '0' } } });
  } else {
    throw new ApiError('VALIDATION', 'ระดับพื้นที่ไม่ถูกต้อง', 400);
  }

  await audit({ user, orgId, action: 'geography.create', entity: 'geoItem', entityId: created.id, after: { kind: created.kind, name } });
  return ok({ id: created.id });
});
