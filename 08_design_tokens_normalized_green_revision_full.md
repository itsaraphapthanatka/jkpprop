# 08 Design Tokens Normalized — Green Revision Full

เอกสารนี้เป็น `08_design_tokens_normalized.md` ฉบับปรับปรุงใหม่แบบ **green revision full** โดยคงโครง design token system ให้ครบทั้งสี, semantic status, typography scale, spacing scale, radius, shadow, layout tokens, elevation, iconography, motion และ component foundations แต่เปลี่ยน brand/action direction จาก `gold + neutral` ไปเป็น `green + neutral` ตาม palette ในไฟล์ `Fun-Green-11-kigen-design.svg` [file:584][file:485][file:486][code_file:585].

เป้าหมายของไฟล์นี้คือให้เป็น **canonical token reference** สำหรับงานออกแบบและ implementation ใหม่ โดยไม่แยกสีออกจากระบบ token อื่น ๆ เหมือนในเวอร์ชัน `08_design_tokens_normalized_green_revision.md` เดิม [code_file:585].

> **สถานะความครบ (v1.1 · 2026-07-14):** ปิด gap เดิมครบ — เพิ่ม semantic status colors (success/warning/error/info), กฎการใช้ vivid/neon, contrast pairing matrix, z-index/elevation scale, iconography, dark-mode mapping และแก้ focus ring ให้ไม่นีออน ทุกคู่สีหลัก + status ผ่าน WCAG AA (ตรวจด้วยการคำนวณจริง).

## 1. Design token philosophy

ระบบ token ใหม่นี้ต้องทำ 3 อย่างพร้อมกัน [file:480][file:481][page:FUNCTIONAL_SPEC.html]:

- รักษา practical, trustworthy และ readable character ของแพลตฟอร์ม [file:480][file:481][file:485]
- เปลี่ยน brand/action language จาก gold-first เป็น green-first [file:584][code_file:585]
- ทำให้ public surfaces และ admin/product surfaces ใช้ฐานเดียวกันได้ [page:FUNCTIONAL_SPEC.html][code_file:585]

## 2. Color system

ชุดสีใหม่อ้างอิงจาก `Fun-Green-11-kigen-design.svg` และ map เข้ากับ semantic color system ของแพลตฟอร์ม [file:584][code_file:585].

### 2.1 Brand green scale

| Token | HEX | Purpose |
|---|---|---|
| `color.brand.50` | `#C3FED5` | Soft highlight / tint background |
| `color.brand.100` | `#2DFB91` | High-visibility emphasis (จำกัดการใช้ — ดู §2.6) |
| `color.brand.200` | `#25D87C` | Bright accent / success-supportive (bg เท่านั้น) |
| `color.brand.300` | `#1EBA6A` | Light action / hover-lite (bg เท่านั้น) |
| `color.brand.400` | `#189E59` | Medium green |
| `color.brand.500` | `#128449` | Secondary filled action |
| `color.brand.600` | `#0D6C3B` | Primary brand / default CTA |
| `color.brand.700` | `#09582F` | Hover / pressed / selected / brand text |
| `color.brand.800` | `#043F20` | Deep emphasis / strong container |
| `color.brand.900` | `#022310` | Deep dark surface |
| `color.brand.950` | `#011507` | Darkest immersion layer |

### 2.2 Semantic mapping

```text
color.brand.primary       = #0D6C3B
color.brand.primaryHover  = #09582F
color.brand.primaryActive = #043F20
color.brand.primarySoft   = #C3FED5
color.brand.secondary     = #128449
color.brand.emphasis      = #2DFB91
```

### 2.3 Neutral base

```text
color.surface.base        = #F9F8F5
color.surface.alt         = #F3F0EC
color.surface.card        = #FFFFFF
color.surface.muted       = #ECE8E1
color.surface.brandSubtle = #C3FED5
color.surface.brandSoft   = #E8FFF0
color.surface.brandStrong = #043F20
color.surface.brandDeep   = #022310
color.surface.brandDeepest= #011507

color.text.primary        = #28251D
color.text.secondary      = #5F5A52
color.text.muted          = #7A7974
color.text.inverse        = #FFFFFF
color.text.brand          = #0D6C3B

color.border.subtle       = #D4D1CA
color.border.default      = #C9C5BD
color.border.brand        = #0D6C3B
```

