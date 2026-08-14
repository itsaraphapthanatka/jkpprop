/* Validating a lease before it reaches the table.
 *
 * The lease book was written once by the installer's seed and never again —
 * there was no create route at all — so these rules are new, and they are the
 * ones that keep the expiry bell honest: a real property code, an end date
 * that parses, and a rent that is a number.
 */
import { ApiError } from './api';
import { db } from './db';
import { audit } from './audit';
import type { Deal, User } from '@prisma/client';

export type LeaseInput = {
  code: string; title: string; tenant: string;
  startDate: Date | null; endDate: Date; rent: number; status: string; href: string;
};

const STATUSES = ['active', 'renewed', 'closed'];
const INT4_MAX = 2_147_483_647;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/* A date-only value is read as UTC midnight, not local midnight: the server
   runs in UTC and the team types in Bangkok time, so "2027-01-31" parsed
   locally comes back out of toISOString() as the 30th — the contract would
   show, and count down to, the wrong day. */
const date = (v: unknown): Date | null => {
  if (typeof v !== 'string' || !v.trim()) return null;
  const s = v.trim();
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function leaseInput(body: Record<string, unknown>): LeaseInput {
  const code = str(body.code, 40).toUpperCase();
  if (!code) throw new ApiError('VALIDATION', 'กรุณาระบุรหัสทรัพย์', 400, { code: 'กรุณาระบุรหัสทรัพย์' });

  const tenant = str(body.tenant, 200);
  if (!tenant) throw new ApiError('VALIDATION', 'กรุณาระบุชื่อผู้เช่า', 400, { tenant: 'กรุณาระบุชื่อผู้เช่า' });

  const endDate = date(body.endDate);
  if (!endDate) throw new ApiError('VALIDATION', 'กรุณาระบุวันสิ้นสุดสัญญา', 400, { endDate: 'กรุณาระบุวันสิ้นสุดสัญญา' });
  const startDate = date(body.startDate);
  /* a lease that ends before it starts is a typo, and it would show up in the
     bell as "เกินกำหนด" the day it was entered */
  if (startDate && startDate > endDate) {
    throw new ApiError('VALIDATION', 'วันสิ้นสุดต้องอยู่หลังวันเริ่มสัญญา', 400, { endDate: 'ต้องอยู่หลังวันเริ่มสัญญา' });
  }

  const rentRaw = Math.round(Number(body.rent ?? 0));
  if (!Number.isFinite(rentRaw) || rentRaw < 0 || rentRaw > INT4_MAX) {
    throw new ApiError('VALIDATION', 'ค่าเช่าไม่ถูกต้อง', 400, { rent: 'กรอกเป็นตัวเลข' });
  }

  const status = STATUSES.includes(String(body.status)) ? String(body.status) : 'active';

  return {
    code, tenant, endDate, startDate, rent: rentRaw, status,
    title: str(body.title, 300),
    href: str(body.href, 300) || '/admin/deals',
  };
}

/* A won rental deal becomes a lease.
 *
 * Kept here rather than in the route so the rules stay next to the validator:
 * the property comes from the deal, the rent from the offer that was accepted
 * (falling back to the deal amount), and nothing is written twice for the
 * same deal.
 */

export async function leaseFromDeal(deal: Deal, endDateRaw: string, tenantRaw: string, user: User) {
  const endDate = date(endDateRaw);
  if (!endDate) return null;

  const property = deal.propertyId
    ? await db.property.findFirst({ where: { id: deal.propertyId, orgId: deal.orgId } })
    : null;
  if (!property) return null; // a lease has to name a property

  // the same deal closed twice must not open a second contract
  const already = await db.lease.findFirst({ where: { orgId: deal.orgId, href: `/admin/deals/${deal.id}` } });
  if (already) return { id: already.id, endDate: already.endDate.toISOString().slice(0, 10) };

  const lead = deal.leadId ? await db.lead.findFirst({ where: { id: deal.leadId } }) : null;
  const tenant = str(tenantRaw, 200) || lead?.company || lead?.name || "";
  if (!tenant) return null; // nothing to put in the tenant column but a guess

  const values = (property.values ?? {}) as Record<string, unknown>;
  const rent = typeof values.price_rent === "number" ? values.price_rent : deal.amount;

  const created = await db.lease.create({
    data: {
      orgId: deal.orgId,
      code: property.publicCode,
      title: property.title,
      tenant,
      startDate: new Date(),
      endDate,
      rent: Math.max(0, Math.round(rent)),
      status: "active",
      href: `/admin/deals/${deal.id}`,
    },
  });
  await audit({
    user, orgId: deal.orgId, action: "lease.create", entity: "lease", entityId: created.id,
    after: { from: `deal ${deal.id}`, code: created.code, tenant: created.tenant, endDate: created.endDate },
  });
  return { id: created.id, endDate: created.endDate.toISOString().slice(0, 10) };
}
