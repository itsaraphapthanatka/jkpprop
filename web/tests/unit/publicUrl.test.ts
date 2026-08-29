/* ที่อยู่จริงของเว็บสำหรับลิงก์ที่ส่งออกไปข้างนอก
 *
 * 29 ส.ค. 2569 · ลิงก์ตั้งรหัสผ่านที่ส่งให้ผู้ใช้ชี้ไปที่ https://0.0.0.0/...
 * กดแล้วเบราว์เซอร์ขึ้น ERR_SSL_PROTOCOL_ERROR — เพราะประกอบ URL จากที่อยู่ที่
 * โปรเซสรับคำขอ (container ผูกกับ 0.0.0.0:3000) ไม่ใช่ที่อยู่ที่ผู้ใช้พิมพ์
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { publicOrigin, publicUrl } from '../../src/lib/server/publicUrl.ts';

const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

describe('ที่อยู่จริงของเว็บ', () => {
  test('ใช้ค่าที่ nginx ส่งต่อมา ไม่ใช่ที่อยู่ที่โปรเซสรับคำขอ', () => {
    const r = req('http://0.0.0.0:3000/api/auth/forgot', {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'jkppropertyagency.com',
      host: '0.0.0.0:3000',
    });
    assert.equal(publicOrigin(r), 'https://jkppropertyagency.com');
  });

  test('ไม่มี x-forwarded-host ก็ใช้ host ธรรมดาได้', () => {
    const r = req('http://0.0.0.0:3000/x', { 'x-forwarded-proto': 'https', host: 'jkppropertyagency.com' });
    assert.equal(publicOrigin(r), 'https://jkppropertyagency.com');
  });

  test('host ที่เป็นที่อยู่เครือข่ายล้วน ต้องไม่ถูกใช้เป็นชื่อเว็บ', () => {
    for (const bad of ['0.0.0.0:3000', '127.0.0.1:3000', 'localhost:3000']) {
      const r = req('http://example.internal/x', { host: bad });
      assert.ok(!publicOrigin(r).includes(bad.split(':')[0]), `ยังใช้ ${bad} เป็นชื่อเว็บอยู่`);
    }
  });

  test('รายชื่อที่คั่นด้วยจุลภาค เอาตัวแรก', () => {
    const r = req('http://0.0.0.0:3000/x', {
      'x-forwarded-proto': 'https, http',
      'x-forwarded-host': 'jkppropertyagency.com, internal.lan',
    });
    assert.equal(publicOrigin(r), 'https://jkppropertyagency.com');
  });

  test('ลิงก์เต็มที่เอาไปวางในอีเมลได้', () => {
    const r = req('http://0.0.0.0:3000/api/x', {
      'x-forwarded-proto': 'https', 'x-forwarded-host': 'jkppropertyagency.com',
    });
    assert.equal(
      publicUrl(r, '/admin/reset-password?token=abc'),
      'https://jkppropertyagency.com/admin/reset-password?token=abc',
    );
  });

  test('ไม่มีหัวข้อความเลย ก็ยังคืนที่อยู่ที่ใช้ได้ตอนพัฒนา', () => {
    const r = req('http://localhost:3000/api/x');
    assert.equal(publicOrigin(r), 'http://localhost:3000');
  });
});
