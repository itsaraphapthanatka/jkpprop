import { test, expect } from './fixtures';

/* The public site, driven as a visitor would. */

test.describe('locale routing', () => {
  test('a locale-less URL lands on Thai', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/th$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  });

  test('each locale renders with the right lang attribute', async ({ page }) => {
    for (const [path, lang] of [['/th', 'th'], ['/en', 'en'], ['/zh', 'zh-Hans']] as const) {
      // lang is in the initial HTML — waiting for the full load event makes
      // this hostage to how fast the webfont CDN answers
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    }
  });

  test('an unknown locale 404s instead of rendering a page', async ({ page }) => {
    const res = await page.goto('/jp', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
  });

  test('internal links keep the visitor in their language', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    // every in-page link to a public route should already be /en-prefixed —
    // without this a click bounces through /th and silently drops the language
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href') ?? ''));
    const publicLinks = hrefs.filter((h) =>
      h !== '/' && !h.startsWith('/admin') && !h.startsWith('/api') && !h.startsWith('/client-shortlist'));
    expect(publicLinks.length).toBeGreaterThan(3);
    for (const href of publicLinks) {
      expect(href, `${href} lost the locale prefix`).toMatch(/^\/(th|en|zh)(\/|$)/);
    }
  });
});

test.describe('listing and property', () => {
  test('the listing page shows published inventory', async ({ page }) => {
    await page.goto('/th/listing');
    await expect(page.locator('#listing-grid')).toBeVisible();
    // seeded properties carry JKP codes; the ported demo set used TIP-
    await expect(page.locator('#listing-grid')).toContainText(/JKP/);
  });

  test('a card opens that exact property, not a hardcoded one', async ({ page }) => {
    await page.goto('/th/listing');
    // wait for the client fetch to replace the ported demo set
    const link = page.locator('#listing-grid a[href*="/property/JKP"]').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    const code = decodeURIComponent(href!.split('/property/')[1]);

    await link.click();
    await expect(page).toHaveURL(new RegExp(`/property/${code}$`));
    await expect(page.locator('h1')).toBeVisible();
    // the page must show the code it was opened with, not a hardcoded one
    await expect(page.getByText(code).first()).toBeVisible();
  });

  test('an unknown property code 404s', async ({ page }) => {
    const res = await page.goto('/th/property/JKP-NOPE9999', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
  });

  /* The homepage and the listing page shipped a copy of the design
     prototype's demo cards. They rendered on the server and, on the
     homepage, were never replaced — so the markup a crawler (or anyone
     before hydration) saw advertised properties that did not exist, and
     every "ดูรายละเอียด" on them opened a 404. Assert against the raw HTML,
     with no JavaScript involved, because that is where the bug lived. */
  for (const path of ['/th', '/th/listing', '/en/listing']) {
    test(`server-rendered ${path} links only to properties that exist`, async ({ request }) => {
      const html = await (await request.get(path)).text();

      expect(html, 'prototype demo codes are still in the server HTML').not.toContain('TIP-');

      const links = [...new Set([...html.matchAll(/\/(?:th|en|zh)\/property\/([A-Za-z0-9._%-]+)/g)]
        .map((m) => m[0]))];

      for (const href of links) {
        const res = await request.get(href, { maxRedirects: 0 });
        expect(res.status(), `${href} is advertised on ${path} but does not resolve`).toBe(200);
      }
    });
  }
});

test.describe('layout', () => {
  test('the page never scrolls sideways', async ({ page }) => {
    // the responsive rules keyed off inline-style strings used to fail
    // silently; this is the symptom that would have caught it
    for (const path of ['/th', '/th/listing', '/th/about', '/th/contact']) {
      await page.goto(path);
      // measure only once the webfont has landed — Thai falls back to very
      // different metrics until then, which makes this flake per-environment
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} scrolls horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });

  test('no console errors on the home page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/th');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#page-sheet, main, body').first().waitFor();

    // the fixture refuses third-party hosts, so the browser logs a failed
    // fetch for each blocked font/photo — those are ours to ignore
    const ours = errors.filter((e) =>
      !/favicon|ERR_FAILED|net::|Failed to load resource/i.test(e));
    // a hydration mismatch (React #418) would show up here — it has before
    expect(ours, ours.join(' | ')).toEqual([]);
  });
});

test.describe('AI-readable files', () => {
  test('robots.txt keeps admin and the token view out of any index', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /client-shortlist');
  });

  test('sitemap.xml carries hreflang for all three locales', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    for (const l of ['th', 'en', 'zh']) expect(body).toContain(`hreflang="${l}"`);
  });
});

