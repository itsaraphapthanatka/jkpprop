# DESIGN.md — Design System & Operating Guide (JKP Property)

เอกสารนี้เป็น **design authority ฉบับ self-contained** ของโปรเจกต์ — รวม **design tokens ค่าจริง** + หลักการออกแบบ + สเปกคอมโพเนนต์ ไว้ที่เดียว เพื่อให้ทุกหน้า/คอมโพเนนต์ที่พัฒนาต่อ **ตรงกับดีไซน์จริง** และสม่ำเสมอกันทั้ง public + admin

---

## 0. Source of truth (ลำดับความสำคัญด้านดีไซน์)

1. **`design/Design System.dc.html`** — token reference ตัวจริง (มีตัวอย่าง live) + **`design/CLAUDE.md`** (สรุป token) = **แหล่ง token ที่ถูกต้องที่สุด**
2. **`design/*.dc.html`** (เช่น `Home.dc.html`, `PropertyDetail.dc.html`, `Listing.dc.html`, …) = **pixel-level reference ต่อหน้า** — เปิดดู markup + ค่า inline จริงเพื่อลอก layout/spacing/copy
3. **`design/assets/`** = asset จริง (โลโก้ green/white, `thailand-map-bg.png`, llms.txt, robots.txt)
4. **`DESIGN.md` (ไฟล์นี้)** = สรุป token + กติกา governance (ถ้าขัดกับ `design/`, ให้ยึด `design/`)
5. **`JKP_Property_Handoff.md`** = ภาพรวม screen/flow · **`SPEC_PACK.md`** = requirement/behavior · **`HOME_HANDOFF_CHECKLIST.md`** = สิ่งที่ยังต้องเติมเพื่อทำ Home 100%

> **กฎ pixel-fidelity (สำคัญ):** โปรเจกต์นี้ต้อง **reproduce ดีไซน์ใหม่ใน `design/*.dc.html` ให้ตรง (faithful/pixel-close)** — สิ่งที่ห้ามคือ **clone เว็บ "เก่า" (legacy thaiindustrialproperty)** ไม่ใช่ห้ามลอกดีไซน์ใหม่. ดีไซน์ใน `design/` คือแบรนด์ที่อนุมัติแล้ว = เป้าหมายที่ต้องทำให้เหมือน
>
> **ขอบเขตไฟล์นี้:** `DESIGN.md` = **design tokens + กติกา (ระบบกลาง)** เท่านั้น. **Layout ระดับ pixel ต่อหน้าอยู่ใน `design/<Page>.dc.html`** — token ในไฟล์นี้คือ "ค่ากลาง" หน้าจริงอาจมี local override (เช่น footer Home ใช้ `#000000`) จึง **ต้อง verify กับ `design/*.dc.html` เสมอ** ก่อนเขียนโค้ดจริง. ไฟล์นี้เป็น **แหล่ง visual authority เดียว** — `AGENT.md` แค่ชี้มาที่นี่ ไม่กำหนดค่าเอง

---

## 1. Design mission
สร้าง **industrial property platform** ที่ *เชื่อถือได้ · ใช้งานง่าย · ค้นหา-ตัดสินใจได้ดี · รองรับ workflow จริงของ brokerage* งานออกแบบต้องทำ 4 อย่างพร้อมกัน: สร้าง trust ระดับแบรนด์ · ทำให้ข้อมูล inventory/geography เข้าใจง่าย · ลด friction การส่ง inquiry/requirement · ต่อเชื่อม workflow ไป admin/CRM

**ไม่ใช่:** luxury real-estate site · startup SaaS gradient · template portal ที่มีแต่ card grid · reskin เว็บเก่าโดยไม่แตะ data/flow → โทนต้อง professional, grounded, modern, trustworthy

---

## 2. Canonical Design Tokens (ค่าจริงจาก `design/Design System.dc.html`)

> **ห้ามคิดสี/ฟอนต์/radius/spacing ใหม่ที่ไม่อยู่ในลิสต์นี้** (ตาม `design/CLAUDE.md`)

