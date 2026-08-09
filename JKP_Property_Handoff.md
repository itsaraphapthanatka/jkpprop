# Handoff: JKP Property — Website + CMS (Admin) ระบบนายหน้าโรงงาน/โกดังอุตสาหกรรม

## Overview
ระบบครบชุดของ JKP Property นายหน้าอสังหาริมทรัพย์อุตสาหกรรม (โรงงาน/โกดัง เช่า-ขาย) ประกอบด้วย **2 ส่วนหลัก**:
1. **เว็บไซต์สาธารณะ (Public site)** — หน้าที่ลูกค้าเห็น: หน้าแรก, รวมทรัพย์, รายละเอียดทรัพย์, หน้าแยกตามประเภท/ดีล/ทำเล, เกี่ยวกับเรา, FAQ, ติดต่อ และหน้า Client Shortlist (ลูกค้าเปิดจากลิงก์ token)
2. **ระบบหลังบ้าน CMS (Admin)** — เครื่องมือทีมงาน: Dashboard, workflow งานขาย (Leads → Requirement → Shortlist → Visit → Deal), จัดการทรัพย์/ประกาศ/เนื้อหา/รูป และตั้งค่าระบบ (Branding, Users&Roles, Geography, Field Builder, Audit, SEO/GEO add-on)

ระบบออกแบบเป็น **multi-tenant** — เปลี่ยนโลโก้/สี/ฟอนต์ที่หน้า Branding แล้วนำไปใช้กับลูกค้ารายใหม่ได้

## About the Design Files
ไฟล์ในชุดนี้เป็น **design reference ที่สร้างด้วย HTML** (prototype แสดง look & behavior ที่ต้องการ) — **ไม่ใช่ production code ที่จะ copy ไปใช้ตรงๆ** ไฟล์เป็น `.dc.html` (Design Component format ที่มี template + logic class รันผ่าน `support.js`)

งานของนักพัฒนาคือ **สร้างดีไซน์เหล่านี้ขึ้นใหม่ใน codebase จริง** ตาม pattern/library ที่ทีมใช้อยู่ แนะนำ stack: **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui** สำหรับฝั่ง public (ต้องการ SSR/SSG เพื่อ SEO/GEO) และ React ฝั่ง admin — แต่เลือกได้ตามที่ทีมถนัด ถ้ายังไม่มี codebase ให้เลือก framework ที่เหมาะสมที่สุด

## Fidelity
**High-fidelity (hifi)** — สี/ฟอนต์/spacing/interaction เป็นค่าจริงที่ใช้ได้เลย นักพัฒนาควรทำ UI ให้ตรงตามนี้ pixel-perfect โดยใช้ library ของ codebase ทุก interaction (dropdown, modal, toggle, tab, drawer, carousel, live preview) มี state จริงและทำงานได้ใน prototype แล้ว

---

## Design Tokens

### Brand colors
| Token | Hex | ใช้กับ |
|---|---|---|
| Neon green | `#2DFB91` | CTA หลักบนพื้นเข้ม, badge active |
| Green 600 (action) | `#0D6C3B` | ปุ่มหลักบนพื้นสว่าง, สถานะสำเร็จ |
| Deep teal (accent) | `#034956` | eyebrow, ลิงก์, ไอคอนเน้น, ราคา |
| Deep pine | `#273c33` | active state, ปุ่มโมดัล, tab active หลังบ้าน |
| Near black | `#04140C` / `#0A0E0C` | พื้น footer, sidebar หลังบ้าน |
| Emerald gradient | `#0B7A45 → #0A5C39 → #043F20` | การ์ด CTA, แบนเนอร์ |
| Gold | `#D9A62B` | โทรศัพท์, เรียงตาม, คำเตือน/แนะนำ |
| Purple (admin only) | `#7A3FB0` | หมวดตั้งค่า/Field Builder |
| Danger | `#C0392B` | ลบ, ยกเลิก, ไม่ว่าง |

