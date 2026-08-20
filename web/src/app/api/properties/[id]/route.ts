/* Single property (§5.1): GET / PATCH / DELETE.
   - public_code is immutable (§8)
   - values are returned exactly as stored, even keys later disabled in the
     schema (§5.1 warning) — the form decides what to render
   - price edits on a published record need the 'price' privilege (§12.4)
   - scope 'own' users can only touch their own rows (§12.2 #2) */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole, hasPriv } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { propertyDto } from '@/lib/server/propertyDto';
import { parseI18n } from '@/lib/server/propertyI18n';
import type { Prisma, User } from '@prisma/client';

const PRICE_KEYS = ['price', 'price_rent', 'price_sale', 'price_per_sqm'];

async function findScoped(id: string, user: User) {
  const p = await db.property.findFirst({ where: { id, orgId: user.orgId } });
  if (!p) throw new ApiError('NOT_FOUND', 'ไม่พบทรัพย์นี้', 404);
  if (user.scope === 'own' && p.ownerId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะทรัพย์ของตัวเอง', 403);
  }
  return p;
}

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  // accept either row id or public_code — the UI links by code
  const p = await db.property.findFirst({
    where: { orgId: user.orgId, OR: [{ id }, { publicCode: id }] },
  });
  if (!p) throw new ApiError('NOT_FOUND', 'ไม่พบทรัพย์นี้', 404);
  if (user.scope === 'own' && p.ownerId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะทรัพย์ของตัวเอง', 403);
  }
  const listing = await db.listing.findFirst({ where: { propertyId: p.id }, select: { status: true } });
  return ok({ ...propertyDto(p, user), available: listing?.status !== 'unavailable' });
});

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'ops', 'agent');
  const { id } = await ctx.params;
  const p = await findScoped(id, user);

  const body = (await req.json().catch(() => null)) as
    | { title?: string; status?: string; values?: Record<string, unknown>; publicCode?: string; i18n?: unknown; available?: boolean }
    | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);
  if (body.publicCode && body.publicCode !== p.publicCode) {
    throw new ApiError('IMMUTABLE', 'public_code แก้ไขไม่ได้หลังสร้าง', 400);
  }

  const data: Prisma.PropertyUpdateInput = {};
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (body.status && ['draft', 'active', 'hidden', 'archived'].includes(body.status)) data.status = body.status;
  // sent whole: the editor holds every language on screen, so a missing one is
  // a deletion rather than an omission
  if (body.i18n !== undefined) data.i18n = parseI18n(body.i18n) as Prisma.InputJsonValue;
  if (body.values && typeof body.values === 'object') {
    const prevVals = (p.values ?? {}) as Record<string, unknown>;
    const nextVals = body.values as Record<string, unknown>;
    // published record + price change → 'price' privilege (§12.4)
    if (p.status === 'active') {
      const priceChanged = PRICE_KEYS.some(
        (k) => JSON.stringify(prevVals[k] ?? null) !== JSON.stringify(nextVals[k] ?? null),
      );
      if (priceChanged && !hasPriv(user, 'price')) {
        throw new ApiError('FORBIDDEN', 'ต้องมีสิทธิ์ "แก้ราคาหลังเผยแพร่" จึงจะแก้ราคาได้', 403);
      }
    }
    // internalOnly guard: a user without the privilege never sees the note, so
    // their payload omits it — keep the stored value instead of erasing it
    if (!hasPriv(user, 'internal_note') && prevVals.internal_note !== undefined && nextVals.internal_note === undefined) {
      nextVals.internal_note = prevVals.internal_note;
    }
    data.values = nextVals as Prisma.InputJsonValue;
  }

  const before = { title: p.title, status: p.status, values: p.values, i18n: p.i18n };
  const updated = await db.property.update({ where: { id: p.id }, data });

  /* ว่าง/ไม่ว่าง อยู่คนละตารางกับตัวทรัพย์ — นำเข้าครั้งแรกกรอกมาแล้ว 129
     รายการ แต่ไม่มีที่ไหนให้ทีมแก้เมื่อทรัพย์ว่างอีกครั้ง */
  if (typeof body.available === 'boolean') {
    const status = body.available ? 'published' : 'unavailable';
    const listing = await db.listing.findFirst({ where: { propertyId: p.id }, select: { id: true } });
    if (listing) await db.listing.update({ where: { id: listing.id }, data: { status } });
    else await db.listing.create({ data: { orgId: p.orgId, propertyId: p.id, status } });
  }

  await audit({
    user, orgId: user.orgId, action: 'property.update', entity: 'property', entityId: p.id,
    before, after: { title: updated.title, status: updated.status, values: updated.values, i18n: updated.i18n },
  });

  const after = await db.listing.findFirst({ where: { propertyId: p.id }, select: { status: true } });
  return ok({ ...propertyDto(updated, user), available: after?.status !== 'unavailable' });
});

export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager'); // destructive — tightest pair in the MATRIX
  const { id } = await ctx.params;
  const p = await findScoped(id, user);

  await db.property.delete({ where: { id: p.id } });
  await audit({
    user, orgId: user.orgId, action: 'property.delete', entity: 'property', entityId: p.id,
    before: { publicCode: p.publicCode, title: p.title },
  });
  return ok({ ok: true });
});
