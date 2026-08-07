/* ============================================================
   API helpers — one error shape for the whole system:
   { error: { code, message, fields? } }  (FRONTEND_API_SPEC §1)
   `message` is Thai and ready to show to the user.
   ============================================================ */
import { NextResponse } from 'next/server';

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;
  constructor(code: string, message: string, status = 400, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

export function fail(code: string, message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

/** Wrap a route handler so a thrown ApiError becomes the standard envelope. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.code, e.message, e.status, e.fields);
      console.error('[api]', e);
      return fail('INTERNAL', 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง', 500);
    }
  };
}

/* ---- PII masking (FRONTEND_API_SPEC §12.2 #3) ---- */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 7) return phone ? 'xxx-xxxx' : '';
  return `${digits.slice(0, 3)}-xxx-${digits.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email ? '***' : '';
  return `${email[0]}***${email.slice(at)}`;
}

/* ---- tiny in-memory rate limiter for public endpoints (🔵 PUBLIC) ---- */
const hits = new Map<string, { n: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.resetAt < now) {
    hits.set(key, { n: 1, resetAt: now + windowMs });
    return;
  }
  h.n += 1;
  if (h.n > limit) throw new ApiError('RATE_LIMITED', 'ส่งคำขอถี่เกินไป กรุณาลองใหม่ภายหลัง', 429);
}

export const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