### Neutrals / surfaces (CSS variables)
Public site: `--bg:#F9F8F5` `--bg2:#F3F0EC` `--surface:#FFFFFF` `--tint:#EEF4F3` `--text:#28251D` `--muted:#5F5A52` `--muted2:#7A7974` `--muted3:#9B968D` `--border:#E7E3DC` `--accent:#034956`
Admin (พื้นเทาอ่อนกว่านิด): `--bg:#F6F5F1` + `--sidebar:#0A0E0C` (ที่เหลือเหมือนกัน)

### Typography
- Font: **Noto Sans Thai** (400–800) + Inter fallback; **JetBrains Mono** สำหรับราคา/รหัส/โค้ด
- Scale: H1 44px/700 (มือถือ 34/28), H2 34px/700, H3 22px/800, body 15–16px/400, eyebrow 13px/700 uppercase letter-spacing .08em, price 21px/800 mono

### Spacing & radius
- Spacing scale: 4 / 8 / 16 / 24 / 44 / 88px
- Radius: sm 10–12px, md 16–18px, lg 20–24px, full 9999px (pill/ปุ่ม)

### Icons
เส้นสไตล์ iOS/SF-Symbols — `stroke-width:1.7px`, `stroke-linecap/linejoin:round` ทุกอัน (inline SVG 24×24 viewBox)

### Motion
- hover-lift: `translateY(-2px)` .2s
- card-hover: .3s cubic-bezier(.2,.7,.3,1) + shadow
- drawer/modal: .35s slide, backdrop `rgba(2,14,8,.55)` + blur(3px)
- scroll-reveal บนหน้า public (fade + translateY 28px)

### Component patterns
- ปุ่ม = pill (border-radius 9999px) เสมอ + hover lift/glow
- การ์ด = border 1.5px + hover ยกลอย + shadow
- Chips/badges = pill เล็ก
- Modal = center, max-width ~460–520px, radius 20px, header/body/footer แยกส่วน
- Admin shell = sidebar เข้ม 248px (fixed) + topbar sticky blur + main scroll

---

## Screens / Views

> **หมายเหตุ workflow:** ระบบทั้งหมดหมุนรอบ **Lead Pipeline 9 สถานะ** (new → qualified → profile_received → requirements_confirmed → shortlisted → visit_scheduled → negotiating → won / lost) สถานะเดินหน้าอัตโนมัติเมื่อเกิด event และเปลี่ยนได้เฉพาะ transition ที่ถูกต้อง (state machine)

### ══ ส่วนที่ 1: เว็บไซต์สาธารณะ ══

#### Home (`Home.dc.html`)
- **Purpose**: หน้าแรก สร้างความน่าเชื่อถือ + เก็บ lead
- **Layout**: header sticky (glass blur, หด-ขยายตาม scroll) → hero เต็มจอมีกล่องค้นหา frosted + คำหมุน (kinetic typography: โกดัง/โรงงาน/คลังสินค้า/ที่ดิน) → carousel ทรัพย์มาใหม่ → แผนที่ทำเล interactive (คลิกเลือกโซน + popup เลือกสนามบิน/ท่าเรือ) → 4 ขั้นตอน timeline auto → why-us count-up + award → trust wall เลื่อนเอง → certification 3 ตรา → CTA band 2 คอลัมน์ (เนื้อหา + รูปทีมงาน) → footer พื้นดำ radius บนโค้ง
- **Interactions**: search bar, carousel arrows (เลื่อนทั้งล็อต), หัวใจ favorite, แผนที่คลิกโซน→popup→นำทางไปหน้า listing ที่ path ถูก, scroll-reveal ทั้งหน้า, hamburger drawer บนมือถือ, cookie PDPA, back-to-top
- **Flow**: ปุ่ม CTA/ติดต่อ → Contact; การ์ดทรัพย์ "ดูรายละเอียด" → PropertyDetail; nav dropdown โรงงาน/โกดัง → หน้าแยกประเภท