test.describe('FAQ answers from the CMS', () => {
  /* The editor stores rich text, so an answer is markup. The page printed it
     as text and visitors read "<p>ขอใบ ร.ง.4 …</p>" tags and all. Rendering it
     as HTML fixes that but makes the CMS body an injection point on a public
     page, so it is sanitised server-side — both halves are checked here. */
  const RG4 = 'ขอใบ ร.ง.4 ต้องเตรียมอะไรบ้าง';

  test('renders formatting instead of showing the tags, and drops scripts', async ({ page }) => {
    const errors: string[] = [];
    page.on('dialog', (d) => { errors.push('alert fired'); void d.dismiss(); });

    await page.goto('/th/faq');
    const q = page.getByText(RG4).first();
    if (!(await q.count())) test.skip(true, 'no FAQ row seeded in this database');

    await q.click();
    const answer = page.locator('#faq-layout strong', { hasText: 'สำเนาโฉนด' });
    await expect(answer).toBeVisible();

    // the literal tags must not appear as words on the page
    await expect(page.locator('body')).not.toContainText('<p>');
    await expect(page.locator('body')).not.toContainText('</strong>');
    expect(errors, 'a script in the CMS body executed').toEqual([]);
  });

  /* The accordion rendered its answer only after a click, so the server sent
     the questions and none of the answers — on a page whose entire purpose is
     the answers, built to be found in search. */
  test('answers are in the server HTML, not only after a click', async ({ request }) => {
    const html = await (await request.get('/th/faq')).text();
    const withoutScripts = html.replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/g, '');
    if (!withoutScripts.includes(RG4)) test.skip(true, 'no FAQ row seeded in this database');

    expect(withoutScripts, 'the answer never reaches a crawler').toContain('สำเนาโฉนด');
    // present but collapsed until opened
    expect(withoutScripts).toMatch(/hidden=""/);
  });

  test('the page declares FAQPage structured data', async ({ request }) => {
    const html = await (await request.get('/th/faq')).text();
    const m = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/.exec(html);
    if (!m) test.skip(true, 'no FAQ row seeded in this database');

    const data = JSON.parse(m![1].replace(/\\u003c/g, '<'));
    expect(data['@type']).toBe('FAQPage');
    expect(Array.isArray(data.mainEntity)).toBe(true);
    expect(data.mainEntity.length).toBeGreaterThan(0);

    const first = data.mainEntity[0];
    expect(first['@type']).toBe('Question');
    expect(first.name).toBeTruthy();
    expect(first.acceptedAnswer.text).toBeTruthy();
    // schema text is plain: a stray tag invalidates the whole block for Google
    expect(first.acceptedAnswer.text).not.toMatch(/<[a-z]/i);
  });

  test('the accordion is operable by keyboard and announces its state', async ({ page }) => {
    await page.goto('/th/faq');
    const q = page.getByRole('button', { name: new RegExp(RG4) });
    if (!(await q.count())) test.skip(true, 'no FAQ row seeded in this database');

    await expect(q).toHaveAttribute('aria-expanded', 'false');
    await q.focus();
    await page.keyboard.press('Enter');
    await expect(q).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#faq-layout strong', { hasText: 'สำเนาโฉนด' })).toBeVisible();
  });
});

test.describe('the enquiry box on a property page', () => {
  /* Its submit handler was `setSent(true)` and nothing else: the visitor typed
     their name and number, the button turned green, and nobody at the company
     ever heard about it. */
  test('sends the enquiry, with the property code on it', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;

    // caught rather than delivered: the point is what it sends, not another row
    let body: Record<string, unknown> | null = null;
    await page.route('**/api/public/leads', async (route) => {
      body = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: {} }) });
    });

    await page.goto(`/th/property/${code}`);
    await page.locator('#pd-inquiry input').nth(0).fill('คุณทดสอบ');
    await page.locator('#pd-inquiry input').nth(1).fill('t@example.com');
    await page.locator('#pd-inquiry input').nth(2).fill('0800000000');
    await page.getByRole('button', { name: /ส่งคำถาม|Send enquiry/ }).click();

    await expect(page.locator('#pd-inquiry-sent')).toBeVisible();
    expect(body, 'nothing was posted').not.toBeNull();
    expect(body!.name).toBe('คุณทดสอบ');
    expect(body!.phone).toBe('0800000000');
    expect(JSON.stringify(body!.req)).toContain(code);   // which property this is about
  });

  test('says so when it fails, instead of showing a tick', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.route('**/api/public/leads', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'ระบบขัดข้อง' } }) }));

    await page.goto(`/th/property/${code}`);
    await page.locator('#pd-inquiry input').nth(0).fill('คุณทดสอบ');
    await page.locator('#pd-inquiry input').nth(2).fill('0800000000');
    await page.getByRole('button', { name: /ส่งคำถาม|Send enquiry/ }).click();

    await expect(page.locator('#pd-inquiry-error')).toBeVisible();
    await expect(page.locator('#pd-inquiry-sent')).toHaveCount(0);
  });

  /* The Line / WeChat / WhatsApp buttons were `href="#"`, and WeChat has no
     field anywhere to hold an account. A chat button is drawn only where there
     is an account behind it. */
  test('a chat button exists only where an account is configured', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);
    const hrefs = await page.locator('#pd-inquiry a[target="_blank"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const h of hrefs) expect(h, 'a chat button that goes nowhere').toMatch(/^https:\/\//);
  });
});

