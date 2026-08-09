/* The contract must describe the app that actually exists.

   This walks src/app/api for exported HTTP handlers and compares that set
   against the OpenAPI document, in both directions — so adding, renaming or
   deleting a route without touching the spec fails here rather than shipping
   a document that quietly drifts out of date. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { openapi } from '../../src/lib/openapi.ts';

const API_DIR = join(process.cwd(), 'src/app/api');
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/** every route.ts under src/app/api → "METHOD /api/path" with {params} */
function routesInCode(): Set<string> {
  const found = new Set<string>();
  const walk = (dir: string, urlPath: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        // [id] in the filesystem is {id} in OpenAPI
        const seg = entry.startsWith('[') && entry.endsWith(']') ? `{${entry.slice(1, -1)}}` : entry;
        walk(full, `${urlPath}/${seg}`);
      } else if (entry === 'route.ts') {
        const src = readFileSync(full, 'utf8');
        for (const m of METHODS) {
          if (new RegExp(`export const ${m}\\b`).test(src)) found.add(`${m} ${urlPath}`);
        }
      }
    }
  };
  walk(API_DIR, '/api');
  return found;
}

/** every operation described in the document */
function routesInSpec(): Set<string> {
  const found = new Set<string>();
  for (const [path, ops] of Object.entries(openapi.paths)) {
    for (const method of Object.keys(ops as object)) {
      found.add(`${method.toUpperCase()} ${path}`);
    }
  }
  return found;
}

const code = routesInCode();
const spec = routesInSpec();

describe('OpenAPI document', () => {
  test('every route in the code is documented', () => {
    const missing = [...code].filter((r) => !spec.has(r)).sort();
    assert.deepEqual(missing, [], `undocumented endpoints:\n  ${missing.join('\n  ')}`);
  });

  test('every documented route exists in the code', () => {
    const extra = [...spec].filter((r) => !code.has(r)).sort();
    assert.deepEqual(extra, [], `documented but missing from the code:\n  ${extra.join('\n  ')}`);
  });

  test('covers the whole surface, not a sample', () => {
    assert.ok(code.size >= 60, `expected the full API, found ${code.size} operations`);
    assert.equal(spec.size, code.size);
  });

  test('is a valid 3.1 document with the pieces tooling needs', () => {
    assert.equal(openapi.openapi, '3.1.0');
    assert.ok(openapi.info.title && openapi.info.version);
    assert.ok(openapi.components.securitySchemes.cookieAuth);
    assert.ok(Object.keys(openapi.components.schemas).length > 0);
  });

  test('every operation carries a summary and a tag', () => {
    const declared = new Set(openapi.tags.map((t) => t.name));
    for (const [path, ops] of Object.entries(openapi.paths)) {
      for (const [method, op] of Object.entries(ops as Record<string, { summary?: string; tags?: string[]; responses?: object }>)) {
        const at = `${method.toUpperCase()} ${path}`;
        assert.ok(op.summary, `${at} has no summary`);
        assert.ok(op.tags?.length, `${at} has no tag`);
        for (const t of op.tags!) assert.ok(declared.has(t), `${at} uses undeclared tag "${t}"`);
        assert.ok(op.responses && Object.keys(op.responses).length, `${at} documents no response`);
      }
    }
  });

  test('a path with {param} in the URL declares that parameter', () => {
    for (const [path, ops] of Object.entries(openapi.paths)) {
      const wanted = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      if (!wanted.length) continue;
      for (const [method, op] of Object.entries(ops as Record<string, { parameters?: { name: string; in: string }[] }>)) {
        const declared = (op.parameters ?? []).filter((p) => p.in === 'path').map((p) => p.name);
        for (const w of wanted) {
          assert.ok(declared.includes(w), `${method.toUpperCase()} ${path} does not declare path param "${w}"`);
        }
      }
    }
  });

  test('the endpoints that must work without a session are marked public', () => {
    // getting this wrong would tell an integrator to send credentials the
    // public site does not have
    const publicOps = [
      'POST /api/auth/login',
      'POST /api/public/leads',
      'GET /api/public/listings',
      'GET /api/public/properties/{code}',
      'GET /api/public/shortlists/{token}',
      'GET /api/branding',
      'GET /api/property-types/config',
      'GET /api/media/{id}/raw',
    ];
    for (const entry of publicOps) {
      const [method, path] = entry.split(' ');
      const op = (openapi.paths as Record<string, Record<string, { security?: unknown[] }>>)[path]?.[method.toLowerCase()];
      assert.ok(op, `${entry} is not in the document`);
      assert.deepEqual(op.security, [], `${entry} should be marked public`);
    }
  });
});
