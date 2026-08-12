/* The FAQ answers are HTML from the CMS editor, rendered into a public,
   server-side page. Anything that gets through here executes in a visitor's
   browser on our domain, so the interesting cases are the hostile ones. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml, htmlToText } from '../../src/lib/sanitizeHtml.ts';

describe('what the editor actually produces survives', () => {
  test('a paragraph stays a paragraph', () => {
    assert.equal(sanitizeHtml('<p>ขอใบ ร.ง.4 ต้องเตรียมอะไรบ้าง</p>'), '<p>ขอใบ ร.ง.4 ต้องเตรียมอะไรบ้าง</p>');
  });

  test('lists, emphasis and line breaks are kept', () => {
    const html = '<ul><li><strong>สำเนาโฉนด</strong></li><li>ผังโรงงาน<br>และแบบแปลน</li></ul>';
    assert.equal(sanitizeHtml(html), '<ul><li><strong>สำเนาโฉนด</strong></li><li>ผังโรงงาน<br />และแบบแปลน</li></ul>');
  });

  test('a normal link keeps its href and gains rel', () => {
    assert.equal(
      sanitizeHtml('<a href="https://dbd.go.th">DBD</a>'),
      '<a href="https://dbd.go.th" rel="noopener noreferrer">DBD</a>',
    );
  });

  test('relative links and anchors are allowed', () => {
    assert.match(sanitizeHtml('<a href="/th/contact">ติดต่อ</a>'), /href="\/th\/contact"/);
    assert.match(sanitizeHtml('<a href="#docs">ดู</a>'), /href="#docs"/);
  });

  test('tags the editor leaves unclosed are closed for it', () => {
    assert.equal(sanitizeHtml('<p>หนึ่ง<p>สอง'), '<p>หนึ่ง<p>สอง</p></p>');
  });
});

describe('injection attempts do not survive', () => {
  const bad = [
    ['a script tag', '<script>alert(1)</script>'],
    ['a script with attributes', '<script type="text/javascript">alert(1)</script>'],
    ['an image error handler', '<img src=x onerror="alert(1)">'],
    ['an inline event on an allowed tag', '<p onclick="alert(1)">hi</p>'],
    ['an iframe', '<iframe src="https://evil.test"></iframe>'],
    ['an svg payload', '<svg><script>alert(1)</script></svg>'],
    ['a style block', '<style>body{display:none}</style>'],
    ['an object tag', '<object data="evil.swf"></object>'],
  ];

  for (const [name, html] of bad) {
    test(`${name} leaves nothing executable`, () => {
      const out = sanitizeHtml(html);
      assert.doesNotMatch(out, /<\s*(script|iframe|svg|style|object|img)/i, out);
      assert.doesNotMatch(out, /on[a-z]+\s*=/i, out);
      assert.doesNotMatch(out, /alert\(1\)</i, `left a live payload: ${out}`);
    });
  }

  test('javascript: hrefs are dropped, the link text stays', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">คลิก</a>');
    assert.doesNotMatch(out, /javascript:/i);
    assert.match(out, /คลิก/);
  });

  test('javascript: obscured with control characters is still dropped', () => {
    for (const href of ['java\tscript:alert(1)', 'java\nscript:alert(1)', ' javascript:alert(1)', 'JaVaScRiPt:alert(1)']) {
      const out = sanitizeHtml(`<a href="${href}">x</a>`);
      assert.doesNotMatch(out, /href=/, `${href} → ${out}`);
    }
  });

  test('javascript: obscured with html entities is still dropped', () => {
    const out = sanitizeHtml('<a href="java&#09;script:alert(1)">x</a>');
    assert.doesNotMatch(out, /href=/, out);
  });

  test('data: and vbscript: hrefs are dropped', () => {
    assert.doesNotMatch(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>'), /href=/);
    assert.doesNotMatch(sanitizeHtml('<a href="vbscript:msgbox(1)">x</a>'), /href=/);
  });

  test('a disallowed tag loses its markup but keeps its words', () => {
    assert.equal(sanitizeHtml('<div>เนื้อหา</div>'), 'เนื้อหา');
    assert.equal(sanitizeHtml('<marquee>วิ่ง</marquee>'), 'วิ่ง');
  });

  test('stray angle brackets become text rather than a tag', () => {
    assert.equal(sanitizeHtml('5 < 10 และ 10 > 5'), '5 &lt; 10 และ 10 &gt; 5');
    assert.equal(sanitizeHtml('<p>a < b</p>'), '<p>a &lt; b</p>');
  });

  test('an unterminated tag cannot escape as markup', () => {
    const out = sanitizeHtml('<a href="https://x.test');
    assert.doesNotMatch(out, /<a/);
  });

  test('a closing tag with no opener is dropped, not emitted', () => {
    assert.equal(sanitizeHtml('</p>ข้อความ'), 'ข้อความ');
  });

  test('quotes in an href cannot break out of the attribute', () => {
    const out = sanitizeHtml('<a href=\'https://x.test" onmouseover="alert(1)\'>x</a>');
    assert.doesNotMatch(out, /onmouseover/i, out);
  });

  test('empty and non-string-ish input is safe', () => {
    assert.equal(sanitizeHtml(''), '');
    assert.equal(sanitizeHtml('<'), '&lt;');
    assert.equal(sanitizeHtml('<>'), '&lt;&gt;');
  });
});

describe('htmlToText', () => {
  test('gives plain words for meta descriptions', () => {
    assert.equal(htmlToText('<p>เตรียม <strong>สำเนาโฉนด</strong> และผังโรงงาน</p>'), 'เตรียม สำเนาโฉนด และผังโรงงาน');
  });

  test('carries nothing executable through', () => {
    assert.equal(htmlToText('<script>alert(1)</script>ปกติ'), 'ปกติ');
  });
});