test.describe('the heart and the share button on a property page', () => {
  test('the heart saves this property, the share button opens the share menu', async ({ page, context, request }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;

    await page.goto(`/th/property/${code}`);
    await page.locator('[data-testid="pd-fav"]').click();
    await expect(page.locator('#saved-link')).toContainText('1');

    // the share button opens the menu; what the menu does is checked with it
    await page.locator('[data-testid="pd-share"]').click();
    await expect(page.locator('#share-menu')).toBeVisible();
  });

  test('the breadcrumb goes back to the listing, not to "#"', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);
    const crumb = page.getByRole('link', { name: 'อสังหาริมทรัพย์ทั้งหมด' });
    await expect(crumb).toHaveAttribute('href', '/th/listing');
    await crumb.click();
    await expect(page).toHaveURL(/\/th\/listing$/);
  });
});

test.describe('the share menu', () => {
  /* The share control on a property page did nothing at all, and the one on
     the listing page opened three items that closed the menu and nothing else. */
  test('offers the five ways, and copy really copies', async ({ page, context, request }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;

    await page.goto(`/th/property/${code}`);
    await page.locator('[data-testid="pd-share"]').click();
    const menu = page.locator('#share-menu');
    await expect(menu).toBeVisible();

    for (const t of ['share-copy', 'share-email', 'share-line', 'share-whatsapp', 'share-wechat']) {
      await expect(menu.locator(`[data-testid="${t}"]`)).toBeVisible();
    }
    // the three that are links must be links to somewhere
    await expect(menu.locator('[data-testid="share-email"]')).toHaveAttribute('href', /^mailto:\?subject=/);
    await expect(menu.locator('[data-testid="share-line"]')).toHaveAttribute('href', /line\.me\/lineit\/share\?url=http/);
    await expect(menu.locator('[data-testid="share-whatsapp"]')).toHaveAttribute('href', /wa\.me\/\?text=/);

    await menu.locator('[data-testid="share-copy"]').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(`/property/${code}`);
  });

  /* WeChat has no share URL a browser may open, so it shows the page as a code
     for the app's scanner rather than a link that quietly fails. */
  test('WeChat shows the page as a scannable code', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);
    await page.locator('[data-testid="pd-share"]').click();
    await page.locator('[data-testid="share-wechat"]').click();

    const img = page.locator('#share-menu img');
    await expect(img).toBeVisible({ timeout: 10_000 });
    expect(await img.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
  });

  test('the listing page uses the same menu', async ({ page }) => {
    await page.goto('/th/listing');
    await page.locator('[data-share-trigger]').click();
    await expect(page.locator('#share-menu [data-testid="share-wechat"]')).toBeVisible();
  });

  /* Clicking inside the menu used to close it: the listener that watched for
     an outside click caught the inside ones too. */
  test('clicking inside it does not close it; clicking away does', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);
    await page.locator('[data-testid="pd-share"]').click();
    await page.locator('[data-testid="share-wechat"]').click();
    await expect(page.locator('#share-menu')).toBeVisible();

    /* a corner, so this lands on the sheet behind the menu whatever the
       screen size — at phone width the middle of the page is the menu */
    const vp = page.viewportSize()!;
    await page.mouse.click(3, vp.height - 3);
    await expect(page.locator('#share-menu')).toHaveCount(0);
  });
});

test.describe('the chat buttons in the enquiry box', () => {
  test('WeChat is an ID to copy, not a link that goes nowhere', async ({ page, context, request }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);

    const wechat = page.locator('[data-testid="inquiry-wechat"]');
    test.skip(!(await wechat.count()), 'no WeChat ID set in this database');

    await wechat.click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBeTruthy();
    await expect(wechat).toContainText('คัดลอกแล้ว');
  });
});