### 2.1 Brand colors
| Token | Hex | ใช้กับ | สีตัวอักษรบนพื้นนี้ |
|---|---|---|---|
| Neon green | `#2DFB91` | CTA หลัก**บนพื้นเข้ม**, chip active, จุดเน้น, ตัวเลข stat บนพื้นดำ | `#022310` (เขียวเข้ม) |
| Green 600 (action) | `#0D6C3B` | **ปุ่มหลักบนพื้นสว่าง**, badge "ขาย", สถานะสำเร็จ | `#FFFFFF` |
| Deep teal (accent) | `#034956` | eyebrow, ลิงก์, ไอคอนเน้น, **ราคา** | — (เป็นสีตัวเอง) |
| Deep pine | `#273c33` | active state ไอคอน/border, ปุ่ม dark, ปุ่มในโมดัล | `#FFFFFF` |
| Near black | `#04140C` / `#0A0E0C` | panel/section เข้ม, stat card (หมายเหตุ: footer หน้า Home ใช้ `#000000` — ดู §2.8) | `#FFFFFF` |
| Emerald gradient | `linear-gradient(135deg,#0B7A45 0%,#0A5C39 45%,#043F20 100%)` | การ์ด CTA band, panel เด่น | `#FFFFFF` (accent `#C3FED5`) |
| Gold | `#D9A62B` | โทรศัพท์, เรียงตาม (sort), คำแนะนำ/แนะนำ | `#FFFFFF` |
| Danger | `#C0392B` | ลบ/ยกเลิก/ไม่ว่าง/error (subtle bg `#F9E4E1`, border `#E4C4C0`) | `#FFFFFF` |
| Purple (admin เท่านั้น) | `#7A3FB0` | หมวดตั้งค่า / Field Builder (ใช้เฉพาะ admin) | `#FFFFFF` |

หมายเหตุ: gold ใช้เป็น **accent เฉพาะจุด** (โทร/sort/แนะนำ) — **ห้ามใช้เป็นสี CTA หลัก** (CTA หลัก = green 600 บนพื้นสว่าง / neon บนพื้นเข้ม)

### 2.2 Neutrals / surfaces (CSS variables)
```css
--bg:#F9F8F5;      /* พื้นหลังหลักทั้งเว็บ */
--bg2:#F3F0EC;     /* พื้น section สลับ (เช่น 4 ขั้นตอน) */
--surface:#FFFFFF; /* พื้นการ์ด/โมดัล/เฮดเดอร์ */
--tint:#EEF4F3;    /* พื้นรอง/ไอคอนวงกลม/hover เบา */
--text:#28251D;    /* ตัวอักษรหลัก */
--muted:#5F5A52;   /* ตัวอักษรรอง (body/description) */
--muted2:#7A7974;  /* ตัวอักษรจาง (caption/meta) */
--muted3:#9B968D;  /* จางสุด (label เลข/breadcrumb) */
--border:#E7E3DC;  /* เส้นขอบมาตรฐาน */
--accent:#034956;  /* accent หลัก (eyebrow/ลิงก์/ไอคอน/ราคา) — ลิงก์ hover #023742 */
```

### 2.3 Typography
- ฟอนต์: **Noto Sans Thai** (400–800) + Inter fallback · **JetBrains Mono** (500) สำหรับราคา/รหัส/โค้ด
- โหลด: `Noto+Sans+Thai:wght@400;500;600;700;800` + `JetBrains+Mono:wght@500`

| Role | ค่า |
|---|---|
| Hero H1 | 44px / 700 / letter-spacing -.01em |
| Section H2 | 34px / 700 / -.01em |
| Card H3 | 22px / 800 |
| Body | 15–16px / 400 / line-height ~1.7 / สี `--muted` |
| Eyebrow | 13px / 700 / uppercase / letter-spacing .08em / สี `#273c33` (มักมีแท่ง 26×2px นำหน้า) |
| Price | JetBrains Mono 21px / 800 / สี `#034956` |

### 2.4 Spacing scale
`4 · 8 · 16 · 24 · 44 · 88px`
- 4 = gap ไอคอน+ข้อความเล็ก · 8 = gap ปุ่ม/ชิป · 16 = padding การ์ดย่อย, gap grid มือถือ · 24 = padding แนวนอน container · 44 = gap ระหว่าง sub-section · 88 = padding บน/ล่าง section ใหญ่ (desktop)

### 2.5 Radius (ค่า exact)
`sm 10px · md 18px · lg 24px · full 9999px (pill)` — การ์ดส่วนใหญ่ 16–18px, ปุ่ม/ชิป = full, footer โค้งบน ~34px

### 2.6 Icons
สไตล์ iOS/SF Symbols — `stroke-width:1.7px`, `stroke-linecap/linejoin:round` ทุกอัน, viewBox 24×24, สีปกติ `#034956` (ในวงกลม `--tint`). ใช้ inline SVG หรือ lucide-react (สไตล์ตรงกัน)

