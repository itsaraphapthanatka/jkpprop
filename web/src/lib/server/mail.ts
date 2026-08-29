/* ============================================================
   ส่งอีเมลออกจากระบบ

   29 ส.ค. 2569 · ก่อนหน้านี้ทั้งโปรเจกต์ไม่มีการส่งอีเมลเลยสักที่
   · เชิญคนเข้าระบบ → โชว์รหัสผ่านชั่วคราวใน alert ครั้งเดียว ปิดแล้วหายถาวร
     และไม่มีคำสั่งออกรหัสใหม่ให้เจ้าของระบบเลย
   · หน้า "ลืมรหัสผ่าน" → กดส่งแล้วรอครึ่งวินาที แล้วขึ้นว่าส่งอีเมลไปแล้ว
     โดยไม่เคยยิงไปที่เซิร์ฟเวอร์ — บอกผู้ใช้ว่าส่งแล้วทั้งที่ไม่ได้ส่ง

   ใช้ SMTP ตรง ๆ แทนที่จะผูกกับผู้ให้บริการเจ้าใดเจ้าหนึ่ง — Resend, SendGrid,
   Postmark, Amazon SES หรือเมลเซิร์ฟเวอร์ของโดเมนเอง ล้วนพูด SMTP ได้หมด
   เปลี่ยนเจ้าได้โดยแก้แค่ค่าตั้งค่า ไม่ต้องแก้โค้ด

   ยังไม่ตั้งค่า = ระบบไม่ล้ม แต่ต้องบอกให้รู้ว่าไม่ได้ส่ง — ห้ามเงียบแล้ว
   ปล่อยให้หน้าจอโกหกซ้ำรอยเดิม
   ============================================================ */
import nodemailer from 'nodemailer';

export type MailConfig = {
  host: string; port: number; secure: boolean;
  user: string; pass: string;
  from: string;
};

/** อ่านค่าตั้งค่าจาก environment · null = ยังไม่ได้ตั้ง */
export function mailConfig(): MailConfig | null {
  const host = (process.env.SMTP_HOST ?? '').trim();
  const from = (process.env.MAIL_FROM ?? '').trim();
  if (!host || !from) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    /* 465 คือ SMTPS ที่เข้ารหัสตั้งแต่เชื่อมต่อ · 587 เริ่มแบบธรรมดาแล้วยกระดับ
       ด้วย STARTTLS ซึ่ง nodemailer ทำให้เองเมื่อ secure=false */
    secure: (process.env.SMTP_SECURE ?? '').trim() === 'true' || port === 465,
    user: (process.env.SMTP_USER ?? '').trim(),
    pass: process.env.SMTP_PASS ?? '',
    from,
  };
}

export const mailConfigured = () => mailConfig() !== null;

type Sent = { ok: true } | { ok: false; reason: 'not_configured' | 'send_failed'; detail?: string };

/**
 * ส่งอีเมลหนึ่งฉบับ · ไม่โยน error ออกไป — คนเรียกตัดสินใจเองว่าจะทำอย่างไรต่อ
 * เพราะงานหลัก (สร้างบัญชี / ออกโทเคน) สำเร็จไปแล้วก่อนถึงตรงนี้
 */
export async function sendMail(to: string, subject: string, html: string, text: string): Promise<Sent> {
  const cfg = mailConfig();
  if (!cfg) return { ok: false, reason: 'not_configured' };
  try {
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      /* บางเจ้า (เช่นเมลเซิร์ฟเวอร์ในองค์กร) ไม่ต้องยืนยันตัวตน */
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    });
    await transport.sendMail({ from: cfg.from, to, subject, html, text });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'send_failed', detail: e instanceof Error ? e.message : String(e) };
  }
}

/* ---- แม่แบบอีเมล ----
   เขียนเป็นตารางแบบเรียบง่ายและมีข้อความล้วนคู่กันเสมอ — โปรแกรมอ่านเมลใน
   องค์กรจำนวนมากตัด CSS ทิ้ง และบางคนอ่านแบบข้อความล้วน */

const shell = (title: string, body: string, cta: { label: string; url: string } | null) => `<!doctype html>
<html lang="th"><body style="margin:0;background:#F5F4F0;font-family:'Noto Sans Thai',-apple-system,BlinkMacSystemFont,sans-serif;color:#17211D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #E2E0D9;border-radius:14px">
    <tr><td style="padding:26px 28px 0">
      <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#034956">JKP PROPERTY</div>
      <h1 style="margin:10px 0 0;font-size:20px;line-height:1.5">${title}</h1>
    </td></tr>
    <tr><td style="padding:14px 28px 0;font-size:14.5px;line-height:1.75;color:#3D4A44">${body}</td></tr>
    ${cta ? `<tr><td style="padding:22px 28px 0">
      <a href="${cta.url}" style="display:inline-block;background:#0D6C3B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9999px;font-size:14px;font-weight:700">${cta.label}</a>
    </td></tr>
    <tr><td style="padding:16px 28px 0;font-size:12px;line-height:1.7;color:#8B948F">ถ้าปุ่มกดไม่ได้ ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์<br><span style="color:#626D67;word-break:break-all">${cta.url}</span></td></tr>` : ''}
    <tr><td style="padding:22px 28px 26px;font-size:12px;color:#8B948F">อีเมลฉบับนี้ส่งจากระบบอัตโนมัติ ไม่ต้องตอบกลับ</td></tr>
  </table>
</td></tr></table></body></html>`;

export const inviteMail = (name: string, url: string, hours: number) => ({
  subject: 'เชิญเข้าใช้ระบบ JKP Property',
  html: shell('ตั้งรหัสผ่านเพื่อเริ่มใช้งาน',
    `สวัสดีคุณ ${name}<br>ทีมงานได้เปิดบัญชีผู้ใช้ระบบหลังบ้านของ JKP Property ให้คุณแล้ว<br>กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านของคุณเอง ลิงก์นี้ใช้ได้ภายใน ${hours} ชั่วโมง`,
    { label: 'ตั้งรหัสผ่าน', url }),
  text: `สวัสดีคุณ ${name}\n\nทีมงานได้เปิดบัญชีผู้ใช้ระบบหลังบ้านของ JKP Property ให้คุณแล้ว\nตั้งรหัสผ่านของคุณที่ลิงก์นี้ (ใช้ได้ภายใน ${hours} ชั่วโมง):\n${url}\n\nอีเมลฉบับนี้ส่งจากระบบอัตโนมัติ ไม่ต้องตอบกลับ`,
});

export const resetMail = (name: string, url: string, hours: number) => ({
  subject: 'ตั้งรหัสผ่านใหม่ · JKP Property',
  html: shell('ตั้งรหัสผ่านใหม่',
    `สวัสดีคุณ ${name}<br>มีการขอตั้งรหัสผ่านใหม่สำหรับบัญชีนี้<br>กดปุ่มด้านล่างเพื่อตั้งรหัสใหม่ ลิงก์ใช้ได้ภายใน ${hours} ชั่วโมง<br><br>ถ้าคุณไม่ได้เป็นคนขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ`,
    { label: 'ตั้งรหัสผ่านใหม่', url }),
  text: `สวัสดีคุณ ${name}\n\nมีการขอตั้งรหัสผ่านใหม่สำหรับบัญชีนี้\nตั้งรหัสใหม่ที่ลิงก์นี้ (ใช้ได้ภายใน ${hours} ชั่วโมง):\n${url}\n\nถ้าคุณไม่ได้เป็นคนขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ`,
});
