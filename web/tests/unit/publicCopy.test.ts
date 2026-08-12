/* No Thai literal may be rendered by a public page component.
 *
 * The FAQ shipped with two labels written straight into the JSX — "แชร์" and
 * "ติดต่อทีมงาน". Every question and answer translated, then the buttons
 * around them stayed Thai on /en and /zh. Nothing caught it because a hardcoded
 * string typechecks perfectly; it only shows up by reading the rendered page in
 * the other two languages.
 *
 * So the rule is checked at the source: anything under a public component
 * directory must take its words from the dictionary. Admin screens are Thai-only
 * by product decision and are not scanned.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../src/', import.meta.url).pathname;

/** directories whose components render on /th /en /zh */
const PUBLIC_DIRS = ['components/site', 'components/home', 'components/property', 'components/listing', 'app/[locale]'];

/* ClientShortlistBody is the one page still built entirely from the prototype's
   demo content — a fictional company, two invented listings, a made-up
   consultant. Translating it would mean translating fake data, so it is left
   whole until it reads from the database. Tracked, not forgotten. */
const KNOWN_UNTRANSLATED = ['components/site/ClientShortlistBody.tsx'];

const THAI = /[฀-๿]/;

const walk = (dir: string): string[] => {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
};

/** strip comments and style objects — Thai in a note to the next developer is fine */
const stripNonRendered = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

/* A JSX text node: between > and < with no braces, which is what the reader
   actually sees. Attribute values are matched separately below. */
const TEXT_NODE = />([^<>{}]*)</g;
const USER_ATTR = /\b(alt|title|placeholder|aria-label)\s*=\s*"([^"]*)"/g;

const publicFiles = () =>
  PUBLIC_DIRS.flatMap((d) => {
    try {
      return walk(join(ROOT, d));
    } catch {
      return [];
    }
  });

/* Two buttons still pointed at "Contact.dc.html" — the filename of the design
   prototype these components were ported from. On the prototype, opening that
   file worked; on the site it is a 404, and it was the primary call to action
   on the home page. Grep for the pattern rather than trusting the port. */
describe('no link points at a design prototype', () => {
  for (const file of publicFiles()) {
    const rel = file.slice(ROOT.length);
    test(rel, () => {
      const src = stripNonRendered(readFileSync(file, 'utf8'));
      const bad = [...src.matchAll(/href\s*=\s*["'][^"']*\.dc\.html[^"']*["']/g)].map((m) => m[0]);
      assert.deepEqual(bad, [], `${rel} links to a prototype file:\n  ${bad.join('\n  ')}`);
    });
  }
});

describe('public pages carry no hardcoded Thai', () => {
  const files = publicFiles();

  test('the public component directories were actually found', () => {
    assert.ok(files.length > 20, `expected to scan the public tree, saw ${files.length} files`);
  });

  for (const file of files) {
    const rel = file.slice(ROOT.length);
    if (KNOWN_UNTRANSLATED.includes(rel)) continue;

    test(rel, () => {
      const src = stripNonRendered(readFileSync(file, 'utf8'));
      const bad: string[] = [];

      for (const [, text] of src.matchAll(TEXT_NODE)) {
        if (THAI.test(text)) bad.push(text.trim());
      }
      for (const [, attr, value] of src.matchAll(USER_ATTR)) {
        if (THAI.test(value)) bad.push(`${attr}="${value}"`);
      }

      assert.deepEqual(
        bad,
        [],
        `${rel} renders Thai directly — move it into src/i18n/dictionaries.ts so /en and /zh get it too:\n  ${bad.join('\n  ')}`,
      );
    });
  }
});