### 2.7 Motion
| Token | ค่า | ใช้กับ |
|---|---|---|
| hover-lift | `translateY(-2px)` .2s | ปุ่มลอยขึ้นตอน hover |
| hover-glow | `box-shadow` .2s (สีเดียวกับปุ่ม @ .4 alpha) | ปุ่มเรืองแสง |
| card-hover | `translateY(-6~-8px)` .3s `cubic-bezier(.2,.7,.3,1)` + shadow `0 20px 40px rgba(0,0,0,.1)` | การ์ด listing/feature |
| reveal-up | opacity + `translateY(28px)` .7s | scroll-reveal ทีละ section |
| drawer-slide | `translateX` .35s `cubic-bezier(.2,.8,.3,1)` | เมนู hamburger มือถือ |

### 2.8 Component specs (จาก Design System)
**ปุ่ม** (h48, padding 0 26px, radius 9999px, font 14.5px):
- Primary: `#0D6C3B` / #fff / 700 · hover lift + shadow `rgba(13,108,59,.4)`
- Neon CTA: `#2DFB91` / `#022310` / 800 · glow `rgba(45,251,145,.4)`
- Dark: `#273c33` / #fff / 700
- Outline: transparent / border 1.5px `--border` / `--text` / 700 · hover border `#273c33` + bg `--tint`
- Gold: `#D9A62B` / #fff / 800

**Chips/badges:** active `#2DFB91`/`#022310` h32 · idle `--tint`/`--text` h32 · verified `#EEF4F3`/`#034956` h24 + ✓ · badge "ให้เช่า" `rgba(255,255,255,.94)`/`#28251D` + shadow · badge "ขาย" `#0D6C3B`/#fff — ทั้งหมด pill

**การ์ด:** standard bg `--surface` / border **1.5px** `--border` / radius 18 / hover lift + shadow · dark gradient card (emerald) text #fff, accent `#C3FED5` · stat card `#04140C` เลข `#2DFB91` 26/800

**Header:** sticky, `background:rgba(249,248,245,.92)`, `backdrop-filter:blur(16px) saturate(1.5)`, border-bottom 1px `--border`, height **72px**

**Footer:** พื้น **`#000000`** (หน้า Home จริง — *ไม่ใช่* `#04140C`), ตัวอักษร `#C9C5BD`, ลิงก์ `#2DFB91`, โค้งมุมบน 34px, `position:fixed;bottom:0` (footer ตรึงล่าง)

**Container:** max-width **1200px**, padding แนวนอน 24px

### 2.9 Semantic status (map จากสีแบรนด์ — อย่าคิดสีใหม่)
- **success:** `#0D6C3B` (green 600) / on `#fff` — เช่น "ยืนยันแล้ว", สถานะสำเร็จ
- **warning / แนะนำ:** `#D9A62B` (gold) / on `#fff`
- **error / danger / ไม่ว่าง:** solid `#C0392B` · subtle bg `#F9E4E1` · border `#E4C4C0` · on `#fff` (ค่าจริงจาก `AdminRequirement.dc.html`)
- **info:** `#034956` (deep teal / accent) — ดีไซน์ไม่มีสี info แยก ใช้ teal

### 2.10 States
- **focus / selected ring:** `box-shadow: inset 0 0 0 3px #034956` (teal) — จาก input/selected จริง (`Home.dc.html:780`)
- **input error:** border `#C0392B`
- **hover:** ปุ่ม lift+glow (§2.7) · การ์ด lift+shadow · ลิงก์ accent → hover `#023742`
- **disabled:** opacity ~.5 + `cursor:not-allowed` — *(derived; ยืนยันกับหน้าจริงเมื่อเจอ element จริง)*

### 2.11 Breakpoints (จาก `Home.dc.html` จริง)
- **≤1024px:** nav → hamburger (เมนู desktop ซ่อน)
- **≤980px:** grid 2-col → 1col, 3/4-col → 2col, footer 4col → 2col, **H1 44→34px**
- **≤640px:** ทุก grid → 1 คอลัมน์ (mobile stack เต็ม)

