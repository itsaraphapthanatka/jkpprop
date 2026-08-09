/* Properties (§5.1).
   GET  — list + filters type/province/status/q + summary numbers
   POST — create (draft allowed) · SERVER generates public_code (FR-ADM-08)
   Scope: users with scope 'own' only see their own records (§12.2 #2). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole, scopeWhere } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { nextPublicCode } from '@/lib/server/publicCode';
import { propertyDto, displayProvince } from '@/lib/server/propertyDto';
import { PROPERTY_TYPES } from '@/lib/propertySchema';
import type { Prisma } from '@prisma/client';

/* UI filter chips send Thai labels — map both label and key */
const TYPE_KEYS: Record<string, string[]> = {
  โกดัง: ['warehouse'],
  โรงงาน: ['factory'],
  ที่ดิน: ['land'],
  บ้าน: ['house'],
  คอนโด: ['condo'],
  โชว์รูม: ['showroom'],
};
const STATUS_MAP: Record<string, string> = { เผยแพร่: 'active', ร่าง: 'draft' };

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || '';
  const province = url.searchParams.get('province') || '';
  const status = url.searchParams.get('status') || '';
  const q = (url.searchParams.get('q') || '').trim();

  const where: Prisma.PropertyWhereInput = { orgId: user.orgId, ...scopeWhere(user, 'ownerId') };
  if (type && type !== 'ทั้งหมด') {
    const keys = TYPE_KEYS[type] ?? [type];
    where.typeKey = { in: keys };
  }
  if (status && status !== 'ทั้งหมด' && STATUS_MAP[status]) where.status = STATUS_MAP[status];
  if (q) {
    where.OR = [
      { publicCode: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
    ];
  }

  const rows = await db.property.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 500 });
  let items = rows.map((p) => propertyDto(p, user));
  if (province && province !== 'ทั้งหมด') {
    items = items.filter((i) => displayProvince(i.values).includes(province));
  }

  // summary strip (4 cards) — computed over the caller's visible set
  const all = await db.property.findMany({
    where: { orgId: user.orgId, ...scopeWhere(user, 'ownerId') },
    select: { status: true },
  });
  const summary = {
    total: all.length,
    published: all.filter((s) => s.status === 'active').length,
    draft: all.filter((s) => s.status === 'draft').length,
    transIncomplete: 0, // translations arrive with the i18n phase
  };

  return ok({ items, summary });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  // MATRIX "สร้าง / แก้ไขทรัพย์": owner/manager/ops = yes, agent = scope(own)
  requireRole(user, 'owner', 'manager', 'ops', 'agent');

  const body = (await req.json().catch(() => null)) as
    | { typeKey?: string; title?: string; values?: Record<string, unknown>; status?: string }
    | null;
  const typeKey = String(body?.typeKey || '');
  const type = PROPERTY_TYPES.find((t) => t.key === typeKey);
  if (!type) throw new ApiError('VALIDATION', 'กรุณาเลือกประเภททรัพย์', 400);

  // "ปิดประเภท = ปิดรับของใหม่" (§3.2) — reject creating a disabled type
  const org = await db.org.findUnique({ where: { id: user.orgId }, select: { disabledTypes: true } });
  if (org?.disabledTypes.includes(typeKey)) {
    throw new ApiError('TYPE_DISABLED', 'ประเภททรัพย์นี้ปิดรับข้อมูลใหม่อยู่', 400);
  }

  const title = String(body?.title || '').trim();
  if (!title) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อทรัพย์', 400, { title: 'กรุณากรอกชื่อทรัพย์' });
  const values = (body?.values && typeof body.values === 'object' ? body.values : {}) as Record<string, unknown>;
  const status = body?.status === 'active' ? 'active' : 'draft';

  const publicCode = await nextPublicCode(user.orgId, displayProvince(values));
  const created = await db.property.create({
    data: {
      orgId: user.orgId,
      publicCode,
      typeKey,
      title,
      status,
      values: values as Prisma.InputJsonValue,
      ownerId: user.id,
    },
  });

  await audit({
    user, orgId: user.orgId, action: 'property.create', entity: 'property', entityId: created.id,
    after: { publicCode, typeKey, title, status },
  });

  return ok(propertyDto(created, user), { status: 201 });
});
