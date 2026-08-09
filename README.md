# JKP Property

แพลตฟอร์มนายหน้าอสังหาริมทรัพย์อุตสาหกรรม (โรงงาน / โกดัง) — เว็บสาธารณะ + ระบบหลังบ้าน
Next.js 15 · App Router · React 19 · TypeScript strict · PostgreSQL + Prisma

> **เอกสารหลัก** — อ่าน [`AGENT.md`](./AGENT.md) ก่อนเป็นอันดับแรก แล้วดูตามนี้:
>
> | เรื่อง | อ่านที่ |
> |---|---|
> | พฤติกรรม / ข้อมูล / RBAC / state | [`SPEC_PACK.md`](./SPEC_PACK.md) |
> | สัญญาข้อมูลระหว่าง frontend กับ API | [`FRONTEND_API_SPEC.md`](./FRONTEND_API_SPEC.md) |
> | Backend: schema · endpoints · กฎที่บังคับฝั่ง server | [`web/BACKEND.md`](./web/BACKEND.md) |
> | ดีไซน์ (pixel / token / component) | [`design/`](./design/) → [`DESIGN.md`](./DESIGN.md) |
> | ภาพรวมหน้าจอและ flow | [`JKP_Property_Handoff.md`](./JKP_Property_Handoff.md) |

## โครงสร้างจริงของ repo

เป็น Next.js app เดียวใน `web/` **ไม่ใช่ monorepo** และ **ไม่ได้ใช้ Tailwind**
(สไตล์เป็น CSS variables + inline style objects + injected `<style>` เพื่อรักษา
pixel fidelity กับ prototype ใน `design/*.dc.html`)

```
web/
  prisma/
    schema.prisma        # 25 models — ดู web/BACKEND.md
    seed.ts              # org + ผู้ใช้ + จังหวัด + เนื้อหาตัวอย่าง
  src/
    app/
      api/               # API routes ทั้งหมด (auth, properties, leads, cms, …)
      admin/             # ระบบหลังบ้าน 23 หน้า (ภาษาไทยล้วน, noindex)
      (หน้าอื่น ๆ)        # เว็บสาธารณะ: /, /listing, /property, /contact, landing pages
      llms.txt/ robots.txt/  # route handlers เสิร์ฟไฟล์ที่อัปโหลดใน /admin/seo
    components/{admin,home,listing,property,site}/
    lib/
      server/            # db, auth+RBAC, audit, storage, dto — เฉพาะฝั่ง server
      apiClient.ts       # fetch wrapper ตัวเดียวที่เข้าใจ error envelope
      *.ts               # store เดิม — ตอนนี้เป็น cache ออฟไลน์ ไม่ใช่ source of truth
    middleware.ts        # กันทุก /admin ที่ไม่มี session cookie
design/                  # prototype .dc.html ที่ลูกค้า approve แล้ว (ต้อง reproduce ตรง)
```

## เริ่มใช้งาน

ต้องมี PostgreSQL 16 และ Node 20+

```bash
brew services start postgresql@16     # หรือ Postgres ที่คุณใช้อยู่
createdb jkpprop

cd web
npm install
npx prisma migrate dev                # สร้างตาราง
npx prisma db seed                    # ข้อมูลตั้งต้น + บัญชีทดสอบ
npm run dev                           # → http://localhost:3000
```

สร้าง `web/.env` (ไม่เข้า git):

```
DATABASE_URL="postgresql://<user>@localhost:5432/jkpprop"
```

**บัญชีทดสอบ** — รหัสผ่าน `jkp12345` ทุกบัญชี:

| อีเมล | บทบาท | ขอบเขตข้อมูล |
|---|---|---|
| owner@jkp.local | เจ้าของระบบ | ทั้งหมด (สิทธิ์พิเศษครบ 7) |
| manager@jkp.local | ผู้จัดการ | ทั้งหมด |
| agent@jkp.local | เอเจนต์ขาย | เฉพาะของตัวเอง |

หน้าหลังบ้านทุกหน้าต้องล็อกอิน — เข้าที่ `/admin/login`

## คำสั่ง

```bash
npm run dev          # dev server
npm run build        # production build (type-check ด้วย)
npm run start        # เสิร์ฟ build
npm run typecheck    # tsc --noEmit
npx prisma studio    # ดู/แก้ข้อมูลในฐานข้อมูล
```

รันจากในโฟลเดอร์ `web/` (ไม่ใช่ root ของ repo)

## สถานะปัจจุบัน

**หน้าจอครบทุกหน้า และต่อฐานข้อมูลจริงแล้วทั้งหมด** — ไม่มีหน้าไหนที่ยังอ่านจาก
hardcoded array ในคอมโพเนนต์ รายละเอียด endpoint และกฎที่บังคับฝั่ง server
อยู่ใน [`web/BACKEND.md`](./web/BACKEND.md)

หัวข้อที่ยังไม่ได้ทำ (มีรายละเอียดใน `web/BACKEND.md` ท้ายไฟล์):

- **copy ภาษา EN / 中文** — โครง i18n เสร็จแล้ว (`/th /en /zh` + hreflang + สลับภาษาได้)
  แต่ headline และเนื้อหาการตลาดภาษาอังกฤษ/จีนยังไม่มี — เป็น deliverable ของลูกค้า
  แก้ได้ที่ `/admin/cms` โดยไม่ต้องแตะโค้ด
- **ระบบส่งอีเมล** — เชิญผู้ใช้แล้วได้รหัสผ่านชั่วคราวมาให้ owner ส่งเอง
- **ลายน้ำรูปอัตโนมัติ** (FR-ADM-09)
- **dynamic route `[id]`** — หน้ารายละเอียดบางหน้ายังทำงานกับ "รายการล่าสุด"
