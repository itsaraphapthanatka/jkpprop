/* Every file upload in the admin was broken by one line in this wrapper.
 *
 * It set `Content-Type: application/json` on any request with a body. For a
 * FormData body the browser has to set that header itself, because only it
 * knows the multipart boundary it generated. Overriding it meant the server
 * received multipart bytes labelled as JSON, parsed no fields, and answered
 * "ไม่พบไฟล์ที่อัปโหลด" — for the media library and for both SEO files. */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch } from '../../src/lib/apiClient.ts';

const realFetch = globalThis.fetch;
let seen: RequestInit | undefined;

beforeEach(() => {
  seen = undefined;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    seen = init;
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
});
afterEach(() => { globalThis.fetch = realFetch; });

const headerOf = (init?: RequestInit) => new Headers(init?.headers as HeadersInit | undefined).get('content-type');

describe('apiFetch and request bodies', () => {
  test('a FormData body is left for the browser to label', async () => {
    const form = new FormData();
    form.append('file', new File(['hello'], 'llms.txt', { type: 'text/plain' }));
    await apiFetch('/api/seo/files/llms', { method: 'POST', body: form });
    assert.equal(headerOf(seen), null, 'setting Content-Type here strips the multipart boundary');
  });

  test('the FormData itself is passed through untouched', async () => {
    const form = new FormData();
    form.append('file', new File(['x'], 'robots.txt', { type: 'text/plain' }));
    await apiFetch('/api/seo/files/robots', { method: 'POST', body: form });
    assert.ok(seen?.body instanceof FormData);
    assert.equal((seen!.body as FormData).get('file') instanceof File, true);
  });

  test('a JSON body still gets the JSON header', async () => {
    await apiFetch('/api/sections', { method: 'PUT', body: JSON.stringify({ page: 'home' }) });
    assert.equal(headerOf(seen), 'application/json');
  });

  test('a request with no body gets no content type', async () => {
    await apiFetch('/api/media');
    assert.equal(headerOf(seen), null);
  });

  test('an explicit header from the caller still wins', async () => {
    await apiFetch('/api/x', { method: 'POST', body: 'raw', headers: { 'Content-Type': 'text/plain' } });
    assert.equal(headerOf(seen), 'text/plain');
  });
});