test.describe('the similar-properties row on a property page', () => {
  /* It had drifted into a card of its own — no photo count, no type, a line of
     text where the listing's card has a button — and the grid gave it a column
     per card, so one similar property was stretched across the whole page. */
  test('is the same card as the listing page, at card width', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=6')).json()).items as { code: string }[];
    test.skip(items.length < 2, 'needs a second property of the same type to be similar to');

    await page.goto(`/th/property/${items[0].code}`);
    const row = page.locator('#pd-related');
    await row.scrollIntoViewIfNeeded();

    const card = row.locator('[data-card]').first();
    await expect(card).toBeVisible();

    /* a card, not a band across the page. On a phone one column is the whole
       row and that is right — what is never right is a card 1,272px wide, so
       the check is against a card's own maximum rather than the row's width */
    const cardBox = (await card.boundingBox())!;
    expect(cardBox.width).toBeLessThanOrEqual(560);

    // the same parts the listing card has
    await expect(card.locator('[data-fav]')).toBeVisible();
    await expect(card).toContainText(/ตร\.ม\./);
    await expect(card.getByText('ดูรายละเอียด')).toBeVisible();
  });

  test('the heart there saves to the same list as everywhere else', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=6')).json()).items as { code: string }[];
    test.skip(items.length < 2, 'needs a similar property');

    await page.goto(`/th/property/${items[0].code}`);
    await page.locator('#pd-related').scrollIntoViewIfNeeded();
    await page.locator('#pd-related [data-fav]').first().click();
    await expect(page.locator('#saved-link')).toContainText('1');
  });
});

test.describe('the contact map', () => {
  /* It was a stock photograph of a world map — decorative, and no use to
     anyone trying to find the office. It takes a coordinate from the CMS now,
     and since a Google frame reports the reader's address to Google, it is not
     in the page until the reader agrees to it. */
  test('the frame is not in the server HTML — nobody has agreed to it yet', async ({ request }) => {
    for (const locale of ['th', 'en', 'zh']) {
      const html = await (await request.get(`/${locale}/contact`)).text();
      expect(html, `${locale} loads Google before consent`).not.toMatch(/<iframe[^>]+google\.com\/maps/);
      // a photograph of a map is not a map
      expect(html).not.toContain('photo-1524661135-423995f22d0b');
    }
  });

  test('shows a real map for the saved coordinate, in every language', async ({ page }) => {
    for (const locale of ['th', 'en', 'zh']) {
      await page.goto(`/${locale}/contact`);
      if (await page.getByText(/ยังไม่ได้ตั้งพิกัด|No location set yet|尚未设置坐标/).count()) {
        test.skip(true, 'no coordinate set in this database');
      }
      // the suite runs as a visitor who has already agreed (playwright.config.ts)
      await expect(page.locator('iframe[src*="google.com/maps"]'), `${locale} has no map frame`).toBeVisible();
    }
  });

  test('an unparseable coordinate says so instead of embedding junk', async ({ page }) => {
    await page.goto('/th/contact');
    const frame = page.locator('iframe[src*="google.com/maps"]');
    if (!(await frame.count())) test.skip(true, 'no coordinate set in this database');
    // the URL is rebuilt from parsed numbers, so it can only ever look like this
    expect(await frame.getAttribute('src')).toMatch(/^https:\/\/www\.google\.com\/maps\?q=-?\d+(\.\d+)?,-?\d+(\.\d+)?&/);
  });
});

