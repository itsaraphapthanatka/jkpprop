/* GET /api/field-schema — all SchemaOverrides in one call (§3.1).
   Shape: Record<typeKey, { disabled, order, extra }> — same as the old
   localStorage key jkp.fieldSchema.v1, so the client cache slots right in. */
import { ok, handler } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import type { FieldDef, SchemaOverride } from '@/lib/propertySchema';

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.fieldOverride.findMany({ where: { orgId: user.orgId } });
  const out: Record<string, SchemaOverride> = {};
  for (const r of rows) {
    out[r.typeKey] = {
      disabled: r.disabled,
      order: r.order,
      extra: (r.extra as FieldDef[] | null) ?? [],
      /* ข้อ 10 · ช่องไหนถูกสั่งทับว่าบังคับ/ไม่บังคับ */
      required: (r.required as Record<string, boolean> | null) ?? {},
      edits: (r.edits as SchemaOverride['edits'] | null) ?? {},
    };
  }
  return ok(out);
});
