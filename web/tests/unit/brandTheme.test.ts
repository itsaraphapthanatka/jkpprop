/* /admin/branding saved colours to the database and the public site never read
   them, because every brand colour was hard-coded into inline styles. These
   pin the conversion the theme layer does — including the guard that stops an
   unvalidated value being interpolated straight into a <style> block. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../../src/lib/server/brandTheme.ts', import.meta.url), 'utf8');

describe('brandTheme source guarantees', () => {
  test('a colour is validated before it reaches the stylesheet', () => {
    assert.match(src, /HEX\.test\(hex\)/, 'every value must be checked against the hex pattern first');
  });

  test('the dark panel colours are derived from pine, not fixed', () => {
    assert.match(src, /darken\(b\.pine/);
  });
});

describe('the public components no longer hard-code brand colours', () => {
  const files = [
    'src/components/home/Hero.tsx',
    'src/components/home/WhyUs.tsx',
    'src/components/home/CtaBand.tsx',
    'src/components/site/AboutBody.tsx',
    'src/components/site/FaqBody.tsx',
  ];
  /* Any of these left behind is a spot the colour picker cannot reach. */
  const BRAND_HEX = /#(2DFB91|034956|273c33|022310|0D6C3B)/i;
  const BRAND_RGBA = /rgba\(\s*(45,\s*251,\s*145|3,\s*73,\s*86|39,\s*60,\s*51|2,\s*35,\s*16|2,\s*29,\s*14)/;

  for (const f of files) {
    test(`${f.split('/').pop()} uses the tokens`, () => {
      const body = readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
      assert.doesNotMatch(body, BRAND_HEX, 'a brand hex is still written literally here');
      assert.doesNotMatch(body, BRAND_RGBA, 'a brand colour is still written as a literal rgba here');
    });
  }
});