test.describe('the FAQ reads the same in every language', () => {
  /* The 24 questions were an all-or-nothing fallback inside the component, so
     writing one entry in the CMS in Thai cut the Thai page down to that entry
     while English and Chinese still listed all 24 — in Thai. Three languages,
     three different FAQs. */
  test('every language lists the same questions', async ({ request }) => {
    const counts: Record<string, number> = {};
    for (const locale of ['th', 'en', 'zh']) {
      const html = await (await request.get(`/${locale}/faq`)).text();
      counts[locale] = (html.match(/aria-controls="faq-a-/g) ?? []).length;
    }
    expect(counts.th, 'the FAQ is empty — seed it with npm run faq:seed').toBeGreaterThan(0);
    expect(counts.en, `th=${counts.th} en=${counts.en}`).toBe(counts.th);
    expect(counts.zh, `th=${counts.th} zh=${counts.zh}`).toBe(counts.th);
  });
});

test.describe('property cards read in the visitor\'s language', () => {
  /* Every label on a card is assembled server-side in loadPublicListings. It
     already took a locale — but only used it for "/ month". The unit, the
     "price on request" fallback and the word for a million stayed Thai, so an
     English card read "฿ 4.5 ล้าน · 2,700 ตร.ม.".

     Sorting made this worse than cosmetic: the listing page recovered the
     numeric price by regex-matching ล้าน out of the display string, so
     translating that word would have silently divided every price by a
     million on /en and /zh. The number travels as its own field now.

     Asserted against the feed rather than the page, because a property's
     *title* is data the team typed in Thai — legitimately Thai on every
     locale until someone translates the listing itself. */
  /* Thai letters only. The Thai Unicode block also holds ฿ (U+0E3F), which is
     the right currency symbol in every language — matching it would fail a
     correctly translated price. */
  const THAI = /[\u0E01-\u0E3A\u0E40-\u0E5B]/;

  const feed = async (request: import('@playwright/test').APIRequestContext, locale: string) => {
    const res = await request.get(`/api/public/listings?locale=${locale}&limit=60`);
    expect(res.ok(), `feed failed for ${locale}`).toBeTruthy();
    const body = await res.json();
    const items = Array.isArray(body) ? body : body.items;
    expect(Array.isArray(items), 'feed did not return a list').toBeTruthy();
    return items as Array<Record<string, unknown>>;
  };

  test('the unit and the price carry no Thai on /en', async ({ request }) => {
    const items = await feed(request, 'en');
    test.skip(items.length === 0, 'no published inventory to check');
    for (const it of items) {
      expect(String(it.areaLabel), `areaLabel of ${it.code}`).not.toMatch(THAI);
      expect(String(it.price), `price of ${it.code}`).not.toMatch(THAI);
    }
  });

  test('the unit and the price carry no Thai on /zh', async ({ request }) => {
    const items = await feed(request, 'zh');
    test.skip(items.length === 0, 'no published inventory to check');
    for (const it of items) {
      expect(String(it.areaLabel), `areaLabel of ${it.code}`).not.toMatch(THAI);
      expect(String(it.price), `price of ${it.code}`).not.toMatch(THAI);
    }
  });

  test('Thai keeps its own unit', async ({ request }) => {
    const items = await feed(request, 'th');
    test.skip(items.length === 0, 'no published inventory to check');
    const withArea = items.filter((it) => String(it.areaLabel));
    test.skip(withArea.length === 0, 'no property records an area');
    for (const it of withArea) expect(String(it.areaLabel)).toContain('ตร.ม.');
  });

  test('the numeric price travels as its own field, not parsed back out of the label', async ({ request }) => {
    const items = await feed(request, 'en');
    test.skip(items.length === 0, 'no published inventory to check');
    for (const it of items) {
      expect(typeof it.priceValue, `priceValue of ${it.code}`).toBe('number');
      // a million-baht listing must not collapse to "4.5" once ล้าน is gone
      if (/million/.test(String(it.price))) {
        expect(Number(it.priceValue), `${it.code} shows ${it.price}`).toBeGreaterThanOrEqual(1_000_000);
      }
    }
  });
});

test.describe('addresses read in the visitor\'s script', () => {
  /* The province and district are stored in Thai — correctly, it is the
     address — but they were printed unchanged on /en and /zh, where a reader
     cannot even sound them out. */
  test('a card carries no Thai place name on /en', async ({ request }) => {
    const res = await request.get('/api/public/listings?locale=en&limit=60');
    const items = (await res.json()).items as { loc: string; code: string }[];
    test.skip(!items.length, 'no published property');
    const THAI = /[ก-ฺเ-๛]/;
    for (const it of items) {
      // an unmapped district may still be Thai; the province never should be
      const province = it.loc.split(',').pop()!.trim();
      expect(THAI.test(province), `${it.code} still shows a Thai province: ${it.loc}`).toBeFalsy();
    }
  });

  test('Thai keeps the address exactly as the team typed it', async ({ request }) => {
    const th = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { loc: string }[];
    const en = (await (await request.get('/api/public/listings?locale=en&limit=60')).json()).items as { loc: string }[];
    test.skip(!th.length, 'no published property');
    expect(th[0].loc).not.toBe(en[0].loc);
    expect(th[0].loc).toMatch(/[ก-ฺเ-๛]/);
  });
});

test.describe('what search engines are given', () => {
  /* The sitemap advertised /th/property?code=X, which only 307s to the real
     page — every property URL handed to Google was a redirect. And no page
     declared a canonical or its language versions, so the three locales
     competed with each other. */
  test('the sitemap lists property pages that answer directly, not redirects', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    const propertyUrls = urls.filter((u) => u.includes('/property'));
    test.skip(!propertyUrls.length, 'no published property');

    for (const u of propertyUrls) {
      expect(u, 'the ?code= form is a redirect').not.toContain('?code=');
      const res = await request.get(new URL(u).pathname, { maxRedirects: 0 });
      expect(res.status(), `${u} is not a 200`).toBe(200);
    }
  });

  test('every page names itself and its other languages', async ({ request }) => {
    for (const path of ['/th', '/en', '/th/listing', '/th/contact']) {
      const html = await (await request.get(path)).text();
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      expect(canonical, `${path} has no canonical`).toBeTruthy();
      expect(canonical!.endsWith(path), `${path} points its canonical at ${canonical}`).toBeTruthy();

      /* Next writes the React attribute name (hrefLang); HTML attributes are
         case-insensitive, so match that way rather than pinning the casing. */
      for (const l of ['th', 'en', 'zh']) {
        expect(html.toLowerCase(), `${path} does not name its ${l} version`).toContain(`hreflang="${l}"`);
      }
    }
  });
});

test.describe('figures the site can stand behind', () => {
  /* The stats strip and the KPI row shipped with defaults baked in — 2,000+
     properties, 100+ organisations, 12 years — printed as fact above a
     catalogue of three. Anything typed into the CMS still wins; these are what
     stands there until then. */
  test('the home KPIs and the about stats match the published inventory', async ({ page, request }) => {
    const listings = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { province: string }[];
    const published = listings.length;
    const provinces = new Set(listings.map((l) => l.province).filter(Boolean)).size;
    test.skip(!published, 'nothing published');

    for (const path of ['/th', '/th/about']) {
      const html = await (await request.get(path)).text();
      for (const ghost of ['2,000+', '100+', '12 ปี']) {
        expect(html, `${path} still claims ${ghost}`).not.toContain(ghost);
      }
    }

    await page.goto('/th/about');
    const strip = page.locator('body');
    await expect(strip).toContainText(String(published));
    await expect(strip).toContainText(String(provinces));
  });

  test('the legal pages exist, in every language, and are linked', async ({ request }) => {
    for (const locale of ['th', 'en', 'zh']) {
      for (const slug of ['privacy', 'terms']) {
        const res = await request.get(`/${locale}/p/${slug}`);
        expect(res.status(), `/${locale}/p/${slug}`).toBe(200);
        const html = await res.text();
        expect(html.length, `/${locale}/p/${slug} is empty`).toBeGreaterThan(2000);
      }
      const home = await (await request.get(`/${locale}`)).text();
      expect(home, `${locale} home does not link the privacy policy`).toContain('/p/privacy');
    }
  });
});

test.describe('the location finder map', () => {
  /* The pins were percentages over an image cropped with object-fit:cover, so
     they slid with the container: Don Mueang sat over Nakhon Nayok. And the
     factor cards did nothing until clicked. */
  test('the map lights the provinces the factor is actually about', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();

    const lit = (key: string) => page.locator(`[data-province="${key}"]`).getAttribute('data-lit');

    // airports are the default: Bangkok and Samut Prakan hold them
    expect(await lit('bangkok')).toBe('1');
    expect(await lit('samut_prakan')).toBe('1');
    expect(await lit('rayong')).toBe('0');

    // hovering EEC lights the statutory three without choosing them
    await page.locator('[data-factor="eec"]').hover();
    for (const k of ['chonburi', 'rayong', 'chachoengsao']) expect(await lit(k), k).toBe('1');
    expect(await lit('bangkok')).toBe('0');

    // clicking makes it the choice, and it stays lit with the cursor away
    await page.locator('[data-factor="eec"]').click();
    await page.locator('#lf-map-plane').hover();
    expect(await lit('rayong')).toBe('1');
  });

  test('a province names itself when the cursor is on it', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();
    await page.locator('[data-province="chonburi"]').hover();
    await expect(page.locator('#lf-map-plane').getByText('ชลบุรี')).toBeVisible();
  });

  /* The map used to zoom to whichever provinces a factor covered, so the
     country moved under the reader on every choice. The view stays put; only
     the fill moves. */
  test('choosing a factor lights its provinces without moving the map', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    const litKeys = async () =>
      (await plane.locator('[data-province][data-lit="1"]').evaluateAll((gs) =>
        gs.map((g) => g.getAttribute('data-province')))).sort();
    /* the pane's transform, not an attribute the element may simply not have:
       the check this replaces read `viewBox` off a <div>, so it compared null
       with null and could never have failed */
    const view = () => plane.locator('.leaflet-map-pane').getAttribute('style');

    expect(await litKeys()).toEqual(['bangkok', 'samut_prakan']);
    const before = await view();

    await page.locator('[data-factor="eec"]').click();
    await page.waitForTimeout(700);

    expect(await litKeys()).toEqual(['chachoengsao', 'chonburi', 'rayong']);
    expect(await view(), 'the map moved under the reader').toBe(before);
  });

  /* The pins were floated over a photograph in percentages and slid off the
     places they name. They stand on a real basemap now — which is somebody
     else's work, and says so. */
  test('it draws a real basemap under the provinces, and credits it', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('.leaflet-tile').count(), { timeout: 15_000 }).toBeGreaterThan(0);
    await expect(page.locator('#lf-map-plane')).toContainText('OpenStreetMap');
    await expect(page.locator('[data-pin]')).toHaveCount(6);
    await expect(page.locator('[data-province]')).toHaveCount(13);
  });

  /* Hovering a pin scaled it by a tenth and set a state nothing read. It now
     has to earn the gesture: say what the place is, count what is actually
     published in its province, and go there when clicked. */
  test('a pin under the cursor says what it is, and counts what is there', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { province: string }[];
    const inChonburi = items.filter((it) => it.province.includes('ชลบุรี')).length;

    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();
    await page.locator('[data-pin="ท่าเรือแหลมฉบัง"]').hover();

    const card = page.locator('.belt-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('ท่าเรือแหลมฉบัง');
    await expect(card).toContainText('ชลบุรี');
    await expect(card).toContainText(String(inChonburi));   // the real number, not a figure from the design

    // and the province it stands in is picked out while the cursor is there
    const chonburi = page.locator('[data-province="chonburi"]');
    const hovered = await chonburi.getAttribute('fill-opacity') ?? await chonburi.evaluate((el) => getComputedStyle(el).fillOpacity);
    await page.locator('[data-pin="ดอนเมือง"]').hover();
    await expect.poll(async () => chonburi.evaluate((el) => getComputedStyle(el).fillOpacity)).not.toBe(hovered);
  });

  /* Clicking a province left the browser's focus ring on it: a blue rectangle
     round the shape's bounding box, which on a map reads as a selection nobody
     made. The keyboard still gets one — that is the point of a focus ring. */
  test('clicking a province leaves no focus rectangle behind', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    const prov = page.locator('[data-province="chachoengsao"]');
    const box = (await prov.boundingBox())!;

    // pressed, not clicked: a real pointer focus without navigating away
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
    await page.mouse.down();
    expect(await prov.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
    await page.mouse.up();
  });

  /* Clicking used to leave the page immediately, which is a strong thing to do
     to somebody who was still looking. It picks the area out and opens a card;
     the card is where they decide to go — and the line offering that was in the
     hovering card before, where it looked like a link and took no pointer. */
  test('clicking picks the area out instead of leaving the page', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();

    await page.locator('[data-pin="ท่าเรือแหลมฉบัง"]').click();

    await expect(page).toHaveURL(/\/th$/);                       // still here
    await expect(page.locator('[data-province="chonburi"][data-selected="1"]')).toBeVisible();

    const card = page.locator('.belt-card-pop');
    await expect(card).toBeVisible();
    const go = card.locator('[data-go]');
    await expect(go).toBeVisible();
    await expect(go).toHaveAttribute('href', /listing\?province=/);

    await go.click();
    await expect(page).toHaveURL(/\/listing\?province=/);
    await expect(page.locator('body')).toContainText('ชลบุรี');
  });

  test('a province is chosen the same way, and unchosen by clicking off it', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();

    /* Chachoengsao carries no pin, so a point in the middle of it is the
       province and nothing else — on a phone the pins cover most of the
       provinces that have them */
    const box = (await page.locator('[data-province="chachoengsao"]').boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5);
    await expect(page.locator('[data-province="chachoengsao"][data-selected="1"]')).toBeVisible();
    await expect(page).toHaveURL(/\/th$/);

    await page.locator('.belt-card-pop .leaflet-popup-close-button').click();
    await expect(page.locator('[data-province][data-selected="1"]')).toHaveCount(0);
  });

  test('hovering a factor previews it on the map without choosing it', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();

    const port = page.locator('[data-pin="ท่าเรือแหลมฉบัง"]');
    const airport = page.locator('[data-pin="ดอนเมือง"]');
    /* dimmed, not a particular number: how far a pin fades is a design
       decision that has already been retuned once, and pinning the exact
       value here only means the test fails when the map is restyled */
    const dim = async (g: typeof port) => Number(await g.evaluate((el) => getComputedStyle(el).opacity));
    const lit = async (g: typeof port) => (await dim(g)) === 1;

    // airports are the default: the port pin starts dimmed
    await expect.poll(() => dim(port)).toBeLessThan(1);

    await page.locator('[data-factor="port"]').hover();
    await expect.poll(() => lit(port)).toBe(true);
    await expect.poll(() => dim(airport)).toBeLessThan(1);

    // moving away puts it back — hovering is a preview, not a choice
    await page.locator('[data-factor="air"]').hover();
    await expect.poll(() => dim(port)).toBeLessThan(1);
    await expect.poll(() => lit(airport)).toBe(true);
  });
});

