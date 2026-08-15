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

test.describe('the contact map', () => {
  /* It was a stock photograph of a world map — decorative, and no use to
     anyone trying to find the office. It takes a coordinate from the CMS now. */
  test('shows a real map for the saved coordinate, in every language', async ({ request }) => {
    for (const locale of ['th', 'en', 'zh']) {
      const html = await (await request.get(`/${locale}/contact`)).text();
      if (html.includes('ยังไม่ได้ตั้งพิกัด') || /No location set yet|尚未设置坐标/.test(html)) {
        test.skip(true, 'no coordinate set in this database');
      }
      expect(html, `${locale} has no map frame`).toMatch(/<iframe[^>]+google\.com\/maps\?q=-?\d/);
      // a photograph of a map is not a map
      expect(html).not.toContain('photo-1524661135-423995f22d0b');
    }
  });

  test('an unparseable coordinate says so instead of embedding junk', async ({ request }) => {
    const html = await (await request.get('/th/contact')).text();
    const src = /<iframe[^>]+src="([^"]+)"/.exec(html)?.[1] ?? '';
    if (!src) test.skip(true, 'no coordinate set in this database');
    // the URL is rebuilt from parsed numbers, so it can only ever look like this
    expect(src).toMatch(/^https:\/\/www\.google\.com\/maps\?q=-?\d+(\.\d+)?,-?\d+(\.\d+)?&/);
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
  test('a pin sits where its coordinates say, whatever the window size', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    await expect(plane).toBeVisible();

    const read = async () => {
      const box = (await plane.boundingBox())!;
      const pin = (await page.locator('[data-pin="ดอนเมือง"]').boundingBox())!;
      return { x: (pin.x + pin.width / 2 - box.x) / box.width, y: (pin.y - box.y) / box.height };
    };

    const wide = await read();
    await page.setViewportSize({ width: 900, height: 1000 });
    await plane.scrollIntoViewIfNeeded();
    const narrow = await read();

    // the same fraction of the map, at both sizes — that is what cover broke
    expect(Math.abs(wide.x - narrow.x), 'the pin moved when the window did').toBeLessThan(0.03);
    expect(Math.abs(wide.y - narrow.y)).toBeLessThan(0.03);
    expect(wide.x).toBeGreaterThan(0.30);
    expect(wide.x).toBeLessThan(0.42);
  });

  test('the map highlights the area of the factor, chosen or hovered', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();

    // airports are the default choice — their areas are lit, the ports' are not
    await expect(page.locator('[data-halo="ดอนเมือง"]')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-halo="ท่าเรือแหลมฉบัง"]')).toHaveCSS('opacity', '0');

    // hovering the EEC factor lights the corridor without choosing it
    await page.locator('[data-factor="eec"]').hover();
    await expect(page.locator('[data-halo="ท่าเรือมาบตาพุด"]')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-halo="ดอนเมือง"]')).toHaveCSS('opacity', '0');

    // clicking makes it the choice, and it stays lit with the cursor away
    await page.locator('[data-factor="eec"]').click();
    await page.locator('#lf-map-plane').hover();
    await expect(page.locator('[data-halo="ท่าเรือมาบตาพุด"]')).toHaveCSS('opacity', '1');
  });

  test('hovering a factor previews it on the map without choosing it', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();

    const port = page.locator('[data-pin="ท่าเรือแหลมฉบัง"]');
    const airport = page.locator('[data-pin="ดอนเมือง"]');
    // airports are the default: the port pin starts dimmed
    await expect(port).toHaveCSS('opacity', '0.34');

    await page.locator('[data-factor="port"]').hover();
    await expect(port).toHaveCSS('opacity', '1');
    await expect(airport).toHaveCSS('opacity', '0.34');

    // moving away puts it back — hovering is a preview, not a choice
    await page.locator('#lf-map-plane').hover();
    await expect(port).toHaveCSS('opacity', '0.34');
    await expect(airport).toHaveCSS('opacity', '1');
  });
});
