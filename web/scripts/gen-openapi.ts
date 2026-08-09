/* Writes web/openapi.yaml from the TypeScript source of truth.

   SPEC_PACK §6 asks for a checked-in openapi.yaml; keeping it generated
   means it can never disagree with the document the app actually serves.
   Run with `npm run openapi`; CI fails if the committed file is stale. */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { openapi } from '../src/lib/openapi.ts';

const banner = [
  '# GENERATED FILE — do not edit by hand.',
  '# Source: web/src/lib/openapi.ts · regenerate with `npm run openapi`',
  '# Coverage is enforced by web/tests/unit/openapi.test.ts',
  '',
].join('\n');

const out = join(process.cwd(), 'openapi.yaml');
writeFileSync(out, banner + stringify(openapi, { lineWidth: 0 }));
console.log(`wrote ${out}`);