test.describe('the search box on the front page', () => {
  /* It was a <span> with the placeholder written into it, next to a button
     with no handler — the search on the front page of a property site could
     not be typed in. The chips under it set state that went nowhere, and two
     of them offered size and price bands the listing page cannot filter by. */
  test('typing a code and pressing search opens that property\'s listing', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { code: string }[];
    test.skip(!items.length, 'nothing published');
    const code = items[0].code;

    await page.goto('/th');
    await page.locator('#hero-search-input').fill(code);
    await page.locator('#hero-search-btn').click();

    await expect(page).toHaveURL(new RegExp(`/listing\\\\?.*q=${code}`));
    await expect(page.locator('#listing-q')).toContainText(code);
    // the result set is narrowed to it, not the whole catalogue
    await expect(page.locator('body')).toContainText(code);
  });

  /* Both chips started applied — ให้เช่า and โกดัง — so typing the code of a
     factory that is for sale returned an empty page, filtered out by two
     conditions nobody chose. */
  test('a code alone finds the property, whatever type it is', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { code: string; typeKey: string }[];
    const factory = items.find((i) => i.typeKey === 'factory') ?? items[0];
    test.skip(!factory, 'nothing published');

    await page.goto('/th');
    await page.locator('#hero-search-input').fill(factory.code);
    await page.locator('#hero-search-btn').click();

    // no deal or type in the query: the visitor did not pick either
    await expect(page).not.toHaveURL(/deal=/);
    await expect(page).not.toHaveURL(/type=/);
    await expect(page.locator(`a[href*="/property/${factory.code}"]`).first()).toBeVisible();
  });

  test('Enter searches too, and the chips travel with it', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="sale"]').click();
    await page.locator('#hero-search-input').fill('ระยอง');
    await page.locator('#hero-search-input').press('Enter');

    await expect(page).toHaveURL(/deal=sale/);
    await expect(page).toHaveURL(/q=/);
  });

  test('the size bands offered here are the ones the listing page filters by', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="size"]').click();
    // the six invented sizes are gone; these three are what the destination knows
    for (const label of ['ต่ำกว่า 1,000 ตร.ม.', '1,000–3,000 ตร.ม.', 'สูงกว่า 3,000 ตร.ม.']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText('10,000 ตร.ม.+')).toHaveCount(0);
  });
});