### 2.12 Z-index & elevation (จากหน้าจริง)
- **z-index:** local 1–7 · sticky ~50 · header **200** · drawer/overlay **400** · dropdown/modal/popover **900**
- **shadow scale:**
  - sm (การ์ดปกติ / badge): `0 1px 3px rgba(0,0,0,.05)` · badge `0 2px 8px rgba(0,0,0,.12)`
  - md (card hover): `0 20px 44px rgba(0,0,0,.18)` หรือ green-tint `0 22px 44px rgba(2,35,16,.16)`
  - lg (modal/overlay): `0 40px 80px rgba(0,0,0,.4)`
  - glow: neon `0 6–12px … rgba(45,251,145,.4–.5)` · green btn `… rgba(13,108,59,.4)`

---

## 3. Design principles
1. **Clarity before decoration** — เข้าใจ inventory/area/next-step เร็ว สำคัญกว่าดูหวือหวา
2. **Trust before persuasion tricks** — conversion มาจากความน่าเชื่อถือ ไม่ใช่ urgency gimmick
3. **Structure before style** — เริ่มจาก role/hierarchy/task ก่อน visual (แต่ปลายทางต้องตรงดีไซน์)
4. **System consistency over isolated beauty** — ใช้ token/pattern ชุดเดียวทั้ง public + admin
5. **Guided discovery over raw browsing** — search/GEO/compare/requirement/trust ทำงานร่วมกันพาผู้ใช้ไปข้างหน้า

## 4. Color rules
- พื้นขาว/อ่อน (`--bg`/`--surface`) เป็นฐาน public
- text hierarchy ผ่าน neutral darks ไม่ใช่หลายสี
- green = primary CTA / highlight / trust emphasis · neon เฉพาะบนพื้นเข้ม
- semantic status (success/warning/error) แยกจาก brand เมื่อจำเป็น (success derive จาก green ได้)
- อย่าให้ tag/filter ใช้เขียวหลายเฉดจนแย่ง hierarchy ของ CTA · gold = accent เฉพาะจุด ไม่ใช่ CTA

## 5. Typography / Layout rules
- Thai-friendly sans เป็นแกน, hierarchy จาก size/weight/spacing
- body ไม่เล็กเกินไป (15–16px) · ราคา/รหัสใช้ mono ให้ scan ง่าย
- homepage/public ใช้ section rhythm: trust → discovery → decision → inquiry
- listing เน้น filter clarity + result readability · detail จัดลำดับเพื่อ evaluation · admin จัดเพื่อ throughput

## 6. Component philosophy
component = พาหะของ workflow ไม่ใช่แค่ UI block:
- search module = **gateway** ไม่ใช่แค่ฟอร์ม
- listing card = **decision-entry** ไม่ใช่แค่ teaser
- detail inquiry = เชื่อม conversion context ชัด
- trust modules = ลดความเสี่ยงเชิง perception
- admin object views = next task เห็นชัดในหน้าจอเดียว

## 7. UX priorities
**Public:** (1) เข้าใจว่าแบรนด์ช่วยอะไร (2) ค้นหา inventory/area เร็ว (3) ประเมิน listing มั่นใจ (4) ส่ง inquiry/requirement ง่าย+มีบริบท (5) ถูกพาไป next step
**Admin:** เร็ว · ลด context switching · state/ownership/pending/history เห็นง่าย · calm & structured · dense ได้แต่ต้อง readable · ไม่หลุด token base เดียวกัน

## 8. Imagery · Responsive · Accessibility
- **Imagery:** ใช้ภาพจริงเป็นหลัก (real-world proof) — asset จริงอยู่ที่ `design/assets/` + `design/uploads/`
- **Responsive:** รักษา task clarity ทุก breakpoint (mobile ต้องค้นหา+ส่ง requirement ได้จริง; iPad/tablet เป็น breakpoint สำคัญ; อย่าให้ responsive ทำลาย hierarchy ของ CTA)
- **A11y:** contrast พอ, body ไม่เล็ก, focus/hover/active ชัด, form label/helper/validation เข้าใจง่าย, tap target ใช้จริงได้

## 9. Anti-patterns (ห้ามทำ)
- clone เว็บ **เก่า (legacy)** pixel-perfect *(แต่ reproduce ดีไซน์ **ใหม่** ใน `design/` ให้ตรง = ต้องทำ)*
- gradient-heavy startup visuals · luxury cues ที่ขัด industrial trust posture
- listing เป็น card wall ไม่มี guided evaluation · detail เป็น data dump ไม่มี hierarchy
- admin เป็น generic CRUD ที่ไม่สะท้อน workflow
- ใช้ gold เป็น CTA default · คิดสี/radius/spacing นอกลิสต์ §2