#### Listing + หน้าแยก (`Listing`, `FactoryRent`, `FactorySale`, `WarehouseRent`, `WarehouseSale`, `AirportDonmuang`, `AirportSuvarnabhumi`, `BangkokCBD`, `BangkokNonthaburi`, `PortMahachai`, `PortLaemChabang`, `PortMapTaPhut`)
- **Purpose**: รวมทรัพย์ + กรอง; หน้าแยกคือ Listing เดียวกันที่ preset filter ไว้ (SEO)
- **Layout**: breadcrumb → toolbar (จำนวน + เรียงตาม dropdown + แชร์ dropdown) → sidebar filter ซ้าย (โซน/ประเภท/ขนาด/ราคา + toggle เช่า/ขาย) + grid การ์ด 3 คอลัมน์ → pagination. มือถือ: sidebar → drawer เปิดด้วยปุ่ม "ตัวกรอง"
- **Components**: การ์ดทรัพย์ (รูป cover เต็ม radius 4 มุม, badge ให้เช่า/ขาย, หัวใจ, ราคา mono สีเขียว, ปุ่มดูรายละเอียด pill outline #273c33)
- **Flow**: ปุ่ม "ดูรายละเอียด" → PropertyDetail; ปุ่ม active ใช้สี `#034956`

#### PropertyDetail (`PropertyDetail.dc.html`)
- **Purpose**: หน้าขายรายทรัพย์
- **Layout**: gallery (รูปหลัก + thumbnail 3, +9) → 2 คอลัมน์: ซ้าย (title/ราคา/quick specs 4 ช่อง/ตารางสเปก 12 แถว/คุณสมบัติ chips/โซน/แผนที่ระดับพื้นที่+สถานที่ใกล้เคียง), ขวา sticky (กล่อง "ขอข้อมูล" — Line/WeChat/WhatsApp + ฟอร์ม prefill รหัสทรัพย์) → ทรัพย์คล้ายกัน 3 การ์ด
- **Flow**: ฟอร์มขอข้อมูล → lead ใหม่ (ระบุ property code)

#### About / FAQ / Contact (`About`, `FAQ`, `Contact`)
- About: hero (มุมล่างขวาโค้ง 72px) + เรื่องราว + สถิติ + ทีมงาน + CTA
- FAQ: hero + search + accordion หมวดหมู่ (sidebar หมวด + คำถามพับ/ขยาย)
- Contact: การ์ดที่ตั้ง/โทร (ขาย+ทั่วไป แยกภาษา)/อีเมล + เวลาทำการ + social + ฟอร์มส่งข้อความ (มีสถานะ "ส่งแล้ว ✓") + แผนที่ (image-slot วาง Google Maps embed จริง)
- **Flow**: ฟอร์ม Contact → lead ใหม่

#### ClientShortlist (`ClientShortlist.dc.html`)
- **Purpose**: หน้าที่ลูกค้าเปิดจากลิงก์ token (ไม่ต้อง login) ดูทรัพย์ที่ทีมคัดให้
- **Layout**: แถบ broker + badge "ลิงก์ส่วนตัว" → การ์ดแบรนด์ลูกค้า (โลโก้ + ชื่อบริษัท + ที่อยู่ + รหัส SL + วันที่) → สรุปความต้องการ chips → **2 มุมมองสลับได้: การ์ด / ตารางเปรียบเทียบ** → การ์ดติดต่อ agent
- **Interactions**: ปุ่ม feedback ต่อทรัพย์ (สนใจ/ยังไม่ตัดสินใจ/ไม่สนใจ) sync ทั้ง 2 มุมมอง, ตารางเปรียบเทียบหัวเขียวไล่เฉด + sticky คอลัมน์ซ้าย, ปุ่มดูรายละเอียดต่อทรัพย์
- **Flow**: เชื่อมกับ AdminShortlist — feedback ส่งกลับถึงทีม

### ══ ส่วนที่ 2: ระบบหลังบ้าน CMS (Admin shell ร่วมกัน) ══

> **Admin shell**: sidebar เข้ม 248px (โลโก้ + nav จัดกลุ่ม: ทรัพย์ / งานขาย / เนื้อหา&ระบบ + user footer) + topbar sticky (breadcrumb + title + actions) + main scroll พื้น `#F6F5F1`. มือถือ: sidebar → top nav เลื่อนแนวนอน, main full-width, grid stack

#### AdminDashboard
สรุปงาน: stat cards 5 (hover lift), Lead Pipeline funnel 7 ระดับ, กิจกรรมล่าสุด, งานวันนี้ (priority), ทรัพย์ยอดนิยม

#### AdminLeads (จุดรับ lead จากเว็บ)
Master-detail: รายการ lead ซ้าย (คลิกสลับ) + รายละเอียดขวา (ผู้ติดต่อ/บริษัท/สรุป requirement/งานติดตาม/timeline). Interactions: ชิปกรอง 4 (dropdown เลือกได้), เปลี่ยนสถานะ, มอบหมาย agent, เพิ่มงาน, เพิ่มโน้ต→timeline. **Flow: ฟอร์มหน้าเว็บ → มาโผล่ที่นี่อัตโนมัติ → โทรกลับ → เปิด Requirement**

#### AdminRequirement (Flow B)
Progress rail 5 ขั้น + สรุปความต้องการ + checklist เกณฑ์พิเศษ + **Availability Gate** (เช็คว่าง ก่อน shortlist — FR-AVL-04). Interactions: ปุ่ม "เช็คทรัพย์ใหม่" (modal สแกน → เจอทรัพย์ว่าง → เพิ่มเข้า gate), ปุ่ม "Cancel requirement" (modal เลือกเหตุผล+ข้อ → ยืนยัน → สถานะ cancelled + banner แดง + rail ยุบ + ปุ่มเปิดใหม่). **Flow: จาก Lead → สร้าง Shortlist**

#### AdminShortlist
requirement summary sticky ซ้าย + ค้นหาเพิ่มทรัพย์ (ทรัพย์ไม่ว่าง blocked) + รายการจัด rank + โน้ต + ปุ่มลบ (rank เรียงใหม่). ปุ่มส่ง → modal สร้าง token link. **Flow: ส่ง → ลูกค้าเปิด ClientShortlist → นัด Visit**

#### AdminVisit (Flow C)
Criteria gate (ยืนยันก่อนจัดนัด) + แผนเข้าชม + appointments (landlord + เวลา + ทรัพย์ + outcome) + route timeline + **CTA เปิด Google Maps directions พร้อม waypoints** (แสดงเมื่อ gate confirmed). ปุ่มเพิ่มนัด, ปิด plan. **Flow: → Deal**

#### AdminDeal (Flow D)
Stage rail 6 ขั้น + ประวัติ offers (ลูกค้า↔เจ้าของ) + เอกสาร + สรุปดีล + commission. ปุ่ม Close deal → dialog → lead = won + ล็อกฟิลด์การเงิน (unlock เฉพาะ super admin)

#### AdminProperties (คลังทรัพย์)
summary strip + filter bar + ตาราง 8 ทรัพย์ (public_code auto สีเขียว, ประเภท+ไอคอน, สถานะแปล 3 ภาษา) + pagination + ⋮ menu (ดู/แก้/จัดการประกาศ/ทำสำเนา/ลบ) + drawer "เพิ่มทรัพย์" 5 tabs

#### AdminPropertyView / AdminPropertyEdit
View: หน้าดูรายละเอียดหลังบ้าน (status strip, gallery, specs, คุณสมบัติ, สถานะแปล, sidebar ประกาศที่ผูก/แผนที่/ประวัติ). Edit: ฟอร์ม 5 tabs เต็ม (ข้อมูล/Specs/Features/Media/Translations) เติมข้อมูลเดิม แก้ได้ทุกฟิลด์

#### AdminListings (ประกาศ)
1 ทรัพย์ประกาศได้หลายแบบ (เช่า/ขายแยก). status tabs + filter + checkbox เลือก → bulk bar (publish/unpublish) + badge สถานะ/ดีล + featured star + Export dropdown (.xlsx/.csv) + ⋮ menu ตามสถานะ + modal "สร้างประกาศ" (เลือกทรัพย์→ดีล→ราคา→สถานะ + preview ว่าจะไปโผล่หน้าไหน). **Flow: publish → ไปโผล่หน้าเว็บกลุ่มที่ตรง**

#### AdminCMS / AdminPageBuilder / AdminSections / AdminMedia
- CMS: จัดการ Pages/บทความ/FAQ/ใบรับรอง + tab ภาษา TH/EN/ZH + rich text toolbar + SEO
- PageBuilder/Sections: แก้ทุก section ของหน้าเว็บ (รูป/หัวข้อ/ข้อความ) + toggle เปิด-ปิด + ลากจัดลำดับ + live preview
- Media: คลังรูปกลาง โฟลเดอร์ + แท็บกรอง + dropzone + เลือกรูป

#### AdminSettings (hub) + Branding / Users / Geography / FieldBuilder / Audit / SEO
- Settings: การ์ด 6 ลิงก์ไปหน้าตั้งค่า
- Branding: 12 พรีเซ็ตธีม + เลือกสี/ฟอนต์/radius/โลโก้ + **live preview mini เว็บ** (desktop/mobile)
- Users&Roles: ตาราง users + **RBAC matrix 7 บทบาท × ขอบเขตข้อมูล × สิทธิ์พิเศษ** + modal เชิญ (ตัวจริง: `web/src/lib/rbac.ts`)
- Geography: cascade จังหวัด→อำเภอ→ตำบล + นิคมอุตสาหกรรม (toggle)
- FieldBuilder: no-code สร้างฟิลด์ทรัพย์ + palette ชนิดฟิลด์ + toggle แสดงบนเว็บ
- Audit: log ทุก mutation + before/after diff
- SEO/GEO/AEO: **บริการเสริม (add-on)** — เปิดใช้ → อัปโหลด llms.txt + robots.txt → บริการทำงาน

---

## State Management
แต่ละหน้ามี local state (React class component ใน prototype) — ในระบบจริงแนะนำ:
- **Server state**: React Query / SWR ดึงข้อมูลจาก API (properties, listings, leads, ฯลฯ)
- **Lead pipeline**: state machine ที่ backend enforce (เปลี่ยนได้เฉพาะ transition ถูกต้อง)
- **UI state ที่ต้องมี**: dropdown open, modal open, tab active, filter selections, checkbox selections, drawer open, form fields, toggle states, carousel index
- ทุก interaction ใน prototype ระบุ state ไว้ชัด (ดูใน logic class ของแต่ละ .dc.html)

## Cross-cutting rules (สำคัญ — จาก spec)
- **RBAC ที่ API layer** ไม่ใช่แค่ซ่อน UI (7 roles: owner, manager, agent, co_agent, ops, marketing, translator — ดู FRONTEND_API_SPEC.md §12)
- **Audit ทุก mutation** เก็บ before/after JSON
- **ซ่อนพิกัดจริง** — API ไม่ส่ง lat/long เมื่อ map_visibility ≠ exact
- **SSR/SSG บังคับ** ฝั่ง public เพื่อ SEO/GEO (เนื้อหาครบใน HTML แรก)
- **i18n 3 ภาษา** (TH/EN/ZH) label/error ทุกตัวมาจาก translation file ไม่ hardcode
- **public_code** ของทรัพย์ generate อัตโนมัติจากจังหวัด (เช่น JKP-SPK0042)
- **Property ≠ Listing**: 1 ทรัพย์ (ข้อมูลจริง) → หลายประกาศ (เช่า/ขาย ราคา/สถานะแยก)

## Assets
- โลโก้: `assets/jkp-logo-green.png` (บนพื้นสว่าง), `assets/jkp-logo-white.png` (บนพื้นเข้ม)
- llms.txt / robots.txt ตัวอย่าง: `assets/llms.txt`, `assets/robots.txt`
- รูปประกอบทั้งหมดเป็น placeholder จาก Unsplash (มี credit ในโค้ด) — แทนด้วยรูปจริงของลูกค้า
- ไอคอนทั้งหมดเป็น inline SVG (ไม่มี icon library dependency) — แปลงเป็น lucide-react ได้ (สไตล์ตรงกัน)

## Files
ไฟล์ดีไซน์ทั้งหมดอยู่ในโฟลเดอร์นี้ (`.dc.html`) — เปิด `index.dc.html` เป็นสารบัญ กดดูได้ทุกหน้า, `Design Overview.dc.html` อธิบาย workflow ภาพใหญ่, `Design System.dc.html` เป็น token reference, `CMS Sitemap.dc.html` เป็นแผนผังระบบ. โครงสร้าง template + logic แต่ละไฟล์อยู่ระหว่าง `<x-dc>` (markup) และ `<script data-dc-script>` (state/logic class)
