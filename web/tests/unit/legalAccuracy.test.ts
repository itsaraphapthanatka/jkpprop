/* The published policy against what the code actually calls.
 *
 * The privacy policy once said the site carried nothing from anyone else while
 * the contact page was embedding a Google map, and it stayed wrong for weeks
 * because nothing compared the two. This does: every third-party host the code
 * fetches from has to be named in the cookie policy, in all three languages.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LEGAL_PAGES } from '../../prisma/legalPages.ts';

/** host → ชื่อที่ต้องปรากฏในนโยบาย */
const THIRD_PARTIES: Record<string, string[]> = {
  'basemaps.cartocdn.com': ['CARTO', 'OpenStreetMap'],
  'google.com/maps': ['Google'],
  'fonts.googleapis.com': ['Google Fonts'],
};

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f)) out.push(p);
  }
  return out;
}

const source = walk('src').map((f) => readFileSync(f, 'utf8')).join('\n');
const cookies = LEGAL_PAGES.find((p) => p.slug === 'cookies')!;

describe('the cookie policy names every third party the code calls', () => {
  for (const [host, names] of Object.entries(THIRD_PARTIES)) {
    test(`${host}`, () => {
      if (!source.includes(host)) return;   // ไม่ได้เรียกแล้ว ก็ไม่ต้องเขียนถึง
      for (const locale of ['th', 'en', 'zh'] as const) {
        const body = cookies.content[locale].body;
        assert.ok(
          names.some((n) => body.includes(n)),
          `นโยบายคุกกี้ (${locale}) ไม่ได้พูดถึง ${names.join('/')} ทั้งที่โค้ดเรียก ${host}`,
        );
      }
    });
  }

  test('ไม่มีการอ้างว่าไม่มีบุคคลภายนอกเลย', () => {
    const th = cookies.content.th.body;
    assert.ok(!/ไม่มีบุคคลภายนอก(ใด|เลย)/.test(th), 'นโยบายอ้างว่าไม่มีบุคคลภายนอก');
  });
});
