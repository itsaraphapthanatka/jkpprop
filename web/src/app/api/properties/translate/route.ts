/* POST /api/properties/translate — write the English and Chinese headline into
   every record that has none.  owner + manager + marketing + translator

   The site already reads in three languages: with no stored translation the
   headline is composed from the record's own fields (lib/propertyTitle). But
   the record itself stayed empty, so /admin/properties said "แปลไม่ครบ 3 ภาษา
   393" — true about the database and misleading about the website — and the
   team had no text to correct, only a blank box.

   This writes that composed headline in, once, so every record has something a
   human can edit. It never touches a language somebody has already written,
   and re-running only picks up what is still missing. */
import { ok, handler } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { parseI18n, TRANSLATABLE } from '@/lib/server/propertyI18n';
import { composeTitle, canCompose } from '@/lib/propertyTitle';
import { displayArea, stripInternal } from '@/lib/server/propertyDto';
import { propertyType } from '@/lib/propertySchema';
import { loadGeoLabels } from '@/lib/server/geoLabels';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'marketing', 'translator');
  const dry = new URL(req.url).searchParams.get('dry') === '1';

  const [rows, geo] = await Promise.all([
    db.property.findMany({ where: { orgId: user.orgId } }),
    loadGeoLabels(user.orgId),
  ]);

  let written = 0;
  const skipped: string[] = [];

  for (const p of rows) {
    const have = parseI18n(p.i18n);
    const missing = TRANSLATABLE.filter((l) => !have[l]?.title);
    if (!missing.length) continue;

    const values = stripInternal(p.typeKey, (p.values ?? {}) as Record<string, unknown>, null);
    const parts = {
      typeLabel: propertyType(p.typeKey).label,
      values,
      area: displayArea(values),
      code: p.publicCode,
    };
    /* No type and no address is not something to invent a headline from — the
       Thai title says more than a code in brackets would. */
    if (!canCompose(parts)) { skipped.push(p.publicCode); continue; }

    const next = { ...have } as Record<string, { title: string; description: string }>;
    for (const l of missing) {
      next[l] = { title: composeTitle(parts, l, geo), description: have[l]?.description ?? '' };
    }
    written++;
    if (!dry) {
      await db.property.update({ where: { id: p.id }, data: { i18n: next as Prisma.InputJsonValue } });
    }
  }

  if (!dry && written) {
    await audit({
      user, orgId: user.orgId, action: 'property.translate.bulk', entity: 'property', entityId: 'bulk',
      after: { written, skipped: skipped.length },
    });
  }
  return ok({ written, skipped, dry });
});
