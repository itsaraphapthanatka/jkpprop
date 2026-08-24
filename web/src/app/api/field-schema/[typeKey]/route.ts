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
    ...(typeof f.labelEn === 'string' ? { labelEn: f.labelEn.slice(0, 200) } : {}),
    ...(typeof f.labelZh === 'string' ? { labelZh: f.labelZh.slice(0, 200) } : {}),
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

  const body = (await req.json().catch(() => null)) as { disabled?: unknown; order?: unknown; extra?: unknown; required?: unknown } | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const disabled = Array.isArray(body.disabled) ? body.disabled.map(String) : [];
  const order = Array.isArray(body.order) ? body.order.map(String) : [];
  const extra = sanitizeExtra(body.extra);

  /* เด็ค Web 2026 ข้อ 10 · "บังคับ" ตั้งเองได้แล้ว — รับเฉพาะคีย์ที่มีอยู่จริง
     ในประเภทนี้ (รวมฟิลด์ที่เพิ่มเอง) และเก็บเฉพาะค่าที่ต่างจากค่าตั้งต้น
     จะได้ไม่บวมเป็นแผนที่ของทุกฟิลด์ */
  const known = new Map([...type.fields, ...extra].map((f) => [f.key, !!f.required]));
  const reqIn = (body.required && typeof body.required === 'object' ? body.required : {}) as Record<string, unknown>;
  const required: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(reqIn)) {
    if (!known.has(k)) continue;
    const want = v === true || v === 'true';
    if (want !== known.get(k)) required[k] = want;
  }

  // ช่องที่บังคับกรอกจะปิดไม่ได้ — ตัดออกแทนที่จะ error เพื่อให้ client เก่า
  // ไม่มีทางปิดมันได้ (§8) · ใช้ค่าหลังรวมกับที่ตั้งทับไว้
  const isReq = (k: string) => required[k] ?? known.get(k) ?? false;
  const cleanDisabled = disabled.filter((k) => !isReq(k));

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
    required: Object.fromEntries(Object.entries(required).map(([k, v]) => [remap(k), v])) as Prisma.InputJsonValue,
  };
  const saved = await db.fieldOverride.upsert({
    where: { orgId_typeKey: { orgId: user.orgId, typeKey } },
    create: { orgId: user.orgId, typeKey, ...data },
    update: data,
  });

  await audit({
    user, orgId: user.orgId, action: 'fieldSchema.save', entity: 'fieldOverride', entityId: typeKey,
    before: prev ? { disabled: prev.disabled, order: prev.order, extra: prev.extra, required: prev.required } : null,
    after: { disabled: saved.disabled, order: saved.order, extra: saved.extra, required: saved.required },
  });

  /* ต้องส่ง required กลับไปด้วย ไม่งั้นหน้าจอเอาคำตอบไปทับ state ตัวเองแล้ว
     ป้าย "บังคับ" เด้งกลับค่าเดิมทันทีที่กดบันทึก (ข้อ 10) */
  return ok({ disabled: saved.disabled, order: saved.order, extra: saved.extra, required: saved.required });
});
