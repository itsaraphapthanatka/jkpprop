/* PUT /api/field-schema/:typeKey — Field Builder "บันทึก" (§3.1).
   Validation the server must own:
   - required fields cannot be disabled (§8)
   - custom-field keys are ISSUED BY THE SERVER (§3.1 warning): the in-memory
     client counter resets per refresh, so any new/colliding key is replaced
     with custom_{typeKey}_{kind}_{n} from a persistent per-type sequence.
   RBAC (MATRIX "Field Builder"): owner + ops only. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';
import { PROPERTY_TYPES, type FieldDef, type FieldKind } from '@/lib/propertySchema';

const KINDS: FieldKind[] = ['dealtype', 'text', 'textarea', 'number', 'price', 'date', 'select', 'multiselect', 'boolean', 'media', 'location', 'map', 'summary', 'group'];

function sanitizeExtra(raw: unknown): FieldDef[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((f): f is FieldDef =>
    !!f && typeof f === 'object'
    && typeof (f as FieldDef).key === 'string'
    && typeof (f as FieldDef).label === 'string'
    && KINDS.includes((f as FieldDef).kind),
  ).map((f) => ({
    key: f.key,
    label: f.label.slice(0, 200),
    kind: f.kind,
    ...(Array.isArray(f.options) ? { options: f.options.map(String).slice(0, 50) } : {}),
    ...(typeof f.unit === 'string' ? { unit: f.unit.slice(0, 40) } : {}),
    ...(typeof f.placeholder === 'string' ? { placeholder: f.placeholder.slice(0, 200) } : {}),
    ...(typeof f.note === 'string' ? { note: f.note.slice(0, 400) } : {}),
    ...(typeof f.section === 'string' ? { section: f.section.slice(0, 100) } : {}),
  }));
}

export const PUT = handler(async (req: Request, ctx: { params: Promise<{ typeKey: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'ops');
  const { typeKey } = await ctx.params;

  const type = PROPERTY_TYPES.find((t) => t.key === typeKey);
  if (!type) throw new ApiError('NOT_FOUND', 'ไม่พบประเภททรัพย์นี้', 404);

  const body = (await req.json().catch(() => null)) as { disabled?: unknown; order?: unknown; extra?: unknown } | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const disabled = Array.isArray(body.disabled) ? body.disabled.map(String) : [];
  const order = Array.isArray(body.order) ? body.order.map(String) : [];
  const extra = sanitizeExtra(body.extra);

  // required fields are locked on — strip them out instead of erroring so a
  // stale client can never disable them (§8)
  const requiredKeys = new Set(type.fields.filter((f) => f.required).map((f) => f.key));
  const cleanDisabled = disabled.filter((k) => !requiredKeys.has(k));

  const prev = await db.fieldOverride.findUnique({ where: { orgId_typeKey: { orgId: user.orgId, typeKey } } });

  // server-issued keys for custom fields (persistent sequence, no collisions)
  const baseKeys = new Set(type.fields.map((f) => f.key));
  const prevExtraKeys = new Set(((prev?.extra as FieldDef[] | null) ?? []).map((f) => f.key));
  let seq = prev?.extraSeq ?? 0;
  const seen = new Set<string>();
  const keyMap = new Map<string, string>(); // client key → issued key
  const issued = extra.map((f) => {
    const keep = prevExtraKeys.has(f.key) && !seen.has(f.key) && !baseKeys.has(f.key);
    let key = f.key;
    if (!keep) {
      seq += 1;
      key = `custom_${typeKey}_${f.kind}_${seq}`;
      keyMap.set(f.key, key);
    }
    seen.add(key);
    return { ...f, key };
  });
  // keep order/disabled pointing at the issued keys
  const remap = (k: string) => keyMap.get(k) ?? k;

  const data = {
    disabled: cleanDisabled.map(remap),
    order: order.map(remap),
    extra: issued as unknown as Prisma.InputJsonValue,
    extraSeq: seq,
  };
  const saved = await db.fieldOverride.upsert({
    where: { orgId_typeKey: { orgId: user.orgId, typeKey } },
    create: { orgId: user.orgId, typeKey, ...data },
    update: data,
  });

  await audit({
    user, orgId: user.orgId, action: 'fieldSchema.save', entity: 'fieldOverride', entityId: typeKey,
    before: prev ? { disabled: prev.disabled, order: prev.order, extra: prev.extra } : null,
    after: { disabled: saved.disabled, order: saved.order, extra: saved.extra },
  });

  return ok({ disabled: saved.disabled, order: saved.order, extra: saved.extra });
});
