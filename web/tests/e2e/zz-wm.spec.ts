import { test, expect, type Page } from '@playwright/test';
const SC = '/private/tmp/claude-502/-Users-admin-Documents-project-jkpprop/f37ab28e-9555-4e92-a0bd-fd501ce2a754/scratchpad/';
async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill('owner@jkp.local');
  await page.locator('#login-password').fill('jkp12345');
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}
test('อัปโหลดโลโก้ลายน้ำในหน้าแบรนด์', async ({ page }) => {
  const netErr: string[] = [];
  page.on('console', (m) => m.type() === 'error' && netErr.push('console: ' + m.text()));
  page.on('response', (r) => r.url().includes('/api/media') && netErr.push(`POST ${r.url()} → ${r.status()}`));
  await signIn(page);
  await page.goto('/admin/branding');
  await page.locator('#wm-file').setInputFiles('public/assets/jkp-logo-green.png');
  await page.waitForTimeout(2500);
  console.log('เครือข่าย:', netErr.join(' | ') || '(ไม่มีคำขอไป /api/media เลย)');
  const err = await page.locator('text=/ไม่สำเร็จ|ไม่ถูกต้อง|ใหญ่เกิน/').allInnerTexts();
  console.log('ข้อความผิดพลาดบนหน้า:', err.join(' / ') || '(ไม่มี)');
  const preview = await page.locator('#wm-preview img[alt=""]').count();
  const toggle = await page.locator('[aria-label="เปิดใช้ลายน้ำ"]').getAttribute('aria-checked');
  console.log('พรีวิวมีโลโก้ซ้อน:', preview, '· สวิตช์เปิด:', toggle);
  const saveDisabled = await page.locator('#wm-save').isDisabled();
  console.log('ปุ่มบันทึกกดได้:', !saveDisabled);
  await page.locator('#wm-save').click();
  await page.waitForTimeout(1500);
  console.log('ปุ่มบันทึกหลังกด:', await page.locator('#wm-save').innerText());
  await page.locator('#wm-split').screenshot({ path: SC + 'wm-card.png' });
});
