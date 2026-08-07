# JKP Property — Backend (v1)

Backend สำหรับ frontend ใน `web/` ตามสัญญาข้อมูลใน [`../FRONTEND_API_SPEC.md`](../FRONTEND_API_SPEC.md)
สร้างเป็น **Next.js API routes + Prisma + PostgreSQL** (ตาม SPEC_PACK §6 ที่กำหนดว่า v1 ไม่แยก backend service)

## เริ่มใช้งาน

```bash
brew services start postgresql@16
createdb jkpprop
npx prisma migrate dev      # สร้างตาราง
npx prisma db seed          # org + ผู้ใช้ + จังหวัด + ช่องทาง + ข้อมูลตัวอย่าง
npm run dev
```

`web/.env` (ไม่เข้า git):

```
DATABASE_URL="postgresql://<user>@localhost:5432/jkpprop"
```

**บัญชีทดสอบ** (รหัสผ่านเดียวกันหมด `jkp12345`):

| อีเมล | บทบาท | scope |
|---|---|---|
| owner@jkp.local | owner | all (สิทธิ์ครบ 7) |
| manager@jkp.local | manager | all |
| agent@jkp.local | agent | own |

## การตัดสินใจที่เคาะแล้ว (FRONTEND_API_SPEC §11)

| # | คำถาม | คำตอบที่ใช้ |
|--:|---|---|
| 1 | Auth | **session cookie** (httpOnly, `jkp_session`, ตาราง `Session` เก็บ SHA-256 ของ token) — Server Component อ่านผู้ใช้ได้ตรง |
| 2 | Multi-tenant | v1 = org เดียว, ทุกตารางมี `orgId` แล้ว พร้อมขยายเป็น subdomain ภายหลัง |
| 3 | `resolveFields` | client คำนวณต่อ (server คืน override ดิบ) — Field Builder ต้อง preview ก่อนบันทึก |
| 4 | enum vs ข้อความไทย | v1 ยังเก็บข้อความไทยตามที่ frontend ส่ง — ต้องแปลงตอนทำ EN/ZH |
| 5 | NotifyConfig | **แยก 2 ก้อน**: เกณฑ์เดือน = ระดับ org (`Org.notifyConfig`), `readIds` = รายคน (`User.readAlertIds`) |
| 6 | "1 เดือน" | 30 วันตายตัว เหมือน `buildAlerts()` เดิม |
| 7 | อีเมล/LINE | ยังไม่มี — กระดิ่งในระบบเท่านั้น |
| 8 | ลบ custom field | เก็บค่าไว้เสมอ (API คืน `values` ตามที่บันทึกจริง) |
| 9 | กระดิ่ง | ตามเดิม (อยู่ใน `AdminTopbarDefaultActions`) |

## รูปแบบ response

สำเร็จ → payload ตรง ๆ · ผิดพลาด → `{ error: { code, message, fields? } }` (`message` ภาษาไทยพร้อมแสดง)

## Endpoints

| กลุ่ม | Endpoint |
|---|---|
| Auth | `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/me/permissions` |
| Field schema | `GET /api/field-schema` · `PUT /api/field-schema/:typeKey` · `GET|PUT /api/property-types/config` |
| Geography | `GET|POST /api/geography` |
| Media | `GET|POST /api/media` · `DELETE /api/media/:id` · `GET /api/media/:id/raw` |
| Properties | `GET|POST /api/properties` · `GET|PATCH|DELETE /api/properties/:id` |
| Leads | `POST /api/public/leads` 🔵 · `GET|POST /api/leads` · `PATCH /api/leads/:id` · `POST /api/leads/:id/{notes,tasks,reveal-contact}` |
| Pipeline | `GET /api/listings` · `PATCH /api/listings/:code` · `GET|POST /api/shortlists` · `GET /api/public/shortlists/:token` 🔵 · `GET|POST /api/visits` · `GET|POST /api/deals` · `PATCH /api/deals/:id` |
| Leases | `GET /api/leases` · `GET|PUT /api/notify-config` · `POST /api/notifications/read` |
| Social | `GET /api/social` · `PUT /api/social/:code` · `POST|DELETE /api/social/channels` |
| Users | `GET /api/users` · `POST /api/users/invite` · `PUT /api/users/:id/permissions` · `PATCH /api/users/:id/status` |
| Audit | `GET /api/audit` |

🔵 = public (rate-limited, ไม่ต้องล็อกอิน)

## กฎที่บังคับฝั่ง server

- **RBAC** (`src/lib/server/auth.ts`) — role ∧ scope ∧ privilege; `FORBIDDEN_PRIVS` ตรวจซ้ำทุกครั้งที่บันทึกสิทธิ์ และตอนเช็คสิทธิ์ (สิทธิ์ต้องห้ามใน DB ถูกเมิน)
- **scope `own`** = กรองระดับแถว (`WHERE ownerId/assigneeId = me`) ไม่ใช่ให้ frontend กรอง
- **PII ปิดบังเป็นค่าเริ่มต้น** — `081-xxx-8888` / `s***@mail.com`; ดูค่าเต็มต้องเรียก `POST /api/leads/:id/reveal-contact` ซึ่ง**บันทึก audit ทุกครั้ง** (PDPA ม.37)
- **`internalOnly`** ถูกตัดออกถ้าไม่มีสิทธิ์ `internal_note` และ**ตัดออกเสมอ**บน endpoint สาธารณะ
- **`co_agent.expiresAt`** ตรวจทุก request (หมดอายุ = ปฏิเสธทันที ไม่รอ cron)
- **`export`** = owner เท่านั้น
- **`public_code`** ออกโดย server จากจังหวัด (`JKP0001` / `JKP-SPK0042`) ผ่านตัวนับต่อ prefix · แก้ไม่ได้หลังสร้าง
- **lead pipeline เดินหน้าอย่างเดียว** — ถอยกลับได้เฉพาะ owner/manager
- **ดีลที่ปิดแล้วล็อก** — แก้ต้องมีสิทธิ์ `deal_unlock` + ระบุเหตุผล + ลง audit
- **publish gate** — ต้องมีชื่อทรัพย์ + รูป ≥ 1 และมีสิทธิ์ `publish`
- **shortlist สาธารณะ** ไม่ส่งพิกัด/ข้อมูลผู้ให้เช่า/โน้ตภายใน
- **audit log** ทุก mutation พร้อม before/after JSON

## รูปแบบการต่อ API ฝั่ง client

`src/lib/apiClient.ts` เป็นตัวเดียวที่เข้าใจ error envelope · store เดิมใน `src/lib/*.ts` ยังอยู่ในฐานะ **cache แบบออฟไลน์** (ถ้า API ล่ม UI ไม่พังและไม่ว่างเปล่า ตาม §2.2) · ทุก loader ยังอ่านค่าใน `useEffect` ไม่ใช่ตอน render เพื่อกัน hydration mismatch (§2.1)

## ยังไม่ได้ทำ

CMS / Page Builder / Sections / SEO / Branding (§10 ข้อ 9) ยังเป็น mock · ระบบส่งอีเมลจริง (ตอนนี้ invite คืนรหัสผ่านชั่วคราวมาให้ owner ส่งเอง) · ลายน้ำรูป · i18n EN/ZH
