import { LEAD_STATUS, type LeadStatus } from './enums';

/**
 * Lead pipeline state machine (FR-CRM-02).
 *
 * The API is the authoritative enforcer — this mirror exists so the UI can
 * render only VALID transitions (e.g. the status dropdown disables invalid
 * targets with a tooltip). Auto-advance only moves FORWARD; it never demotes.
 *
 * Linear order:
 *   new → qualified → profile_received → requirements_confirmed →
 *   shortlisted → visit_scheduled → negotiating → won
 * plus: negotiating → lost, and any active (non-terminal) status → lost
 * (a lead can be marked lost at any active stage).
 */

const ORDER: LeadStatus[] = [
  'new',
  'qualified',
  'profile_received',
  'requirements_confirmed',
  'shortlisted',
  'visit_scheduled',
  'negotiating',
  'won',
];

const TERMINAL: ReadonlySet<LeadStatus> = new Set<LeadStatus>(['won', 'lost']);

/** Index of a status within the linear order, or -1 for `lost`. */
function orderIndex(status: LeadStatus): number {
  return ORDER.indexOf(status);
}

export function isTerminal(status: LeadStatus): boolean {
  return TERMINAL.has(status);
}

/** All statuses this status may transition to (excludes itself). */
export function nextStatuses(from: LeadStatus): LeadStatus[] {
  if (isTerminal(from)) return [];

  const next: LeadStatus[] = [];
  const idx = orderIndex(from);

  // Advance one step along the linear order.
  const forward = ORDER[idx + 1];
  if (forward) next.push(forward);

  // 'won' is only reachable from 'negotiating'.
  // (Already covered by the linear step since negotiating → won.)

  // A lead can be lost from any active stage.
  next.push('lost');

  return next;
}

/** Whether `to` is a valid transition target from `from`. */
export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return false;
  return nextStatuses(from).includes(to);
}

/** Guard used before firing a mutation; returns a typed error code on failure. */
export function assertTransition(
  from: LeadStatus,
  to: LeadStatus,
): { ok: true } | { ok: false; code: 'INVALID_STATUS_TRANSITION' } {
  return canTransition(from, to) ? { ok: true } : { ok: false, code: 'INVALID_STATUS_TRANSITION' };
}

export { LEAD_STATUS };