test.describe('the heart on a listing card', () => {
  /* It filled in and forgot: the state lived in the page's memory, so a reload
     emptied it, and there was nowhere to see what had been saved. */
  test('a saved property is still saved after a reload, and can be listed', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { code: string }[];
    test.skip(items.length < 2, 'need two published properties');

    await page.goto('/th/listing');
    const card = page.locator(`[data-card="${items[0].code}"]`);
    await expect(card).toBeVisible();
    await card.locator('[data-fav]').click();

    // it survives the page going away
    await page.reload();
    await expect(page.locator(`[data-card="${items[0].code}"] [data-fav][data-on="1"]`)).toBeVisible();

    // and there is a way back to what was saved
    const only = page.locator('#listing-only-favs');
    await expect(only).toContainText('1');
    await only.click();
    await expect(page.locator('[data-card]')).toHaveCount(1);
    await expect(page.locator(`[data-card="${items[0].code}"]`)).toBeVisible();

    // clicking the heart again takes it out
    await page.locator(`[data-card="${items[0].code}"] [data-fav]`).click();
    await expect(page.locator('#listing-only-favs')).toHaveCount(0);
  });

  /* The heart was a light that came on and led nowhere: pressed on the home
     page, it was forgotten by the next page, and nothing in the masthead said
     anything had been saved. */
  test('a property hearted on the home page is still there on the listing page', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=6')).json()).items as { code: string }[];
    test.skip(!items.length, 'nothing published');

    await page.goto('/th');
    await expect(page.locator('#saved-link')).toHaveCount(0);   // nothing saved: no counter reading zero
    const card = page.locator(`[data-card="${items[0].code}"]`).first();
    await card.scrollIntoViewIfNeeded();
    await card.locator('[data-fav]').click();

    const saved = page.locator('#saved-link');
    await expect(saved).toContainText('1');

    // and it leads back to them
    await saved.click();
    await expect(page).toHaveURL(/\/listing\?saved=1/);
    await expect(page.locator('[data-card]')).toHaveCount(1);
    await expect(page.locator(`[data-card="${items[0].code}"]`)).toBeVisible();

    // the same link is in the masthead of the other pages
    await page.goto('/th/contact');
    await expect(page.locator('#saved-link')).toContainText('1');
    await page.goto(`/th/property/${items[0].code}`);
    await expect(page.locator('#saved-link')).toContainText('1');
  });
});
