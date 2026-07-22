import type { NextRequest } from 'next/server';
import { contactInquirySchema, zodIssuesToApiErrors } from '@/data/intake';
import { checkRateLimit } from '@/lib/rate-limit';
import { apiFail, apiOk } from '@/lib/api-response';

/**
 * POST /api/v1/public/inquiries — contact + listing-bound inquiry (FR-INQ-01/03).
 * Same envelope + validation + honeypot + rate limit as requirements. Mock: logs
 * and returns a leadId; real impl creates/matches lead + lead_contact, records
 * the listing relation for listing-bound inquiries, and sets source_channel.
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

  if (!checkRateLimit(`inquiry:${ip}`)) {
    return apiFail([{ code: 'RATE_LIMITED', message: 'rate_limited' }], requestId, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiFail([{ code: 'VALIDATION_ERROR', message: 'invalid_json' }], requestId, 400);
  }

  if (body && typeof body === 'object' && 'hp' in body && (body as { hp?: string }).hp) {
    return apiOk({ leadId: 'dropped' }, requestId, 201);
  }

  const parsed = contactInquirySchema.safeParse(body);
  if (!parsed.success) {
    return apiFail(zodIssuesToApiErrors(parsed.error), requestId, 422);
  }

  const leadId = crypto.randomUUID();
  console.info('[intake] inquiry →', {
    leadId,
    source: parsed.data.sourceChannel,
    listingId: parsed.data.listingId ?? null,
    publicCode: parsed.data.publicCode ?? null,
  });

  return apiOk({ leadId }, requestId, 201);
}
