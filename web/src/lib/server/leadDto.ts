/* Lead responses — PII masked by default (§12.2 #3); the full value comes
   only from POST /api/leads/:id/reveal-contact, which is audit-logged. */
import type { Lead, User } from '@prisma/client';
import { hasPriv } from './auth';
import { maskPhone, maskEmail } from './api';

export function leadDto(l: Lead, user: User, agentName?: string | null) {
  const pii = hasPriv(user, 'pii');
  return {
    id: l.id,
    createdAt: l.createdAt.getTime(),
    name: l.name,
    phone: pii ? l.phone : maskPhone(l.phone),
    email: pii ? l.email : maskEmail(l.email),
    piiMasked: !pii,
    company: l.company ?? '',
    respondentType: l.respondentType ?? '',
    message: l.message,
    typeKey: l.typeKey,
    typeLabel: l.typeLabel,
    dealIntent: l.dealIntent,
    req: (l.req ?? []) as { k: string; v: string }[],
    source: l.source,
    status: l.status,
    assigneeId: l.assigneeId,
    agentName: agentName ?? null,
  };
}