> **หมายเหตุ accessibility:** `color.text.muted` (#7A7974) บน `surface.base` ได้ contrast ~4.1:1 — ผ่านเฉพาะ **large text (≥18px/14px bold)** ห้ามใช้กับ body/label ขนาดเล็ก ให้ใช้ `color.text.secondary` แทนเมื่อเป็นข้อความสำคัญ.

### 2.4 Action tokens

```text
color.action.primary.bg        = #0D6C3B
color.action.primary.bgHover   = #09582F
color.action.primary.bgActive  = #043F20
color.action.primary.text      = #FFFFFF
color.action.primary.border    = #0D6C3B

color.action.secondary.bg      = #128449
color.action.secondary.bgHover = #0D6C3B
color.action.secondary.text    = #FFFFFF
color.action.secondary.border  = #128449

color.action.tertiary.bg       = transparent
color.action.tertiary.text     = #0D6C3B
color.action.tertiary.border   = #0D6C3B

color.action.disabled.bg       = #ECE8E1
color.action.disabled.text     = #A6A29A
```

### 2.5 Semantic status colors

status colors แยกออกจาก brand accent อย่างชัดเจน เพื่อรองรับ form validation (`FR-INQ-04`), `InlineError`, `AlertBanner`, `Toast`, `StatusChip` และ workflow states ใน admin — **`error` ต้องเป็นสีแดงจริง จะ derive จากเขียวไม่ได้** [page:FUNCTIONAL_SPEC.html][code_file:585]. ทุกคู่ solid+text และ subtle+text ผ่าน WCAG AA (ตรวจแล้ว).

| Role | `.solid` (bg) | `.textOn` (บน solid) | `.subtle` (bg อ่อน) | `.text` (บน subtle / เป็น text) | `.border` |
|---|---|---|---|---|---|
| success | `#0D6C3B` | `#FFFFFF` | `#DCFAE6` | `#09582F` | `#0D6C3B` |
| warning | `#B45309` | `#FFFFFF` | `#FDF0D5` | `#7C4210` | `#B45309` |
| error | `#C02626` | `#FFFFFF` | `#FCE4E4` | `#8F1D1D` | `#C02626` |
| info | `#1C5FB8` | `#FFFFFF` | `#DCEAFB` | `#17457F` | `#1C5FB8` |

```text
color.status.success.solid  = #0D6C3B   color.status.success.subtle = #DCFAE6   color.status.success.text = #09582F
color.status.warning.solid  = #B45309   color.status.warning.subtle = #FDF0D5   color.status.warning.text = #7C4210
color.status.error.solid    = #C02626   color.status.error.subtle   = #FCE4E4   color.status.error.text   = #8F1D1D
color.status.info.solid     = #1C5FB8   color.status.info.subtle    = #DCEAFB   color.status.info.text    = #17457F
```

- **success** จงใจอยู่ในตระกูล brand green (ให้ "สำเร็จ" กลมกลืนกับแบรนด์) แต่ยัง map เป็น semantic role แยก เพื่อไม่ผูกกับปุ่ม CTA โดยตรง [code_file:585]
- **warning** ใช้ amber `#B45309` — สืบทอดความอบอุ่นจาก brand-support เดิม (`#92400E`)
- **error** ใช้แดง `#C02626` แยกขาดจากเขียว เพื่อความชัดเจนเชิง semantic
- **info** ใช้ฟ้า `#1C5FB8` เป็นกลาง ไม่แข่งกับ brand green

### 2.6 Vivid / neon usage rules (สำคัญ)

`brand.100` (#2DFB91), `brand.200` (#25D87C), `brand.300` (#1EBA6A) เป็นเขียว **สด/นีออน** ซึ่งขัดกับ brand posture แบบ trustworthy-industrial ถ้าใช้ผิด [file:480][file:481][code_file:585]. กฎบังคับ:

- ✅ ใช้เป็น **background fill เท่านั้น** โดยจับคู่กับ text เข้ม (`brand.800`/`brand.900`) — เช่น emphasis badge, highlight pill
- ❌ **ห้าม**ใช้เป็นสี text
- ❌ **ห้าม**ใช้เป็นพื้นปุ่มที่มี text สีขาว (white บน `#2DFB91` = contrast 1.37 → FAIL)
- ❌ **ห้าม**ใช้กับ body/long-form text หรือ icon เส้นบางบนพื้นขาว
- `brand.100` (emphasis) ใช้เป็น "จุดเน้นเล็ก ๆ" เท่านั้น ห้ามทาเป็นพื้นที่กว้างหรือทั้ง section
- primary/secondary actions ให้ยึด `brand.600`/`brand.500`/`brand.700` เสมอ

### 2.7 Contrast pairing matrix

คู่สีที่ **อนุมัติ** (ผ่าน WCAG AA ≥ 4.5:1 สำหรับ normal text — คำนวณจริง):

| Foreground | Background | Ratio | ใช้กับ |
|---|---|---|---|
| `#FFFFFF` | `brand.600 #0D6C3B` | 6.51 | primary button |
| `#FFFFFF` | `brand.500 #128449` | 4.75 | secondary button |
| `brand.600 #0D6C3B` | `surface.card #FFFFFF` | 6.51 | brand text / link |
| `brand.700 #09582F` | `brandSubtle #C3FED5` | 7.54 | chip / selected filter |
| `text.primary #28251D` | `surface.base #F9F8F5` | ~13 | body |
| `text.secondary #5F5A52` | `surface.base #F9F8F5` | 6.44 | metadata |
| status `.textOn #FFFFFF` | status `.solid` | 5.0–6.5 | alert solid / badge |
| status `.text` | status `.subtle` | 7.0–7.8 | inline message |

คู่สีที่ **ห้ามใช้** (contrast ต่ำกว่าเกณฑ์):

| Foreground | Background | Ratio | ทำไม |
|---|---|---|---|
| `#FFFFFF` | `brand.100 #2DFB91` | 1.37 ❌ | นีออนสว่างเกิน — ใช้ text เข้มแทน |
| `text.muted #7A7974` | `surface.base` | 4.11 ⚠️ | large text เท่านั้น |
| `brand.100/200/300` เป็น text | พื้นขาว | < 3 ❌ | ใช้เป็น bg เท่านั้น |

## 3. Typography scale

typography system ต้องยังรองรับภาษาไทยและอังกฤษได้ดี พร้อมแยกระดับชั้นระหว่าง public marketing, discovery pages และ admin/product UI [file:485][page:FUNCTIONAL_SPEC.html].

### 3.1 Font families

```text
font.family.primary   = 'Noto Sans Thai', 'Inter', 'Segoe UI', sans-serif
font.family.secondary = 'Noto Sans Thai', 'Inter', 'Segoe UI', sans-serif
font.family.mono      = 'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace
```

### 3.2 Font weights

```text
font.weight.regular   = 400
font.weight.medium    = 500
font.weight.semibold  = 600
font.weight.bold      = 700
```

### 3.3 Type scale

```text
font.size.xs   = 12px
font.size.sm   = 14px
font.size.md   = 16px
font.size.lg   = 18px
font.size.xl   = 20px
font.size.2xl  = 24px
font.size.3xl  = 30px
font.size.4xl  = 36px
font.size.5xl  = 48px
```

### 3.4 Line heights

```text
lineHeight.tight   = 1.2
lineHeight.snug    = 1.35
lineHeight.normal  = 1.5
lineHeight.relaxed = 1.65
```

### 3.5 Typography usage

- `xs` ใช้กับ metadata, helper text, property IDs, badge labels [file:457][file:459]
- `sm` ใช้กับ small controls, table/meta rows, compact admin UI [page:FUNCTIONAL_SPEC.html]
- `md` เป็น body default ของระบบ [file:485]
- `lg` และ `xl` ใช้กับ section headers / key stats
- `2xl–5xl` ใช้เฉพาะ hero, headline, page-title layers ของ public pages [file:480][file:481]

## 4. Spacing scale

spacing system ใช้ฐานแบบ compact-professional ที่รองรับทั้ง listing density และ long-form landing layout [file:480][file:495][page:FUNCTIONAL_SPEC.html].

```text
space.0   = 0px
space.1   = 4px
space.2   = 8px
space.3   = 12px
space.4   = 16px
space.5   = 20px
space.6   = 24px
space.8   = 32px
space.10  = 40px
space.12  = 48px
space.16  = 64px
space.20  = 80px
space.24  = 96px
space.32  = 128px
```

### Usage guidance

- `space.1–3` สำหรับ chip padding, icon gaps, micro spacing
- `space.4–6` สำหรับ field spacing, card padding, row spacing
- `space.8–12` สำหรับ section internals
- `space.16–32` สำหรับ page sections, hero breathing room และ layout separation [file:480][file:481]

## 5. Radius scale

radius ต้องยังคงความเรียบร้อยและ modern แต่ไม่ over-rounded แบบ consumer app [file:483][file:484].

```text
radius.none = 0px
radius.xs   = 4px
radius.sm   = 6px
radius.md   = 8px
radius.lg   = 12px
radius.xl   = 16px
radius.2xl  = 20px
radius.full = 9999px
```

### Usage guidance

- inputs, small chips, badges ใช้ `sm` หรือ `md`
- cards, filters, panels ใช้ `md` หรือ `lg`
- hero containers / modal shells / larger grouped surfaces ใช้ `xl`
- full pills ใช้ `full` สำหรับ tag-like actions เท่านั้น [file:483][file:484]

## 6. Shadow scale

shadow system ต้อง subtle, trustworthy และไม่ลอยเวอร์เกินความเป็น industrial platform [file:480][file:481].

```text
shadow.xs = 0 1px 2px rgba(0, 0, 0, 0.04)
shadow.sm = 0 2px 6px rgba(0, 0, 0, 0.06)
shadow.md = 0 6px 16px rgba(0, 0, 0, 0.08)
shadow.lg = 0 12px 28px rgba(0, 0, 0, 0.10)
shadow.xl = 0 20px 44px rgba(0, 0, 0, 0.14)
```

### Usage guidance

- cards ทั่วไปใช้ `shadow.sm`
- sticky bars, dropdowns, floating filters ใช้ `shadow.md`
- modal / overlay surfaces ใช้ `shadow.lg` หรือ `xl`
- ไม่ควรใช้ shadow หนักพร้อมสีเขียวสดใน element เดียว เพราะจะทำให้ดู aggressive เกินไป [code_file:585]

## 7. Border and divider rules

```text
border.width.hairline = 1px
border.width.strong   = 2px
border.color.subtle   = #D4D1CA
border.color.default  = #C9C5BD
border.color.brand    = #0D6C3B
border.color.inverse  = rgba(255,255,255,0.18)
```

### Rules

- ใช้ `subtle` กับ card separators, table dividers, field outlines
- ใช้ `brand` กับ selected states, focused tags, outlined actions
- อย่าใช้ border สีเขียวกับทุก element พร้อมกัน เพราะจะทำให้ทั้งหน้าแน่นเกินไป [code_file:585]

## 8. Layout tokens

layout tokens ช่วยให้ page families ต่าง ๆ ใช้ container logic เดียวกันได้ [file:480][file:481][file:495][page:FUNCTIONAL_SPEC.html].

### 8.1 Breakpoints

```text
breakpoint.xs = 360px
breakpoint.sm = 640px
breakpoint.md = 768px
breakpoint.lg = 1024px
breakpoint.xl = 1280px
breakpoint.2xl = 1440px
```

### 8.2 Containers

```text
layout.container.narrow  = 640px
layout.container.content = 960px
layout.container.wide    = 1200px
layout.container.full    = 1440px
```

### 8.3 Grid / gutters

```text
layout.gutter.mobile  = 16px
layout.gutter.tablet  = 24px
layout.gutter.desktop = 32px
layout.grid.gap.sm    = 12px
layout.grid.gap.md    = 16px
layout.grid.gap.lg    = 24px
layout.grid.gap.xl    = 32px
```

### 8.4 Section rhythm

```text
layout.section.compact = 48px 0
layout.section.default = 64px 0
layout.section.relaxed = 80px 0
layout.section.hero    = 96px 0
```

## 9. Motion and state tokens

```text
motion.duration.fast   = 120ms
motion.duration.base   = 180ms
motion.duration.slow   = 260ms
motion.easing.standard = ease
motion.easing.emphasis = cubic-bezier(0.2, 0, 0, 1)
```

### State overlays

```text
state.hover.overlay      = rgba(13, 108, 59, 0.06)
state.selected.overlay   = rgba(13, 108, 59, 0.12)
state.disabled.opacity   = 0.48
```

### Focus ring (แก้จากเวอร์ชันนีออนเดิม)

โฟกัสต้อง **มองเห็นชัดบนทุกพื้น** และไม่ใช้เขียวนีออน (`#2DFB91` opacity ต่ำเดิมมองไม่เห็น) — ใช้เขียวเข้ม `brand.700` เป็นวงแหวน พร้อม white offset สำหรับ element ที่มีพื้นเป็น brand color:

```text
state.focus.ringColor    = #09582F                       /* brand.700 */
state.focus.ring         = 0 0 0 3px rgba(9, 88, 47, 0.45)
state.focus.ringContrast = 0 0 0 2px #FFFFFF, 0 0 0 4px #09582F   /* บนปุ่ม/พื้นเข้ม */
```

- ใช้ `state.focus.ring` กับ input/link/control บนพื้นอ่อน
- ใช้ `state.focus.ringContrast` กับปุ่ม primary/secondary หรือ element บนพื้นเข้ม (white offset ทำให้วงแหวนไม่จมกับพื้นเขียว)

## 10. Elevation / z-index scale

layering ต้องคุมด้วย scale เดียว ไม่ใส่ค่า z-index มั่ว — รองรับ `ModalDialog`, `DrawerSheet`, `Toast`, sticky bars, dropdowns [page:FUNCTIONAL_SPEC.html].

```text
z.base     = 0     /* เนื้อหาปกติ */
z.raised   = 10    /* card hover, raised surfaces */
z.sticky   = 100   /* sticky filter bar, sticky inquiry CTA */
z.header   = 200   /* app/site header */
z.dropdown = 300   /* select, combobox, menu */
z.drawer   = 400   /* mobile filter drawer, slide-over */
z.modal    = 500   /* modal dialog + scrim */
z.popover  = 600   /* popover, date picker เหนือ modal */
z.toast    = 700   /* toast notifications */
z.tooltip  = 800   /* tooltip อยู่บนสุดเสมอ */
```

```text
scrim.overlay = rgba(2, 35, 16, 0.48)   /* modal/gallery backdrop — อิง brand.900 */
```

## 11. Iconography

จาก source เดิมใช้ Font Awesome [file:485] แต่ระบบใหม่เลือก **Lucide** เป็น icon library มาตรฐาน — เส้น outline สม่ำเสมอ, MIT, tree-shakeable, เข้ากับ Next.js/React และให้ tone แบบ clean-professional ตรงกับแบรนด์ (ไม่ decorative เกิน) [code_file:585].

```text
icon.library         = lucide-react
icon.size.xs         = 14px
icon.size.sm         = 16px
icon.size.md         = 20px   /* default */
icon.size.lg         = 24px
icon.size.xl         = 32px
icon.stroke.default  = 1.5
icon.stroke.bold     = 2
icon.color.default   = currentColor
icon.color.muted     = #7A7974   /* text.muted */
icon.color.brand     = #0D6C3B   /* brand.600 */
icon.color.inverse   = #FFFFFF
```

### Rules

- icon สืบ `currentColor` เป็น default เพื่อกลืนกับ text
- ห้ามผสม icon หลาย library — Lucide เท่านั้น
- icon เชิง action ควรมี accessible label (`aria-label`) ตาม `IconButton` ใน [11_component_inventory.md]

## 12. Component foundation tokens

หลัง primitives แล้ว กำหนด foundation tokens สำหรับ pattern ที่ใช้ซ้ำบ่อย เพื่อให้ design library และ code implementation ตรงกัน [file:480][file:483][file:484][code_file:585].

### 12.1 Buttons

```text
button.height.sm = 32px       button.height.md = 40px       button.height.lg = 48px
button.radius    = radius.md
button.padding.x = 16px / 20px / 24px   (sm / md / lg)
button.font      = font.size.sm หรือ md, weight.semibold
button.focus     = state.focus.ringContrast
```

### 12.2 Inputs

```text
input.height.md      = 40px       input.height.lg = 48px
input.padding.x      = 16px
input.radius         = radius.md
input.bg             = #FFFFFF
input.border         = border.color.default
input.focusBorder    = color.brand.primary
input.focusRing      = state.focus.ring
input.error.border   = color.status.error.solid
input.error.ring     = 0 0 0 3px rgba(192, 38, 38, 0.28)
input.disabled.bg    = #F3F0EC
```

### 12.3 Cards

```text
card.radius.default  = radius.lg
card.padding.default = space.6
card.bg              = color.surface.card
card.border          = border.color.subtle
card.shadow          = shadow.sm
card.hover.shadow    = shadow.md
```

### 12.4 Chips / tags

```text
chip.height      = 28px
chip.padding.x   = 12px
chip.radius      = radius.full
chip.bg.subtle   = color.surface.brandSubtle
chip.text.brand  = color.brand.primaryHover      /* #09582F */
chip.border      = color.brand.primary
chip.selected.bg = color.brand.primary
chip.selected.text = #FFFFFF
```

### 12.5 Badge / status chip

```text
badge.height        = 22px
badge.padding.x     = 8px
badge.radius        = radius.sm
badge.font          = font.size.xs, weight.medium
/* ใช้ status subtle+text ตาม §2.5 เช่น */
badge.success.bg = color.status.success.subtle   badge.success.text = color.status.success.text
badge.error.bg   = color.status.error.subtle     badge.error.text   = color.status.error.text
```

### 12.6 Table (admin dense)

```text
table.row.height       = 48px
table.cell.padding.x   = 16px
table.header.bg        = color.surface.alt
table.header.text      = color.text.secondary
table.header.font      = font.size.sm, weight.semibold
table.divider          = border.color.subtle
table.row.hover.bg     = state.hover.overlay
```

### 12.7 Tabs

```text
tab.height          = 40px
tab.padding.x       = 16px
tab.text            = color.text.secondary
tab.active.text     = color.brand.primary
tab.active.indicator= 2px solid color.brand.primary
tab.font            = font.size.sm, weight.medium
```

### 12.8 Overlays: modal / drawer / toast / tooltip

```text
modal.radius     = radius.xl      modal.padding = space.6      modal.shadow = shadow.lg    modal.z = z.modal
modal.scrim      = scrim.overlay
drawer.width.sm  = 320px          drawer.width.md = 400px      drawer.shadow = shadow.lg   drawer.z = z.drawer
toast.radius     = radius.md      toast.padding = space.4      toast.shadow = shadow.lg    toast.z = z.toast
toast.maxWidth   = 380px
tooltip.bg       = #28251D        tooltip.text = #FFFFFF       tooltip.radius = radius.sm  tooltip.z = z.tooltip
tooltip.font     = font.size.xs
```

### 12.9 Alert / inline message

```text
alert.radius     = radius.md      alert.padding = space.4      alert.border.width = 1px
/* ใช้ status tokens ตาม §2.5: .subtle bg + .text + .border */
inlineError.text = color.status.error.text        inlineError.font = font.size.sm
```

## 13. Dark mode mapping

dark theme ใช้ green scale ฝั่งเข้ม + neutral กลับด้าน — ใช้กับ admin immersive panels, footer bands และ (อนาคต) toggle ทั้งเว็บ [file:584][code_file:585]. brand action ยังยึด green แต่เลื่อนขึ้นให้สว่างพอบนพื้นเข้ม.

```text
dark.surface.base     = #011507   /* brand.950 */
dark.surface.card     = #022310   /* brand.900 */
dark.surface.alt      = #043F20   /* brand.800 */
dark.surface.muted    = #09582F   /* brand.700 */
dark.text.primary     = #F9F8F5
dark.text.secondary   = #C9C5BD
dark.text.muted       = #8E8B84
dark.border.subtle    = rgba(255,255,255,0.12)
dark.border.default   = rgba(255,255,255,0.20)

/* action บนพื้นเข้ม: ยกความสว่างขึ้น 1–2 step เพื่อ contrast */
dark.action.primary.bg   = #189E59   /* brand.400 */
dark.action.primary.text = #011507
dark.action.primary.hover= #1EBA6A
dark.text.brand          = #25D87C   /* brand.200 — บนพื้นเข้มเท่านั้น */
```

> **หมายเหตุ:** dark mode เป็น optional สำหรับ v1 (public เริ่มด้วย light เป็นหลัก) แต่ token ถูกเตรียมไว้ให้ admin ใช้ก่อนได้ และกัน rework ภายหลัง.

## 14. Public vs admin token behavior

แม้ใช้ token ชุดเดียวกัน แต่ public กับ admin ควรใช้ต่างจังหวะกัน [page:FUNCTIONAL_SPEC.html][code_file:585].

### Public

- ใช้ `brand.600` เป็น CTA เด่น
- ใช้ `brandSubtle` ใน selected states, callouts, trust highlights
- ใช้ section spacing กว้างกว่า admin [file:480][file:481]

### Admin

- ใช้ green แบบ restrained กว่า
- ใช้ typography scale ในช่วง `sm–xl` เป็นหลัก
- ใช้ spacing compact และ shadow ต่ำกว่า public hero surfaces [page:FUNCTIONAL_SPEC.html]

## 15. Deprecated tokens from previous gold-first system

ตั้งแต่ revision นี้เป็นต้นไป ให้ถือว่า token กลุ่มต่อไปนี้ถูก **deprecated** สำหรับงานใหม่ [code_file:585]:

- `color.brand.tipGold`
- `color.action.primary` ที่อิง gold
- `gold highlight / gold chip / gold CTA` examples ทั้งหมด
- language ที่อธิบายระบบว่าเป็น `gold + neutral`

หากมีไฟล์เก่าที่ยังใช้ gold family ให้ map เข้ากับ green family ใหม่ตามลำดับนี้ [file:584][code_file:585]:

```text
gold primary CTA     -> green 600
gold hover           -> green 700
gold pressed/deeper  -> green 800
gold soft tint       -> green 50
gold emphasis        -> green 100 or 200 (ใช้เท่าที่จำเป็น — ดู §2.6)
```

## 16. Implementation references

สำหรับ implementation layer ให้ใช้ไฟล์ต่อไปนี้เป็นคู่กับเอกสารนี้ (generate จาก token ในไฟล์นี้ 1:1) [code_file:586][code_file:587][code_file:588][code_file:589]:

- `green-brand-tokens.json` — design tokens แบบ platform-agnostic (source ของ pipeline)
- `green-brand-tailwind.config.js` — Tailwind theme extension (map token → utility)
- `green-brand.css` — CSS custom properties (`:root` light + `[data-theme="dark"]`)
- `green-brand-theme.tsx` — TypeScript theme object + typed tokens สำหรับ React/Next

เอกสารนี้เป็น source of truth เชิง reasoning และ scale system ส่วนไฟล์ implementation เป็น source of truth เชิง code mapping — ทั้งสองต้องตรงกันเสมอ ถ้าแก้ token ในไฟล์นี้ต้อง regenerate/sync ทั้ง 4 ไฟล์ [code_file:586][code_file:587][code_file:588][code_file:589].

## 17. Chart / data-visualization palette

palette สำหรับ admin dashboard, KPI, report และ analytics surfaces — แยกจาก brand/status colors ตามหลัก data-viz (color ทำงานตาม "job": identity / magnitude / polarity / state) ทุกชุดถูก **validate ด้วยเครื่องมือจริง** (Machado-2009 CVD ΔE + OKLCH lightness band + contrast) ทั้ง light และ dark ไม่ใช่เลือกด้วยสายตา.

### 17.1 หลักการ (บังคับ)

- **categorical hue เรียงลำดับตายตัว ห้าม cycle** — series ที่ 9 ไม่สร้างสีใหม่ ให้ยุบเป็น "Other" หรือใช้ small multiples
- **หนึ่งแกน** — ห้าม dual-axis (สอง y-scale) ต่างหน่วย → แยกกราฟ
- **สีผูกกับ entity ไม่ผูกกับ rank** — filter ที่เปลี่ยนจำนวน series ต้องไม่ทาสีใหม่ให้ตัวที่เหลือ
- **text ใช้ text token เสมอ ไม่ใช้สี series** — ค่า/label/legend อยู่ในหมึก primary/secondary/muted
- **status color สงวนไว้** (§17.5) ห้ามเอาไปเป็น "series ที่ 4" และต้องมาคู่ icon+label เสมอ
- CVD ΔE เป้าหมาย ≥ 12 (ปัจจุบัน adjacent 22.4 light / 20.1 dark) — สำหรับ scatter/bubble/map ที่ทุกคู่ประชิดกันได้ ต้องเสริม secondary encoding (shape/label/texture) หรือจำกัด ≤ 5 series

### 17.2 Categorical (identity — เรียงลำดับตายตัว)

| Slot | Hue | Light | Dark |
|---|---|---|---|
| 1 | green (brand) | `#157F43` | `#22A45C` |
| 2 | blue | `#2A6FB8` | `#4E8FD8` |
| 3 | amber | `#C68400` | `#BC8810` |
| 4 | red | `#C8433B` | `#E26B62` |
| 5 | violet | `#8A3DA0` | `#B072D6` |
| 6 | cyan | `#0E9AA8` | `#159FAD` |
| 7 | orange | `#E0692A` | `#D26C34` |
| 8 | magenta | `#D14FA0` | `#D663A6` |

Light: adjacent CVD ΔE ต่ำสุด 22.4, contrast ≥3:1 ทุก slot ✅ · Dark (surface `#022310`): adjacent ΔE 20.1, band/contrast ผ่านทั้งชุด ✅. Slot 1 = brand green ให้ series หลักกลืนกับแบรนด์.

### 17.3 Sequential (magnitude — one hue, light→dark)

ใช้เขียว hue เดียว สำหรับ heatmap/choropleth/intensity — dark mode สลับ anchor (เข้ม = มาก):

```text
chart.seq.100 = #E6F6EC   chart.seq.200 = #C4E9D0   chart.seq.300 = #97D6AE
chart.seq.400 = #5FBB84   chart.seq.500 = #2E9C61   chart.seq.600 = #157F43
chart.seq.700 = #0D6C3B   chart.seq.800 = #09582F
```
- **ordinal** (ขั้นมีลำดับ เช่น funnel/tier): เริ่มไม่อ่อนกว่า `seq.300` บน light (คุม contrast ≥ 2:1)

### 17.4 Diverging (polarity — สองขั้ว + gray กลาง)

ขั้ว **red ↔ green** (ลบ/บวก) มี neutral gray ตรงกลาง จำนวน step เท่ากันสองข้าง:

```text
chart.div.neg3 = #A32C28   chart.div.neg2 = #C8433B   chart.div.neg1 = #E39A93
chart.div.mid  = #ECEBE7  (light) / #333F37 (dark)
chart.div.pos1 = #93CFAB   chart.div.pos2 = #45A56E   chart.div.pos3 = #0D6C3B
```
- ห้ามใส่ hue ที่จุดกลาง (ต้องเป็นเทา) และห้าม rainbow

### 17.5 Status (state — สงวน, ไม่ตามธีม, มาคู่ icon+label)

ขั้นเหล่านี้จงใจต่างจาก categorical เพื่อไม่ให้ status สวมรอยเป็น series [อ้างอิง §2.5]:

```text
chart.status.good     = #0D6C3B   (success)
chart.status.warning  = #B45309
chart.status.serious  = #C2410C
chart.status.critical = #C02626   (error)
```

### 17.6 Chart chrome & ink

| Role | Light | Dark |
|---|---|---|
| Chart surface | `#FFFFFF` | `#022310` |
| Gridline (hairline) | `#E7E4DD` | `rgba(255,255,255,0.10)` |
| Axis / baseline | `#C9C5BD` | `rgba(255,255,255,0.20)` |
| Primary ink | `#28251D` | `#F9F8F5` |
| Secondary ink | `#5F5A52` | `#C9C5BD` |
| Muted (ticks/labels) | `#7A7974` | `#8E8B84` |

### 17.7 กฎการใช้ marks

- legend แสดงเสมอเมื่อ ≥ 2 series (1 series ไม่ต้องมี — ให้ title บอกชื่อ), ≤ 4 series ทำ direct label ด้วย
- bar: มุม data-end โค้ง ~4px, เว้น surface gap 2px ระหว่าง fill ที่ประชิด · line: เส้น 2px · marker ≥ 8px
- grid/axis ให้ recessive (บาง จาง) — ข้อมูลต้องเด่นกว่าเส้นตาราง
- มี table view สำรองเสมอ (accessibility) และ texture fill เป็นช่องทางสำรองสำหรับ CVD/print/forced-colors
