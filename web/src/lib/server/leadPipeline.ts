/* The nine lead statuses, and the only rule about them: they move forward.
 *
 * The list itself lived inside the leads PATCH route, so nothing else could
 * see it — and the spec's auto-advance ("สร้าง shortlist → shortlisted") was
 * never implemented, leaving the pipeline to be dragged along by hand. It is
 * shared from here now, and `advanceLead` is what events call.
 */
import { db } from './db';
import { audit } from './audit';
import type { User } from '@prisma/client';

export const PIPELINE = [
  'new',
  'qualified',
  'profile_received',
  'requirements_confirmed',
  'shortlisted',
  'visit_scheduled',
  'negotiating',
  'won',
  'lost',
] as const;

export type LeadStatus = (typeof PIPELINE)[number];

/** 'lost' is an exit, not a later stage — nothing may auto-advance past it. */
const TERMINAL = new Set<string>(['won', 'lost']);

export const rank = (status: string) => PIPELINE.indexOf(status as LeadStatus);

/** true when `to` is strictly later in the pipeline than `from` */
export function isForward(from: string, to: string): boolean {
  const a = rank(from);
  const b = rank(to);
  return a >= 0 && b >= 0 && b > a;
}

/* Move a lead to `target` if that is forward progress, and say nothing
 * otherwise. Called from the events the spec ties statuses to, so a stage that
 * already happened is never announced twice and a manual jump ahead is never
 * undone.
 *
 * Deliberately never throws: the caller's real work (confirming a requirement,
 * creating a shortlist) has already succeeded by the time this runs, and
 * failing the request over a status nudge would be worse than the nudge not
 * landing. It is audited either way.
 */
export async function advanceLead(
  leadId: string | null | undefined,
  target: LeadStatus,
  ctx: { user: User; orgId: string; reason: string },
): Promise<void> {
  if (!leadId) return;
  try {
    const lead = await db.lead.findFirst({ where: { id: leadId, orgId: ctx.orgId } });
    if (!lead) return;
    if (TERMINAL.has(lead.status)) return;
    if (!isForward(lead.status, target)) return;

    await db.lead.update({ where: { id: leadId }, data: { status: target } });
    await audit({
      user: ctx.user,
      orgId: ctx.orgId,
      action: 'lead.auto_advance',
      entity: 'lead',
      entityId: leadId,
      before: { status: lead.status },
      after: { status: target, reason: ctx.reason },
    });
  } catch {
    /* status is a side effect of the caller's action, never its purpose */
  }
}
