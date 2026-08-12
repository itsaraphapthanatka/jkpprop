/* Requirement shaping, kept out of the route files so both the list and the
   detail endpoint describe a requirement the same way. */
import { db } from './db';
import type { Prisma, Requirement } from '@prisma/client';

export const REQUIREMENT_STATUSES = ['submitted', 'confirmed', 'shortlisted', 'cancelled'] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  submitted: 'รอตรวจสอบ',
  confirmed: 'ยืนยันแล้ว',
  shortlisted: 'ส่ง shortlist แล้ว',
  cancelled: 'ยกเลิก',
};

/* FR-CRM-07: a cancellation must name the requirement item that was the
   problem, not just a free-text excuse. */
export const CANCEL_FIELDS: { key: string; label: string }[] = [
  { key: 'budget', label: 'งบประมาณ' },
  { key: 'size', label: 'ขนาด' },
  { key: 'area', label: 'พื้นที่' },
  { key: 'license', label: 'ใบอนุญาต' },
  { key: 'timeline', label: 'ระยะเวลา' },
  { key: 'other', label: 'อื่น ๆ' },
];

export type LocationPick = { name: string };

export const asLocations = (v: unknown): LocationPick[] =>
  Array.isArray(v)
    ? v
        .map((x) => (x && typeof x === 'object' ? String((x as { name?: unknown }).name ?? '').trim() : String(x).trim()))
        .filter(Boolean)
        .slice(0, 10)
        .map((name) => ({ name }))
    : [];

/** REQ-1042 — a running number the team can say out loud. */
export async function nextRequirementCode(orgId: string): Promise<string> {
  const counter = await db.codeCounter.upsert({
    where: { orgId_prefix: { orgId, prefix: 'REQ' } },
    // start at 1001 so the first one reads like a record, not like a test
    create: { orgId, prefix: 'REQ', next: 1002 },
    update: { next: { increment: 1 } },
  });
  return `REQ-${counter.next - 1}`;
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** the writable fields, normalised — shared by create and update */
export function requirementInput(body: Record<string, unknown>) {
  const areaMin = num(body.areaMin);
  const areaMax = num(body.areaMax);
  const budgetMin = num(body.budgetMin);
  const budgetMax = num(body.budgetMax);
  const moveInRaw = typeof body.moveIn === 'string' && body.moveIn.trim() ? new Date(body.moveIn) : null;

  return {
    dealIntent: String(body.dealIntent ?? '').trim().slice(0, 40),
    typeKey: String(body.typeKey ?? '').trim().slice(0, 40),
    usage: String(body.usage ?? '').trim().slice(0, 120),
    // a reversed range is a typo, not a filter — store it the way round it reads
    areaMin: areaMin !== null && areaMax !== null ? Math.min(areaMin, areaMax) : areaMin,
    areaMax: areaMin !== null && areaMax !== null ? Math.max(areaMin, areaMax) : areaMax,
    budgetMin: budgetMin !== null && budgetMax !== null ? Math.min(budgetMin, budgetMax) : budgetMin,
    budgetMax: budgetMin !== null && budgetMax !== null ? Math.max(budgetMin, budgetMax) : budgetMax,
    moveIn: moveInRaw && !Number.isNaN(moveInRaw.getTime()) ? moveInRaw : null,
    needsRor4: body.needsRor4 === true || body.needsRor4 === 'true',
    nearPort: body.nearPort === true || body.nearPort === 'true',
    pollution: String(body.pollution ?? '').trim().slice(0, 200),
    note: String(body.note ?? '').trim().slice(0, 2000),
    locations: asLocations(body.locations) as unknown as Prisma.InputJsonValue,
  };
}

export type RequirementRow = Requirement & {
  lead: { id: string; name: string; company: string | null; status: string } | null;
  _count?: { checks: number; shortlists: number };
};

export function requirementDto(r: RequirementRow) {
  return {
    id: r.id,
    code: r.code,
    status: r.status,
    statusLabel: STATUS_LABEL[r.status] ?? r.status,
    leadId: r.leadId,
    leadName: r.lead?.name ?? '',
    company: r.lead?.company ?? '',
    leadStatus: r.lead?.status ?? '',
    dealIntent: r.dealIntent,
    typeKey: r.typeKey,
    usage: r.usage,
    areaMin: r.areaMin,
    areaMax: r.areaMax,
    budgetMin: r.budgetMin,
    budgetMax: r.budgetMax,
    moveIn: r.moveIn ? r.moveIn.getTime() : null,
    needsRor4: r.needsRor4,
    nearPort: r.nearPort,
    pollution: r.pollution,
    note: r.note,
    locations: asLocations(r.locations),
    cancelReason: r.cancelReason,
    cancelField: r.cancelField,
    checkCount: r._count?.checks ?? 0,
    shortlistCount: r._count?.shortlists ?? 0,
    createdAt: r.createdAt.getTime(),
    updatedAt: r.updatedAt.getTime(),
  };
}
