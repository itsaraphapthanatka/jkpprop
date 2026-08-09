import { test as base, expect } from '@playwright/test';

/* Every spec imports `test` from here rather than from @playwright/test.

   The app pulls its webfonts from fonts.googleapis.com and the ported design
   still references Unsplash photos. Letting the browser reach out to those
   hosts makes the suite depend on someone else's CDN: navigations hang on the
   load event, `networkidle` never settles, and results differ between a
   laptop and a CI runner. We are testing this app, not their uptime — so
   third-party requests are refused at the browser and the page renders with
   fallback fonts and broken image icons, neither of which any assertion
   depends on. */

const ALLOWED_HOSTS = ['localhost', '127.0.0.1'];

export const test = base.extend({
  page: async ({ page }, run) => {
    await page.route('**/*', (route) => {
      const host = new URL(route.request().url()).hostname;
      if (ALLOWED_HOSTS.includes(host)) return route.continue();
      return route.abort();
    });
    await run(page);
  },
});

export { expect };
