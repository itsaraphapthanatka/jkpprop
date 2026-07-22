import type { NextRequest } from 'next/server';
import { requirementSchema, zodIssuesToApiErrors } from '@/data/intake';
import { checkRateLimit } from '@/lib/rate-limit';
import { apiFail, apiOk } from '@/lib/api-response';

/**
 * POST /api/v1/public/requirements — requirement intake (FR-INQ-02/03/04/05).
 * Server-side validation (same zod schema as the client) + honeypot + rate limit.
 * Mock: logs the payload and returns a leadId. Real impl creates
 * lead + company + lead_contact + requirement + requirement_locations and enters
 * the qualification stage.
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

  if (!checkRateLimit(`requirement:${ip}`)) {
    return apiFail([{ code: 'RATE_LIMITED', message: 'rate_limited' }], requestId, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiFail([{ code: 'VALIDATION_ERROR', message: 'invalid_json' }], requestId, 400);
  }

  // Honeypot: silently accept and drop (don't tip off bots).
  if (body && typeof body === 'object' && 'hp' in body && (body as { hp?: string }).hp) {
    return apiOk({ leadId: 'dropped' }, requestId, 201);
  }

  const parsed = requirementSchema.safeParse(body);
  if (!parsed.success) {
    return apiFail(zodIssuesToApiErrors(parsed.error), requestId, 422);
  }

  const leadId = crypto.randomUUID();
  console.info('[intake] requirement →', {
    leadId,
    source: parsed.data.sourceChannel,
    company: parsed.data.companyName,
    locations: parsed.data.locations.length,
  });

  return apiOk({ leadId }, requestId, 201);
}
