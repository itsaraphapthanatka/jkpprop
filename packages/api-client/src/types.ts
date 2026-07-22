/**
 * API envelope contract (SPEC_PACK · Interface Requirements).
 * Every /api/v1 response uses `{ data, meta, errors }`. `errors[].field` maps
 * a validation error back onto a form field; field-less errors render as a
 * form-level banner.
 *
 * The concrete resource types (Listing, Lead, …) will be GENERATED from
 * `docs/openapi.yaml` (openapi-typescript / orval) in FE-0's tail — the FE
 * must not hand-guess resource shapes. This file defines only the envelope.
 */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ResponseMeta {
  requestId?: string;
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

/** Known error codes the UI must handle explicitly. */
export type ApiErrorCode =
  | 'INVALID_STATUS_TRANSITION'
  | 'AVAILABILITY_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | (string & {});

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Present when the error belongs to a specific input field. */
  field?: string;
}

export interface ApiResponse<TData = unknown> {
  data: TData | null;
  meta: ResponseMeta;
  errors: ApiError[];
}
