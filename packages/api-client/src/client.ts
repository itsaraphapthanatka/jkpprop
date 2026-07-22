import type { ApiError, ApiResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';

/** Thrown when a request fails; carries the parsed `errors[]` for field mapping. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly errors: ApiError[];

  constructor(status: number, errors: ApiError[]) {
    super(errors[0]?.message ?? `Request failed with status ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errors = errors;
  }

  /** Errors that belong to a specific form field. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const e of this.errors) if (e.field) out[e.field] = e.message;
    return out;
  }
}

/**
 * Minimal typed fetch wrapper around the API envelope. Returns `data` on
 * success; throws `ApiRequestError` (with `errors[]`) otherwise.
 *
 * FE-0 stub: consumers pass the expected `TData`. Once the OpenAPI client is
 * generated, per-endpoint helpers should wrap this with concrete types.
 */
export async function fetchApi<TData>(
  path: string,
  init?: RequestInit,
): Promise<{ data: TData; meta: ApiResponse<TData>['meta'] }> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  let body: ApiResponse<TData>;
  try {
    body = (await res.json()) as ApiResponse<TData>;
  } catch {
    throw new ApiRequestError(res.status, [
      { code: 'PARSE_ERROR', message: 'Malformed response from server.' },
    ]);
  }

  if (!res.ok || body.data == null) {
    throw new ApiRequestError(res.status, body.errors?.length ? body.errors : [
      { code: 'UNKNOWN', message: 'Unexpected error.' },
    ]);
  }

  return { data: body.data, meta: body.meta };
}
