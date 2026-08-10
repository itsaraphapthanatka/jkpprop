import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://jkppropertyagency.com';
const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(`${BASE}/th`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
console.log('เริ่มที่:', page.url());

const trigger = page.locator('.lang-trigger').first();
console.log('พบปุ่มเปลี่ยนภาษา:', await trigger.count());
await trigger.click();
await page.waitForTimeout(600);

const opts = page.locator('.lang-opt');
const n = await opts.count();
console.log('ตัวเลือกในเมนู:', n);
for (let i = 0; i < n; i++) console.log('  -', (await opts.nth(i).innerText()).replace(/\n/g, ' '));

if (n > 1) {
  await opts.nth(1).click();           // ENGLISH
  await page.waitForTimeout(3000);
  console.log('หลังคลิก ENGLISH:', page.url());
  console.log('lang attribute:', await page.locator('html').getAttribute('lang'));
}

console.log('console errors:', errors.length ? errors.slice(0, 6) : 'ไม่มี');
await browser.close();
