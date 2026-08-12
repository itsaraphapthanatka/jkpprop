/* ============================================================
   Client-side fetch wrapper — one place that understands the
   error envelope { error: { code, message, fields? } }.
   Every message is Thai and ready to render (FRONTEND_API_SPEC §1).
   ============================================================ */

export class ApiClientError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;
  constructor(code: string, message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

/* A FormData body must be sent with the boundary the browser generates. Set
 * Content-Type yourself and that boundary is missing, so the server sees
 * multipart bytes labelled as JSON and parses no fields at all — which is how
 * every upload in the admin came back "ไม่พบไฟล์ที่อัปโหลด": the media library
 * and both SEO files. Only stringified bodies get the JSON header. */
const isMultipart = (b: BodyInit | null | undefined) =>
  typeof FormData !== 'undefined' && b instanceof FormData;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  const jsonHeader = !!init?.body && !isMultipart(init.body);
  try {
    res = await fetch(path, {
      credentials: 'same-origin',
      headers: jsonHeader ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
      ...init,
    });
  } catch {
    throw new ApiClientError('NETWORK', 'เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่', 0);
  }
  if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    && !window.location.pathname.startsWith('/admin/login')) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  let body: unknown = null;
  try { body = await res.json(); } catch { /* empty body is fine for some endpoints */ }
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string; fields?: Record<string, string> } })?.error;
    throw new ApiClientError(err?.code || 'HTTP_' + res.status, err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่', res.status, err?.fields);
  }
  return body as T;
}

export const apiGet = <T,>(path: string) => apiFetch<T>(path);
export const apiPost = <T,>(path: string, data?: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });
export const apiPut = <T,>(path: string, data: unknown) =>
  apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(data) });
export const apiPatch = <T,>(path: string, data: unknown) =>
  apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDelete = <T,>(path: string) => apiFetch<T>(path, { method: 'DELETE' });
