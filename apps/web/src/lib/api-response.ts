import { NextResponse } from 'next/server';
import type { ApiError } from '@jkp/api-client';

/** Success envelope `{ data, meta, errors: [] }`. */
export function apiOk<T>(data: T, requestId: string, status = 200) {
  return NextResponse.json({ data, meta: { requestId }, errors: [] }, { status });
}

/** Error envelope `{ data: null, meta, errors }`. */
export function apiFail(errors: ApiError[], requestId: string, status = 422) {
  return NextResponse.json({ data: null, meta: { requestId }, errors }, { status });
}
