# JKP Property — สัญญาข้อมูลฝั่ง Frontend (Frontend API Integration Spec)

> **v1** · สำหรับทีม backend ออกแบบ API มาเสียบแทน localStorage / mock ที่ frontend ใช้อยู่
>
> เอกสารนี้บอกว่า frontend ที่ทำไว้แล้ว **อ่าน–เขียนข้อมูลรูปร่างไหน อยู่ที่ไฟล์ไหน และตอนนี้เก็บไว้ที่ใด**
> เพื่อให้ต่อ API ได้โดยไม่ต้องรื้อ UI
>
> **ทุก type / localStorage key / path ในเอกสารนี้ตรงกับโค้ดบน branch `main`** ส่วน endpoint เป็น *ข้อเสนอ* ที่ปรับได้

| | |
|---|---|
| **Stack** | Next.js 15 · App Router · React 19 · TypeScript strict |
| **Styling** | Plain CSS + inline style objects (ไม่ใช้ Tailwind) |
| **ที่เก็บข้อมูลตอนนี้** | localStorage 4 keys + mock array ใน component |
| **โมดูลที่มี client store แล้ว** | 4 / 16 |
| **Repo** | `itsaraphapthanatka/jkpprop` → `/web` |

**สารบัญ**

1. [วิธีอ่านเอกสาร](#1-วิธีอ่านเอกสาร)
2. [กติกาการเชื่อมต่อที่ห้ามพลาด](#2-กติกาการเชื่อมต่อที่ห้ามพลาด)
3. [Field schema — หัวใจของระบบ](#3-field-schema--หัวใจของระบบ)
4. [FieldKind → หน้าตา payload](#4-fieldkind--หน้าตา-payload)
5. [ทรัพย์ (Properties)](#5-ทรัพย์-properties)
6. [Leads — ฟอร์มแจ้งความต้องการหน้าเว็บ](#6-leads--ฟอร์มแจ้งความต้องการหน้าเว็บ)
7. [แจ้งเตือนสัญญาเช่าใกล้หมด](#7-แจ้งเตือนสัญญาเช่าใกล้หมด)
8. [Validation ที่ backend ต้อง mirror](#8-validation-ที่-backend-ต้อง-mirror)
9. [โมดูลที่ยังเป็น mock ทั้งหมด](#9-โมดูลที่ยังเป็น-mock-ทั้งหมด)
10. [ลำดับการทำงานที่แนะนำ](#10-ลำดับการทำงานที่แนะนำ)
11. [สิ่งที่ต้องตัดสินใจร่วมกัน](#11-สิ่งที่ต้องตัดสินใจร่วมกัน)
12. [RBAC — บทบาท ขอบเขต และสิทธิ์พิเศษ](#12-rbac--บทบาท-ขอบเขต-และสิทธิ์พิเศษ)

---

## 1. วิธีอ่านเอกสาร

แต่ละบล็อกข้อมูลมี “สถานะการย้ายไป API” กำกับ ซึ่งเป็นข้อมูลที่ backend ต้องใช้ตัดสินใจว่างานหนักแค่ไหน

| สถานะ | ความหมาย |
|---|---|
| 🟣 **CLIENT STORE** | มี store ฝั่ง client จริงแล้ว (localStorage) พร้อม type ชัดเจน — **ต่อ API ได้ตรง ๆ** เพราะเปลี่ยน implementation ในไฟล์ `lib/*.ts` ไฟล์เดียว UI ไม่ต้องแก้ |
| 🟡 **HARDCODED MOCK** | ข้อมูลยัง hardcode เป็น array อยู่ใน component — **ต้องสร้าง API แล้วต่อใหม่** รวมถึงต้องแยก data ออกจาก component ก่อน |
| 🟢 **DERIVED** | คำนวณฝั่ง client จากข้อมูลอื่น — **ไม่ต้องมี API** แต่ backend ต้องรู้สูตร เพราะถ้าย้ายไปคำนวณฝั่ง server ต้องได้ผลเท่ากัน |
| 🔵 **PUBLIC** | เรียกจากเว็บสาธารณะ (ไม่ล็อกอิน) — ต้องมี rate limit / anti-spam และห้ามคืนข้อมูลภายใน |

### ข้อตกลงร่วม

| เรื่อง | ที่ frontend คาดหวัง |
|---|---|
| รหัสอ้างอิง | `public_code` เช่น `JKP-SPK0042`, `JKP0118` — frontend ถือเป็น string ทึบ ไม่ parse |
| เวลา | ส่ง epoch ms (number) หรือ ISO 8601 UTC — ปัจจุบัน `StoredLead.createdAt` เป็น epoch ms |
| เงิน | number หน่วยบาท ไม่มีคอมมา ไม่มีทศนิยม — frontend จัด format เอง |
| ภาษา | ค่าที่แสดงผลตอนนี้เป็นภาษาไทยตรง ๆ ใน payload (เช่น `dealIntent: "เช่า"`) — ดูข้อ 11 |
| Error | รูปแบบเดียวทั้งระบบ: `{ error: { code, message, fields? } }` โดย `message` เป็นภาษาไทยพร้อมแสดงให้ผู้ใช้ |
| Paging | ยังไม่มี UI paging จริง (ปุ่มหน้า 1-2-3 เป็น mock) — เสนอ `?limit=&cursor=` แล้วคืน `{ items, nextCursor }` |

---

## 2. กติกาการเชื่อมต่อที่ห้ามพลาด

### 2.1 🚨 ห้ามอ่าน state ที่ต่างกันระหว่าง server กับ client ตอน render

ทุกหน้าเป็น SSR/SSG ถ้า component อ่านค่าที่ server ไม่มี (localStorage ตอนนี้ / response API ในอนาคต) **ระหว่าง render**
จะเกิด hydration mismatch (React #418) ทันที — **เคยเกิดจริงในโปรเจกต์นี้และแก้แล้ว**

รูปแบบที่ใช้อยู่ทั้งโปรเจกต์ และขอให้คงไว้เวลาต่อ API:

```tsx
// ค่าเริ่มต้นต้องเหมือนกันทั้ง server และ client render แรก
const [types, setTypes] = React.useState(PROPERTY_TYPES);

React.useEffect(() => {          // แคบลงหลัง mount เท่านั้น
  const en = enabledPropertyTypes();
  setTypes(en);
}, []);
```

ถ้าต้องการให้ SSR ได้ข้อมูลจริงตั้งแต่แรก ให้ย้ายไปดึงใน **Server Component / route handler** แล้วส่งเป็น props ลงมา
— อย่าเรียก API ใน render ของ client component

### 2.2 ⚠️ Frontend ต้องทนข้อมูลเพี้ยนได้เสมอ

ทุก loader ที่มีตอนนี้ผ่านการทดสอบด้วย payload พัง (JSON ไม่ถูก, field ผิดชนิด, array ว่าง, key แปลกปลอม)
แล้ว **ไม่ throw และไม่ทำให้ฟอร์มว่าง** เช่น ถ้าปิดประเภททรัพย์ครบทุกอัน ระบบจะ fallback กลับเป็นเปิดทั้งหมด

ขอให้ API **ไม่ส่ง `null` แทน array ว่าง** และ**ไม่เปลี่ยนชนิด field เงียบ ๆ**

### 2.3 ทุก write ตอนนี้เป็น optimistic

UI อัปเดตทันทีแล้วค่อยบันทึก (ไม่มี loading state / rollback) เพราะเขียนลง localStorage ไม่มีทางพลาด
เมื่อเปลี่ยนเป็น API ต้องเพิ่ม **pending + error state** ในจุดที่มีปุ่มบันทึก:

- Field Builder (`/admin/field-builder`)
- ตั้งค่าแจ้งเตือน (`/admin/notifications`)
- ฟอร์มทรัพย์ (เพิ่ม / แก้ไข)
- ฟอร์มแจ้งความต้องการ (`/contact`)

### 2.4 Multi-tenant (สำคัญกับ Agency)

ค่าตั้งทั้งหมดตอนนี้อยู่ใน localStorage คือ **แยกตามเบราว์เซอร์** ไม่ใช่ค่ากลาง
แปลว่าแอดมินตั้ง “ปิดประเภทบ้าน” แล้วลูกค้าที่เปิดเว็บจากเครื่องอื่น **ยังเห็นบ้าน**

การต่อ API คือสิ่งที่ทำให้ฟีเจอร์นี้ใช้งานได้จริง — ทุก endpoint ควรมี tenant scope

---

## 3. Field schema — หัวใจของระบบ

ทั้งฟอร์มเพิ่มทรัพย์ ฟอร์มแก้ไขทรัพย์ และฟอร์มแจ้งความต้องการหน้าเว็บ ถูก generate จาก schema ชุดนี้ **ไม่มีฟอร์ม hardcode**

### 3.1 ประเภททรัพย์ + นิยามฟิลด์ · 🟣 CLIENT STORE

**ที่มา:** `web/src/lib/propertySchema.ts` · โครง schema เป็น const ในโค้ด · override เก็บที่ `jkp.fieldSchema.v1`

```ts
type FieldKind =
  | 'dealtype' | 'text' | 'textarea' | 'number' | 'price' | 'date'
  | 'select' | 'multiselect' | 'boolean'
  | 'media' | 'location' | 'map' | 'group';

type FieldDef = {
  key: string;            // unique ต่อ 1 ประเภททรัพย์
  label: string;          // ข้อความไทยที่แสดงบนฟอร์ม
  kind: FieldKind;
  options?: string[];     // select / multiselect / dealtype
  unit?: string;          // ต่อท้าย label เช่น "ตร.ม."
  placeholder?: string;
  required?: boolean;     // ล็อกเปิด — ปิดใน Field Builder ไม่ได้
  system?: boolean;       // ป้าย "ระบบ"
  note?: string;
  section?: string;       // จัดกลุ่มเป็นการ์ดในฟอร์ม
  ai?: boolean;           // textarea: โชว์ปุ่ม "ให้ AI ช่วยเขียน"
  internalOnly?: boolean; // 🔒 ห้ามส่งออก public endpoint — ดูด้านล่าง
  showWhen?: { field: string; in: string[] };  // แสดงเมื่อฟิลด์อื่นมีค่าตามที่ระบุ
  sub?: { key: string; label: string; kind?: FieldKind; options?: string[]; unit?: string }[];
};
```

> ### 🔒 `internalOnly` — ฟิลด์ที่ห้ามหลุดออกหน้าเว็บ
>
> ฟิลด์ที่ตั้ง `internalOnly: true` เป็น**โน้ตภายในทีม** (ตอนนี้คือ `internal_note` ของโกดัง/โชว์รูม)
> ใช้เก็บเรื่องอย่างเงื่อนไขต่อรอง เบอร์คนเฝ้า ข้อควรระวัง
>
> **ข้อบังคับสำหรับ backend:**
> - endpoint สาธารณะ (หน้าเว็บ, ประกาศ, shortlist ที่แชร์ให้ลูกค้า) **ต้องตัดฟิลด์เหล่านี้ออกก่อนส่ง** — อย่าพึ่ง frontend เป็นตัวกรอง
> - ห้ามใส่ลง SEO meta / JSON-LD / sitemap / feed ที่ส่งออกให้ portal ภายนอก
> - ฝั่ง frontend กันไว้แล้ว: ตัวสร้างข้อความโพสต์ (`lib/summaryTemplate.ts`) อ่านเฉพาะ key ที่ระบุไว้ชัดเจน จึงไม่มีทางดึง `internal_note` ติดไปกับข้อความที่คัดลอกไปโพสต์

```ts
// (ต่อจาก FieldDef)

type PropertyType = { key: string; label: string; icon: string; fields: FieldDef[] };
```

**ประเภททรัพย์ 5 ชนิดที่มีอยู่**

| key | label | ฟิลด์ | บังคับ | section | หมายเหตุ |
|---|---|--:|--:|--:|---|
| `house` | บ้าน | 21 | 4 | — | ฟอร์มเรียงเดี่ยว |
| `condo` | คอนโด | 20 | 4 | — | ฟอร์มเรียงเดี่ยว |
| `land` | ที่ดินเปล่า | 16 | 4 | — | มี FAR / OSR / ผังเมือง |
| `factory` | โรงงาน | 13 | 4 | — | มี ร.ง.4 / เครน |
| `warehouse` | โกดัง / คลังสินค้า | 45 | 8 | 10 | ชุดเต็มจากแบบฟอร์มรับทรัพย์ |

10 section ของโกดัง เรียงตามนี้:
คำอธิบาย · ประเภทและทำเล · ข้อมูลทั่วไป · ผู้ให้เช่า · ขนาดพื้นที่ · ราคาและค่าใช้จ่าย · สเปคอาคาร · เงื่อนไขสัญญา · คุณสมบัติและการใช้งาน · ตำแหน่ง

**Override ที่แอดมินแก้ได้ (Field Builder)**

```ts
type SchemaOverride = {
  disabled: string[];   // field key ที่ปิด (ฟิลด์ required ปิดไม่ได้)
  order:    string[];   // ลำดับที่ลากจัดใหม่ ([] = ใช้ลำดับเดิม)
  extra:    FieldDef[]; // ฟิลด์ที่แอดมินเพิ่มเอง
};
```

```json
// รูปแบบที่เก็บใน localStorage key = jkp.fieldSchema.v1
{
  "house":     { "disabled": ["maid_room"], "order": [], "extra": [] },
  "warehouse": { "disabled": [], "order": [], "extra": [] }
}
```

> ### ⚠️ กฎการ resolve — ต้องได้ผลเหมือนกันถ้าย้ายไปทำฝั่ง server
>
> `resolveFields(typeKey, override)` ทำตามลำดับนี้:
>
> 1. รวม `fields` ของประเภทนั้น + `extra`
> 2. เรียงตาม `order` ก่อน ที่เหลือต่อท้ายด้วยลำดับเดิม
> 3. ติดธง `enabled` = `required ? true : !disabled.includes(key)` — **ฟิลด์ required บังคับเปิดเสมอ**

**Endpoint ที่เสนอ**

| Method | Path | ใช้ที่ |
|---|---|---|
| `GET` | `/api/property-types` | คืน `PropertyType[]` ทั้งชุด (label + icon + fields) — cache ได้ |
| `GET` | `/api/field-schema` | คืน override ทุกประเภทในครั้งเดียว (Field Builder + ฟอร์ม) |
| `PUT` | `/api/field-schema/:typeKey` | ปุ่ม “บันทึก” ใน Field Builder — body = `SchemaOverride` |

### 3.2 เปิด–ปิดประเภททรัพย์ทั้งประเภท · 🟣 CLIENT STORE

**ที่มา:** `web/src/lib/propertySchema.ts` · localStorage key `jkp.typeConfig.v1`

Agency ที่ทำแค่บางประเภทปิดที่ไม่ใช้ได้ ผลกระทบครอบ **ทั้งหน้าบ้านและหลังบ้าน**:
ฟอร์มแจ้งความต้องการ, popup เพิ่มทรัพย์, ฟอร์มแก้ไขทรัพย์

```ts
type TypeConfig = { disabled: string[] };
// เช่น { "disabled": ["house", "condo", "land"] }
```

**กฎที่ implement ไว้แล้ว ขอให้ API รักษาไว้**

1. **ปิดทั้ง 5 ประเภทไม่ได้** — UI กันไว้ และ `enabledPropertyTypes()` จะ fallback เป็นเปิดหมดถ้าเจอ config ที่ปิดครบ
2. หน้า “แก้ไขทรัพย์” ยังต้องเลือกประเภทเดิมของทรัพย์นั้นได้ (ติดป้าย “ปิดอยู่”) — **การปิด = ปิดรับของใหม่ ไม่ใช่ลบของเก่า**
3. Field Builder ยังต้องเห็นครบทั้ง 5 ประเภท เพื่อเข้าไปแก้ฟิลด์ของประเภทที่ปิดไว้ล่วงหน้าได้

| Method | Path | ใช้ที่ |
|---|---|---|
| `GET` | `/api/property-types/config` | ทั้ง 3 ฟอร์ม + Field Builder |
| `PUT` | `/api/property-types/config` | toggle ใน Field Builder (auto-save ทันทีที่กด) |

> **หมายเหตุสำหรับหน้าเว็บสาธารณะ** — ฟอร์มหน้า `/contact` ต้องอ่านค่านี้ด้วย แต่เป็นหน้า public
> ควรมี endpoint อ่านอย่างเดียวที่ไม่ต้องล็อกอิน หรือฝังค่ามาตอน SSR

---

## 4. FieldKind → หน้าตา payload

ตารางนี้สำคัญที่สุดสำหรับออกแบบ column/JSON เพราะบางชนิดสร้าง object ซ้อน ไม่ใช่ค่าเดี่ยว

| kind | คอนโทรลบนจอ | ค่าที่ควรเก็บ | ตัวอย่าง |
|---|---|---|---|
| `dealtype` | ปุ่มเลือกอันเดียว | string (จาก options) | `"เช่า"` |
| `text` | input | string | `"บางพลี"` |
| `textarea` | textarea (+ปุ่ม AI ถ้า `ai`) | string หลายบรรทัด | `"โกดังพร้อม…"` |
| `number` | input numeric | number | `2700` |
| `price` | input numeric | number (บาท) | `405000` |
| `date` | date picker | ISO date `YYYY-MM-DD` | `"2026-05-27"` |
| `select` | dropdown | string (จาก options) | `"3 เฟส"` |
| `multiselect` | chip ติ๊กได้หลายค่า | `string[]` | `["โกดัง","E-Commerce"]` |
| `boolean` | toggle | boolean | `true` |
| `media` | กล่องอัปโหลด (mock) | asset id/URL array — **ยังไม่มีระบบไฟล์จริง** | `["asset_01"]` |
| `location` | กลุ่ม input ตาม `sub` | object ตาม sub keys | `{tambon,amphoe,province,map}` |
| `map` | แผนที่ Leaflet ปักหมุดได้ | object 3 คีย์ | `{lat,lng,link}` |
| `group` | กลุ่ม input ย่อยแถวเดียว | object ตาม sub keys | `{rai,ngan,wa}` |

### ทางเลือกโครงสร้างที่แนะนำ

เพราะฟิลด์ต่างกันทุกประเภทและแอดมินเพิ่มฟิลด์เองได้ การเก็บเป็น **column ตายตัวจะพังทันทีที่มีฟิลด์ใหม่**
เสนอให้เก็บค่าจริงเป็น map เดียว แล้วให้ schema เป็นตัวบอกความหมาย

```json
{
  "id": "prp_01H…",
  "public_code": "JKP-SPK0042",
  "type_key": "warehouse",
  "title_th": "โกดังพร้อมสำนักงาน 2,700 ตร.ม.",
  "values": {
    "deal_type": "เช่า",
    "building_area": 2300,
    "price_rent": 405000,
    "usage": ["โกดัง", "ศูนย์กระจายสินค้า"],
    "cold_storage": false,
    "location_map": { "lat": 13.7854444, "lng": 100.6223333, "link": "https://…" },
    "listing_date": "2026-05-27"
  }
}
```

`values` ใช้ `FieldDef.key` เป็น key แล้วค่อยทำ generated column / index เฉพาะฟิลด์ที่ต้อง query จริง
(ราคา, พื้นที่, จังหวัด, ประเภท) เพื่อทำ filter บนหน้าเว็บ

---

## 5. ทรัพย์ (Properties)

### 5.1 รายการทรัพย์ + สร้าง / แก้ไข · 🟡 HARDCODED MOCK

**ที่มา:**

- `web/src/components/admin/PropertiesBody.tsx` (`const ROWS`, `SUMMARY`)
- `web/src/components/admin/PropertyEditBody.tsx` (`RECORD_TYPE` + `defaultValue`)
- ฟอร์มจริงมาจาก `web/src/components/admin/DynamicFieldForm.tsx`

`DynamicFieldForm` เรนเดอร์ฟอร์มจาก schema เรียบร้อยแล้ว แต่**ยังไม่ได้ผูก value เข้าออก** —
ปัจจุบันเก็บ state ไว้ในตัวเองและ **ล้างค่าเมื่อเปลี่ยนประเภททรัพย์**

| Method | Path | ต้องคืน / รับ |
|---|---|---|
| `GET` | `/api/properties` | รายการ + filter `type`, `province`, `status`, `q` (ตรงกับ chip filter ที่มีอยู่) + ตัวเลขสรุป 4 ตัวบนหัวตาราง |
| `GET` | `/api/properties/:id` | เรคคอร์ดเดียวพร้อม `type_key` + `values` เพื่อเติมฟอร์มแก้ไข |
| `POST` | `/api/properties` | สร้าง (บันทึกร่างได้) — **server เป็นคนสร้าง `public_code`** จากจังหวัด |
| `PATCH` | `/api/properties/:id` | แก้ไขบางฟิลด์ |
| `DELETE` | `/api/properties/:id` | เมนู 3 จุดในตารางมีปุ่มลบอยู่แล้ว |

> **⚠️ ต้องคิดเผื่อ** — ทรัพย์ที่บันทึกไว้ก่อน อาจมี key ที่ตอนนี้ถูกปิดหรือถูกลบจาก schema ไปแล้ว
> API ควรคืน `values` ตามที่บันทึกไว้จริงทั้งหมด แล้วให้ frontend เลือกแสดงเฉพาะฟิลด์ที่ยัง enabled (ไม่ต้องกลัวข้อมูลหาย)

---

## 6. Leads — ฟอร์มแจ้งความต้องการหน้าเว็บ

ทางเดินข้อมูลนี้ต่อครบวงจรแล้วฝั่ง client: ผู้เข้าเว็บกรอก → เก็บลง store → หน้า Admin → Leads อ่านไปแสดง

### 6.1 ส่งความต้องการ (public) + อ่าน lead (admin) · 🟣 CLIENT STORE · 🔵 PUBLIC

**ที่มา:**

- `web/src/lib/leadStore.ts` · localStorage key `jkp.leads.v1` (เก็บล่าสุด 200 รายการ)
- ฟอร์ม: `web/src/components/site/RequirementForm.tsx`
- ฝั่งอ่าน: `web/src/components/admin/LeadsBody.tsx`

```ts
type ReqItem = { k: string; v: string };   // k = label ไทย, v = ค่าที่กรอก (พร้อมหน่วยแล้ว)

type StoredLead = {
  id: string;              // ปัจจุบัน client gen: web-<epoch>-<rand> → ให้ server gen แทน
  createdAt: number;       // epoch ms
  name: string;            // ชื่อผู้ติดต่อ (บังคับ)
  phone: string;
  email: string;
  company?: string;        // ชื่อบริษัท / องค์กร
  respondentType?: string; // "เป็น Agent ตัวแทน" | "เป็น ลูกค้า (ผู้เช่า)" (บังคับ)
  message: string;
  typeKey: string;         // house | condo | land | factory | warehouse
  typeLabel: string;       // label ไทย (denormalised ไว้แสดงผล)
  dealIntent: string;      // "เช่า" | "ซื้อ"
  req: ReqItem[];          // สรุปความต้องการเฉพาะที่กรอก (ข้อว่างถูกตัดออกแล้ว)
  source: string;          // "requirement form"
};
```

**ตัวอย่าง payload จริงที่ฟอร์มสร้าง**

```json
{
  "createdAt": 1785753934641,
  "name": "คุณทดสอบ ระบบ",
  "phone": "081-222-3333",
  "email": "",
  "company": "บ. ทดสอบ โลจิสติกส์",
  "respondentType": "เป็น Agent ตัวแทน",
  "message": "ต้องการเข้าดูสถานที่ภายในสัปดาห์นี้",
  "typeKey": "warehouse",
  "typeLabel": "โกดัง / คลังสินค้า",
  "dealIntent": "เช่า",
  "req": [
    { "k": "พื้นที่ใช้สอยที่ต้องการ", "v": "2500 ตร.ม." },
    { "k": "ทำเล / จังหวัดที่สนใจ",   "v": "บางนา, สมุทรปราการ" },
    { "k": "งบประมาณ (เช่า/ซื้อ)",    "v": "150,000/เดือน" }
  ],
  "source": "requirement form"
}
```

**ฟิลด์ที่ฟอร์มถามในแต่ละประเภท** (ชุดย่อ ไม่ใช่ schema เต็มของข้อ 3)

| ประเภท | จำนวน | ฟิลด์ |
|---|--:|---|
| `house` | 4 | ความต้องการ · ห้องนอน · ทำเล · งบประมาณ |
| `condo` | 4 | ความต้องการ · ประเภทห้อง · ทำเล · งบประมาณ |
| `land` | 5 | ความต้องการ · ขนาดที่ดิน · ผังเมืองสี · ทำเล · งบประมาณ |
| `factory` | 6 | ความต้องการ · พื้นที่ใช้สอย · ระบบไฟ · ต้องขอ ร.ง.4 · ทำเล · งบประมาณ |
| `warehouse` | 4 | ความต้องการ · พื้นที่ใช้สอย · ทำเล · งบประมาณ |

นอกจากนี้ทุกประเภทถามร่วมกัน: ชื่อ · เบอร์ · อีเมล · ชื่อบริษัท · **สถานะผู้ตอบ**
(มาจากแบบสอบถาม “ความต้องการใช้โกดังและโรงงาน”)

| Method | Path | รายละเอียด |
|---|---|---|
| `POST` | `/api/public/leads` | 🔵 **PUBLIC** ไม่ต้องล็อกอิน · ต้องมี rate limit + honeypot/captcha · คืนแค่ `{ ok: true }` ห้ามคืนข้อมูลภายใน |
| `GET` | `/api/leads` | รายการสำหรับ Admin → Leads พร้อม filter สถานะ / agent / source / ช่วงวันที่ (chip มีอยู่แล้ว) |
| `PATCH` | `/api/leads/:id` | เปลี่ยนสถานะ + มอบหมาย agent (dropdown ใช้งานได้แล้วแต่ยังไม่บันทึก) |
| `POST` | `/api/leads/:id/notes` | Timeline & Notes — ตอนนี้เพิ่มได้แต่หายเมื่อ refresh |
| `POST` | `/api/leads/:id/tasks` | งานติดตาม — เหมือนกัน |

**การแปลงเป็นแถวในหน้า Admin** (อยู่ใน `webToLead()`)

- ชื่อ lead = `company` ถ้าไม่มีใช้ `name`
- บรรทัดรอง = `name · respondentType`
- สรุปความต้องการ = แถวสถานะผู้ติดต่อ + บริษัท + ประเภททรัพย์ + ความต้องการ แล้วต่อด้วย `req[]`

ถ้า API จะจัดรูปให้เลยก็ได้ แต่ขอให้ยังส่ง field ดิบมาด้วย

---

## 7. แจ้งเตือนสัญญาเช่าใกล้หมด

ตั้งค่าที่ Settings → การแจ้งเตือน (`/admin/notifications`) แล้วผลไปโผล่ที่กระดิ่งบน topbar

### 7.1 สัญญาเช่า (Lease) · 🟡 HARDCODED MOCK

**ที่มา:** `web/src/lib/leaseStore.ts` (`const LEASES` — 7 รายการ)

**ยังไม่มีที่เก็บสัญญาจริงในระบบ** ตอนนี้วันสิ้นสุดเก็บเป็น “อีกกี่วันจากวันนี้” เพื่อให้เดโมไม่หมดอายุ ของจริงต้องเป็นวันที่จริง

```ts
type Lease = {           // รูปที่ frontend ใช้ตอนนี้
  id: string;
  code: string;          // public_code ของทรัพย์
  title: string;
  tenant: string;        // ชื่อผู้เช่า
  endsInDays: number;    // ← ของจริงขอเป็น endDate: "YYYY-MM-DD"
  rent: number;          // บาท/เดือน
  href: string;          // ลิงก์ไปหน้า deal/ทรัพย์
};
```

> **⚠️ สิ่งที่ยังไม่มีในระบบเลย** — ต้องมีที่เก็บ “สัญญาเช่า” ผูกกับทรัพย์ + ผู้เช่า:
> วันเริ่ม, วันสิ้นสุด, ค่าเช่า, สถานะ (active / ต่อแล้ว / ปิด)
> รวมถึง **หน้า UI สำหรับบันทึกสัญญาซึ่งยังไม่ได้ทำ** — ดูข้อ 10

| Method | Path | รายละเอียด |
|---|---|---|
| `GET` | `/api/leases?status=active` | ให้กระดิ่ง + หน้าตั้งค่าใช้คำนวณ · ต้องมี `endDate` |
| `GET` | `/api/leases/expiring?months=1,3` | *ทางเลือก* — ถ้าอยากให้ server คำนวณให้เลย ต้องใช้สูตรเดียวกับ 7.3 |

### 7.2 ค่าตั้งการแจ้งเตือน · 🟣 CLIENT STORE

**ที่มา:** `web/src/lib/leaseStore.ts` · localStorage key `jkp.leaseNotify.v1` · UI: `/admin/notifications`

```ts
type NotifyConfig = {
  enabled: boolean;         // สวิตช์ใหญ่
  months: number[];         // เลือกได้หลายค่า จาก [1, 2, 3]
  includeExpired: boolean;  // เตือนสัญญาที่เลยกำหนดแล้วด้วย
  readIds: string[];        // alert id ที่กด "อ่านแล้ว"
};
```

```json
// ค่าเริ่มต้น
{ "enabled": true, "months": [1, 3], "includeExpired": true, "readIds": [] }
```

| Method | Path | รายละเอียด |
|---|---|---|
| `GET` | `/api/notify-config` | ต่อ user หรือต่อ tenant — ต้องตัดสินใจ (ข้อ 11) |
| `PUT` | `/api/notify-config` | ปุ่มบันทึกในหน้าตั้งค่า |
| `POST` | `/api/notifications/read` | body `{ ids: string[] }` — ปุ่ม “อ่านทั้งหมด” ในกระดิ่ง |

### 7.3 การคำนวณรายการแจ้งเตือน · 🟢 DERIVED

**ที่มา:** `web/src/lib/leaseStore.ts` → `buildAlerts(cfg, leases, now)`

คำนวณฝั่ง client ทั้งหมด ไม่ต้องมี API แต่ถ้าจะย้ายไป server ต้องได้ผลตรงกันเป๊ะ:

```text
1. ถ้า enabled = false → คืน [] (กระดิ่งขึ้นข้อความ "ปิดการแจ้งเตือนอยู่")

2. ต่อ 1 สัญญา ออก alert ได้ไม่เกิน 1 ใบ — ใช้ milestone ที่ "แคบที่สุด" ที่เข้าเงื่อนไข
   เงื่อนไข: daysLeft <= milestone × 30        // 1 เดือน = 30 วันตายตัว

3. daysLeft < 0  → level "expired" (ออกเฉพาะเมื่อ includeExpired = true)
   milestone <= 1 → level "urgent"
   นอกนั้น        → level "warn"

4. alert id = `${lease.id}-${milestone ?? 'expired'}`
   ← id ต้องคงที่ข้าม reload เพื่อให้ readIds ใช้ได้
   ← และเปลี่ยนเมื่อข้าม milestone ใหม่ ทำให้เด้งเป็น "ยังไม่อ่าน" อีกครั้งโดยตั้งใจ

5. เรียงจาก daysLeft น้อย → มาก
```

ผลลัพธ์ที่ทดสอบไว้ (mock 7 สัญญา): `[1,3]`+expired → 5 รายการ · `[1]` → 2 · `[3]` → 4 · ปิด → 0

---

## 8. Validation ที่ backend ต้อง mirror

ทั้งหมดนี้ frontend เช็คให้แล้ว แต่ client-side validation กันคนตั้งใจข้ามไม่ได้

| จุด | กฎ | ข้อความที่ผู้ใช้เห็น |
|---|---|---|
| ฟอร์มแจ้งความต้องการ | ต้องมี `name` | กรุณากรอกชื่อของคุณ |
| ฟอร์มแจ้งความต้องการ | ต้องมี `phone` หรือ `email` อย่างน้อย 1 | กรุณากรอกเบอร์โทรหรืออีเมลอย่างน้อย 1 ช่อง… |
| ฟอร์มแจ้งความต้องการ | ต้องเลือก `respondentType` | กรุณาเลือกสถานะของผู้ตอบแบบสอบถาม |
| ฟอร์มแจ้งความต้องการ | ค่าที่เป็น `"ไม่ระบุ"` หรือค่าว่าง จะไม่ถูกส่งเข้า `req[]` | — |
| Field Builder | ฟิลด์ `required` ปิดไม่ได้ | (toggle ถูกล็อก) |
| ประเภททรัพย์ | ต้องเปิดอย่างน้อย 1 ประเภท | ต้องเปิดอย่างน้อย 1 ประเภททรัพย์ |
| ตั้งค่าแจ้งเตือน | ต้องเหลือเกณฑ์อย่างน้อย 1 (เดือน หรือ “เลยกำหนด”) | ต้องเลือกอย่างน้อย 1 ช่วงเวลา |
| ทรัพย์ | `public_code` แก้ไม่ได้หลังสร้าง | (แสดงเป็นข้อความอ่านอย่างเดียว) |

---

## 9. โมดูลที่ยังเป็น mock ทั้งหมด

UI เสร็จแล้วทุกหน้า แต่ข้อมูลยัง hardcode — ตารางนี้คือรายการงาน API ที่เหลือ

| Route | สถานะ | ต้องมี API สำหรับ |
|---|---|---|
| `/admin` | 🟡 mock | ตัวเลขสรุป 5 การ์ด · Lead pipeline · งานวันนี้ · กิจกรรมล่าสุด · ทรัพย์ยอดนิยม |
| `/admin/properties` | 🟡 mock | CRUD ทรัพย์ (ข้อ 5) |
| `/admin/listings` | 🟡 mock | ประกาศ · สถานะเผยแพร่ · ผูกกับทรัพย์ |
| `/admin/leads` | 🟣 store | ต่อ API ได้ตรง (ข้อ 6) |
| `/admin/requirements` | 🟡 mock | requirement ที่ยืนยันแล้ว แยกจาก lead |
| `/admin/shortlists` | 🟡 mock | shortlist + ลิงก์ให้ลูกค้าดู (`/client-shortlist`) |
| `/admin/visits` | 🟡 mock | นัดชมทรัพย์ · ผลการเข้าชม |
| `/admin/deals` | 🟡 mock | ดีล · offer · เอกสาร · ปิดดีล (สำเร็จ/ไม่สำเร็จ + หมายเหตุ) |
| `/admin/cms` | 🟡 mock | หน้าเนื้อหา · สถานะเผยแพร่ |
| `/admin/page-builder` | 🟡 mock | section ต่อหน้า · เนื้อหา 3 ภาษา (ไทย/EN/中文) |
| `/admin/sections` | 🟡 mock | คลัง section |
| `/admin/media` | 🟡 mock | **ระบบไฟล์จริง** — upload, ลายน้ำ, thumbnail (ผูกกับ kind `media`) |
| `/admin/geography` | 🟡 mock | จังหวัด/อำเภอ/ตำบล + นิคมอุตสาหกรรม (ใช้เป็น options ในฟอร์ม) |
| `/admin/users` | 🟡 mock | ผู้ใช้ + RBAC 6 บทบาท |
| `/admin/branding` | 🟡 mock | โลโก้ สี ฟอนต์ ต่อ tenant |
| `/admin/seo` | 🟡 mock | meta / schema / hreflang |
| `/admin/audit` | 🟡 mock | audit log ทุก mutation + before/after |
| `/admin/login` | 🟡 mock | **ยังไม่มี auth จริงเลย** — ทุกหน้า admin เปิดได้โดยไม่ล็อกอิน |

### หน้าเว็บสาธารณะที่ต้องดึงข้อมูลจริง

| Route | ต้องการ |
|---|---|
| `/` | ทรัพย์แนะนำ · ตัวกรองค้นหา (จังหวัด, ประเภท, ขนาด, ราคา, **พื้นที่สี/ผังเมือง**) |
| `/listing` | รายการประกาศ + filter + ขนาดพื้นที่รวม |
| `/property` | รายละเอียดทรัพย์ · ค่าเช่าล่วงหน้า/เงินประกัน/ค่าน้ำ-ไฟ-ส่วนกลาง · แผนที่ |
| `/contact` | POST lead + อ่าน `typeConfig` |
| `/client-shortlist` | shortlist ที่แชร์ให้ลูกค้าดู (ต้องมี token ในลิงก์) |
| `/warehouse-rent`, `/factory-sale`, `/port-*`, `/airport-*`, `/bangkok-*` | landing page ตามทำเล — ดึงทรัพย์ตาม filter ที่กำหนดไว้ล่วงหน้า |

---

## 10. ลำดับการทำงานที่แนะนำ

เรียงตาม “ปลดล็อกของจริงได้เร็วที่สุดต่อแรงที่ลง” ไม่ใช่เรียงตามความยาก

1. **Auth + tenant** — บล็อกทุกอย่างที่เหลือ ตอนนี้หน้า admin ไม่มีการป้องกันเลย
2. **Field schema + type config** (ข้อ 3) — ทำก่อนเพราะโครงทรัพย์ทั้งระบบขึ้นกับมันและแก้แค่ 1 ไฟล์
3. **Geography** — เป็น options ที่ฟอร์มทรัพย์ต้องใช้ (จังหวัด/อำเภอ/ตำบล)
4. **Media** — เพราะ kind `media` โผล่ในทุกประเภททรัพย์และเป็นฟิลด์บังคับหลายที่
5. **Properties CRUD** (ข้อ 5) — พอ 2–4 เสร็จ อันนี้ต่อได้เลย
6. **Leads** (ข้อ 6) — ต่อง่ายสุดในบรรดา flow ที่มี store แล้ว และเห็นผลทางธุรกิจทันที
7. **Listings → Shortlists → Visits → Deals** — สาย pipeline งานขาย ทำตามลำดับที่ข้อมูลไหล
8. **สัญญาเช่า + แจ้งเตือน** (ข้อ 7) — ต้องสร้าง entity สัญญาใหม่ทั้งก้อน + หน้า UI บันทึกสัญญา
9. **CMS / Page builder / SEO / Branding** — ทำหลังได้ ไม่บล็อกงานขาย
10. **Audit log** — ควรวางตั้งแต่ต้นในชั้น service ไม่ใช่มาไล่เก็บทีหลัง

---

## 11. สิ่งที่ต้องตัดสินใจร่วมกัน

คำถามที่ frontend ตอบเองไม่ได้ และคำตอบเปลี่ยนรูป API

| # | คำถาม | ผลกระทบ |
|--:|---|---|
| 1 | Auth ใช้อะไร — session cookie หรือ JWT? และ RBAC 6 บทบาทบังคับที่ชั้นไหน | ตัวกำหนดว่าจะดึงข้อมูลใน Server Component ได้ไหม (ถ้าเป็น cookie ทำได้เลย) |
| 2 | Multi-tenant แยกด้วย subdomain, path หรือ header? | ทุก endpoint + การอ่าน config ตอน SSR |
| 3 | `resolveFields` ให้ client คำนวณต่อ หรือให้ server คืนฟิลด์ที่ resolve แล้ว? | ถ้า server คืนให้ ลด logic ซ้ำ แต่ Field Builder ต้อง preview ก่อนบันทึกได้ — อาจต้องมีทั้งสองแบบ |
| 4 | ค่าที่แสดงผลเป็นภาษาไทยใน payload (`"เช่า"`, `"เป็น Agent ตัวแทน"`) จะเปลี่ยนเป็น enum code แล้วแปลที่ frontend ไหม? | จำเป็นถ้าจะทำ EN/中文 ให้ครบ (page-builder รองรับ 3 ภาษาอยู่แล้ว) — **แนะนำให้เปลี่ยน** |
| 5 | `NotifyConfig` เป็นค่าต่อผู้ใช้ หรือต่อ tenant? | `readIds` ควรต่อผู้ใช้แน่นอน แต่เกณฑ์เดือนน่าจะเป็นค่าองค์กร — อาจต้องแยก 2 ก้อน |
| 6 | “1 เดือน” = 30 วันตายตัว (ที่ทำไว้) หรือใช้เดือนตามปฏิทิน? | เปลี่ยนวันที่เด้งแจ้งเตือน ต้องตกลงให้ตรงกันทั้งสองฝั่ง |
| 7 | ต้องส่งอีเมล / LINE ตอนสัญญาใกล้หมดด้วยไหม หรือแค่กระดิ่งในระบบ? | ถ้าต้องส่ง ต้องมี scheduled job ฝั่ง server ไม่ใช่คำนวณตอนเปิดหน้า |
| 8 | ฟิลด์ที่แอดมินเพิ่มเอง (`extra`) — ถ้าลบฟิลด์ที่มีข้อมูลอยู่แล้วจะทำอย่างไร? | ตอนนี้ frontend แค่ซ่อน ไม่ลบค่า ควรยืนยันว่า backend ก็เก็บค่าไว้ |
| 9 | กระดิ่งควรมีทุกหน้าไหม? | ตอนนี้ขึ้นเฉพาะหน้าที่ใช้ topbar มาตรฐาน (Dashboard, CMS, Requirements, Users, SEO, Geography) — หน้าที่ทำ topbar เองยังไม่มี |

---

## 12. RBAC — บทบาท ขอบเขต และสิทธิ์พิเศษ

> **ที่มา:** `web/src/lib/rbac.ts` · UI: `/admin/users`
> ออกแบบสำหรับเอเจนซี่ **สาขาเดียว ทีมขายทีมเดียว + co-agent ภายนอก**
> จึงไม่มี scope ระดับ "ทีม" และ **ไม่มี approval workflow** — ทำได้หรือไม่ได้เท่านั้น

### 12.1 สามชั้นที่ต้องเช็คร่วมกัน

สิทธิ์จริงของผู้ใช้ 1 คน = **บทบาท** ∧ **ขอบเขตข้อมูล** ∧ **สิทธิ์พิเศษ**

```ts
type RoleKey = 'owner' | 'manager' | 'agent' | 'co_agent' | 'ops' | 'marketing' | 'translator';
type Scope   = 'own' | 'all';   // เห็นเฉพาะที่ตัวเองเป็นเจ้าของ / เห็นทั้งหมด
type PrivKey = 'pii' | 'publish' | 'price' | 'deal_unlock' | 'internal_note' | 'export' | 'audit';

type UserPermissions = {
  role: RoleKey;
  scope: Scope;          // owner=all และ co_agent=own ล็อกไว้ เปลี่ยนไม่ได้
  privileges: PrivKey[];
  expiresAt?: string;    // บังคับสำหรับ co_agent (บุคคลภายนอก) — ISO date
};
```

### 12.2 🚨 ข้อบังคับสำหรับ backend

1. **บังคับที่ API layer เสมอ** — UI ซ่อนปุ่มเป็นแค่ UX ห้ามใช้เป็นการรักษาความปลอดภัย ทุก endpoint ต้องเช็คเองซ้ำ
2. **`scope: 'own'` = ต้องกรองที่ระดับแถว (row-level)** — `WHERE owner_id = :me` ไม่ใช่ดึงมาทั้งหมดแล้วให้ frontend กรอง มิฉะนั้นข้อมูลลูกค้าของเอเจนต์คนอื่นจะหลุดผ่าน API
3. **PII ปิดบังเป็นค่าเริ่มต้น** — endpoint ต้องคืน `081-xxx-8888` / `s***@mail.com` เว้นแต่ผู้ใช้มีสิทธิ์ `pii`
   การขอดูค่าเต็มต้องเป็น endpoint แยก และ **บันทึกลง audit log ทุกครั้ง** (PDPA ม.37 / GDPR Art.30)
4. **`internalOnly` fields** (ดู §3) ต้องถูกตัดออกถ้าไม่มีสิทธิ์ `internal_note` — และตัดออกเสมอสำหรับ endpoint สาธารณะ
5. **`co_agent` ต้องเช็ค `expiresAt` ทุก request** — หมดอายุแล้วปฏิเสธทันที ไม่ต้องรอ cron
6. **`deal_unlock` ต้องเขียน audit log เสมอ** พร้อมเหตุผล — เป็นการแก้ยอดย้อนหลัง
7. **`export` ควร rate-limit + log** ว่าใครดึงข้อมูลอะไรออกไปเมื่อไหร่

### 12.3 บทบาท

| key | บทบาท | เทียบสากล | scope เริ่มต้น |
|---|---|---|---|
| `owner` | เจ้าของระบบ | Principal / Broker of Record | `all` 🔒 |
| `manager` | ผู้จัดการ | Sales Manager | `all` |
| `agent` | เอเจนต์ขาย | Agent / Negotiator | `own` |
| `co_agent` | Co-agent ภายนอก | Co-broke / Referral Partner | `own` 🔒 + ต้องมี `expiresAt` |
| `ops` | ธุรการ / ปฏิบัติการ | Operations / Transaction Coordinator | `all` |
| `marketing` | การตลาด | Marketing Executive | `all` |
| `translator` | นักแปล | Translator | `all` |

🔒 = ล็อก เปลี่ยนไม่ได้

### 12.4 สิทธิ์พิเศษ + ข้อห้าม

| priv | ความหมาย | บทบาทที่ห้ามให้ |
|---|---|---|
| `pii` | เห็นเบอร์/อีเมลลูกค้าเต็ม | marketing, translator, co_agent |
| `publish` | เผยแพร่ประกาศ / หน้าเว็บ | co_agent, translator |
| `price` | แก้ราคาหลังเผยแพร่ | co_agent, translator |
| `deal_unlock` | ปลดล็อกดีลที่ปิดแล้ว | agent, co_agent, ops, marketing, translator |
| `internal_note` | เห็นหมายเหตุลับของทรัพย์ | co_agent, translator |
| `export` | ส่งออก CSV | co_agent, translator |
| `audit` | ดู audit log | agent, co_agent, ops, marketing, translator |

> `FORBIDDEN_PRIVS` ใน `rbac.ts` เป็นตัวกันตั้งค่าผิดฝั่ง UI — **backend ต้องตรวจซ้ำ** ตอนบันทึก ไม่งั้นยิง API ตรงก็ตั้งได้

### 12.5 Endpoint ที่เสนอ

| Method | Path | รายละเอียด |
|---|---|---|
| `GET` | `/api/users` | รายชื่อ + role + scope + privileges + expiresAt |
| `POST` | `/api/users/invite` | เชิญผู้ใช้ (body: email, role) |
| `PUT` | `/api/users/:id/permissions` | บันทึกจากป๊อปอัป "ตั้งค่าสิทธิ์" — ต้อง validate FORBIDDEN_PRIVS + scope lock ซ้ำ |
| `PATCH` | `/api/users/:id/status` | เปิด / ปิดใช้งาน |
| `GET` | `/api/me/permissions` | frontend เรียกตอน login เพื่อรู้ว่าจะซ่อนเมนูไหน |
| `POST` | `/api/leads/:id/reveal-contact` | ขอดู PII เต็ม — ต้องมีสิทธิ์ `pii` และเขียน audit log |

### 12.6 ตารางสิทธิ์เต็ม

ดูของจริงที่ `MATRIX` ใน `web/src/lib/rbac.ts` (แบ่ง 5 หมวด: ทรัพย์ & ประกาศ · งานขาย & ลูกค้า · สัญญาเช่า & แจ้งเตือน · เนื้อหา & เว็บไซต์ · ระบบ & ตั้งค่า)
หรือเปิดหน้า `/admin/users` → แท็บ **สิทธิ์ (Roles)**

ค่าในตารางมี 5 แบบ: `yes` ทำได้ · `scope` ทำได้ตามขอบเขต · `read` อ่านอย่างเดียว · `priv` ต้องเปิดสิทธิ์พิเศษ · `no` ไม่ได้

---

## ภาคผนวก — ไฟล์สำคัญที่ต้องรู้จัก

| ไฟล์ | หน้าที่ |
|---|---|
| `web/src/lib/propertySchema.ts` | schema ประเภททรัพย์ทั้งหมด + field override + type config + `resolveFields()` |
| `web/src/lib/leadStore.ts` | lead ที่ส่งจากฟอร์มหน้าเว็บ |
| `web/src/lib/rbac.ts` | บทบาท / ขอบเขตข้อมูล / สิทธิ์พิเศษ + ตารางสิทธิ์ (ดู §12) |
| `web/src/lib/socialStore.ts` | ช่องทางลงประกาศ + สถานะรายประกาศ |
| `web/src/lib/summaryTemplate.ts` | ตัวสร้างข้อความโพสต์ (ใช้ร่วมฟอร์มทรัพย์ + Social Status) |
| `web/src/lib/leaseStore.ts` | สัญญาเช่า (mock) + ค่าตั้งแจ้งเตือน + `buildAlerts()` |
| `web/src/components/admin/DynamicFieldForm.tsx` | ตัวเรนเดอร์ฟอร์มจาก schema (ใช้ทั้งเพิ่มและแก้ไขทรัพย์) |
| `web/src/components/admin/FieldBuilderBody.tsx` | UI แก้ schema + เปิด/ปิดประเภททรัพย์ |
| `web/src/components/admin/NotificationBell.tsx` | กระดิ่งแจ้งเตือนบน topbar |
| `web/src/components/admin/NotifySettingsBody.tsx` | หน้าตั้งค่าแจ้งเตือน |
| `web/src/components/site/RequirementForm.tsx` | ฟอร์มแจ้งความต้องการหน้าเว็บ (public) |
| `web/src/components/admin/AdminShell.tsx` | โครง admin (sidebar + topbar + ที่วางกระดิ่ง) |

**localStorage keys ที่ใช้อยู่ทั้งหมด** (ทั้ง 4 ตัวนี้คือสิ่งที่ API จะมาแทน)

```text
jkp.fieldSchema.v1   → Record<typeKey, SchemaOverride>
jkp.typeConfig.v1    → TypeConfig
jkp.leads.v1         → StoredLead[]   (ล่าสุด 200 รายการ)
jkp.leaseNotify.v1   → NotifyConfig
jkp.socialStatus.v1  → { channels: Channel[]; records: Record<listingCode, SocialRecord> }
```

---

*อัปเดตเอกสารนี้เมื่อ schema เปลี่ยน · เวอร์ชัน HTML (อ่านง่ายกว่า มีสารบัญลอย) เผยแพร่เป็น Artifact แยก*
