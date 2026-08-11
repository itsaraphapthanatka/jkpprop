/* Saving one language must not destroy the other two.
 *
 * The Page Builder screen has always sent only the locale it is editing. The
 * sections API used to store that payload verbatim, so publishing there wiped
 * whatever English and Chinese copy the team had entered elsewhere — and, once
 * the roster moved into the CMS, the team photos with it. These tests pin the
 * merge that fixes it. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mergeSectionContent, type SectionContent } from '../../src/lib/mergeSectionContent.ts';

const stored: SectionContent = {
  th: { headline: 'พบกับทีมงานของเรา', sub: 'ทีมผู้เชี่ยวชาญ', items: [{ title: 'คุณสมชาย', role: 'Sales' }] },
  en: { headline: 'Meet our team', sub: 'Specialists' },
  zh: { headline: '认识我们的团队' },
};

describe('mergeSectionContent', () => {
  test('editing one locale leaves the others untouched', () => {
    const out = mergeSectionContent(stored, { th: { headline: 'ทีมงานของเรา' } });
    assert.equal(out.th.headline, 'ทีมงานของเรา');
    assert.equal(out.en.headline, 'Meet our team');
    assert.equal(out.zh.headline, '认识我们的团队');
  });

  test('a payload that omits items keeps the stored roster', () => {
    const out = mergeSectionContent(stored, { th: { headline: 'ทีมงานของเรา' } });
    assert.deepEqual(out.th.items, [{ title: 'คุณสมชาย', role: 'Sales' }]);
  });

  test('unsent fields inside the edited locale survive', () => {
    const out = mergeSectionContent(stored, { en: { headline: 'Our team' } });
    assert.equal(out.en.sub, 'Specialists', 'sub was not in the payload, so it stays');
  });

  test('an empty string still clears a field', () => {
    const out = mergeSectionContent(stored, { en: { sub: '' } });
    assert.equal(out.en.sub, '');
  });

  test('items replace rather than merge, so a deleted row stays deleted', () => {
    const out = mergeSectionContent(stored, { th: { items: [{ title: 'คุณสมหญิง' }] } });
    assert.deepEqual(out.th.items, [{ title: 'คุณสมหญิง' }]);
  });

  test('clearing the list is expressible', () => {
    const out = mergeSectionContent(stored, { th: { items: [] } });
    assert.deepEqual(out.th.items, []);
  });

  test('a locale absent from storage is created', () => {
    const out = mergeSectionContent({ th: { headline: 'ก' } }, { zh: { headline: '甲' } });
    assert.equal(out.zh.headline, '甲');
    assert.equal(out.th.headline, 'ก');
  });

  test('junk in place of a block is ignored, not stored', () => {
    const junk = { en: null, zh: 'nope', th: [] } as unknown as SectionContent;
    const out = mergeSectionContent(stored, junk);
    assert.equal(out.en.headline, 'Meet our team');
    assert.equal(out.zh.headline, '认识我们的团队');
    assert.deepEqual(out.th.items, [{ title: 'คุณสมชาย', role: 'Sales' }]);
  });

  test('the stored object is not mutated', () => {
    const before = JSON.stringify(stored);
    mergeSectionContent(stored, { th: { headline: 'x' } });
    assert.equal(JSON.stringify(stored), before);
  });
});
