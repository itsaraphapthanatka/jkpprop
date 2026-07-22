# DESIGN_SYSTEM_PROMPT — paste-ready handoff

> **วิธีใช้:** ก๊อปทั้งไฟล์นี้วางเข้า Claude (claude.ai / Artifacts / Claude Code) แล้วสั่งงาน เช่น
> *"ออกแบบหน้า listing detail โดยใช้ design system นี้"* — Claude จะออกแบบให้สอดคล้องทันทีโดยไม่ต้องแนบไฟล์อื่น
> Source of truth ฉบับเต็ม: `08_design_tokens_normalized_green_revision_full.md`, `16_component_specs.md`, ไฟล์ `green-brand-*`

---

## 0. บริบท 1 บรรทัด

Design system ของ **Thai Industrial Property Platform** — แพลตฟอร์มนายหน้าเช่า/ขายโรงงาน-โกดัง (th/en/zh) แนวทาง **green-first, neutral-first, practical, trustworthy, industrial** — *ไม่ใช่* luxury real-estate, *ไม่ใช่* startup SaaS gradient, *ไม่ใช่* consumer app

## 1. กฎห้ามหลุด (non-negotiable)

1. **ยึด token เท่านั้น** — ห้าม hardcode hex ที่ไม่มีใน token; ทุกสี/ระยะ/มุม/เงา อ้างจากตารางด้านล่าง
2. **Green-first** — primary action = `#0D6C3B` (green-600); ห้ามใช้ gold เป็น accent (เลิกใช้แล้ว)
3. **Neutral เป็นฐาน** — พื้นขาว/warm-neutral, hierarchy ขับด้วยหมึก neutral ไม่ใช่หลายสี; green เป็น accent ไม่ใช่ทาทั้งหน้า
4. **ห้าม neon เป็น text/ปุ่ม** — green-100/200/300 (`#2DFB91` ฯลฯ) ใช้เป็น **พื้น badge เท่านั้น** คู่ text เข้ม; ห้ามเป็นสี text หรือพื้นปุ่ม white
5. **Contrast ≥ 4.5:1** สำหรับ text ปกติ (คู่สีที่อนุมัติอยู่ §5)
6. **Focus ring มองเห็นชัด** — control ใช้ `--focus-ring`; ปุ่ม/พื้นเขียวใช้ `--focus-ring-contrast` (มี white offset)
7. **ห้าม** gradient หนัก, glassmorphism, glow, oversized radius, visual gimmick — trust > novelty
8. **ภาพจริง** ของโกดัง/โรงงาน/ทีม มากกว่า stock abstract
9. **สถานะไม่พึ่งสีอย่างเดียว** — มี icon + ข้อความเสมอ
10. **ออกแบบทั้ง light + dark** ผ่าน token (ดู CSS §3)

## 2. ตัวตน & anti-pattern

- ✅ clean, structured, readable, business-first, conversion-aware
- ❌ card หลายกระบวน, pill ทั้ง block, Home ที่ไม่มี search, listing = card wall ไม่มี guided evaluation, detail = data dump, admin = generic CRUD

## 3. CSS variables (paste-ready — light + dark)

วางบล็อกนี้ใน `<style>` แล้ว style ทุก component ผ่าน `var(--...)`:

```css
:root{
  /* brand green scale */
  --brand-50:#C3FED5; --brand-100:#2DFB91; --brand-200:#25D87C; --brand-300:#1EBA6A;
  --brand-400:#189E59; --brand-500:#128449; --brand-600:#0D6C3B; --brand-700:#09582F;
  --brand-800:#043F20; --brand-900:#022310; --brand-950:#011507;
  /* semantic surfaces / text / border (LIGHT) */
  --surface-base:#F9F8F5; --surface-alt:#F3F0EC; --surface-card:#FFFFFF; --surface-muted:#ECE8E1;
  --surface-brand-subtle:#C3FED5; --surface-brand-soft:#E8FFF0;
  --text-primary:#28251D; --text-secondary:#5F5A52; --text-muted:#7A7974; --text-inverse:#FFFFFF; --text-brand:#0D6C3B;
  --border-subtle:#D4D1CA; --border-default:#C9C5BD; --border-brand:#0D6C3B;
  /* actions */
  --action-primary:#0D6C3B; --action-primary-hover:#09582F; --action-primary-active:#043F20;
  --action-secondary:#128449; --action-disabled-bg:#ECE8E1; --action-disabled-text:#A6A29A;
  /* status */
  --success:#0D6C3B; --success-subtle:#DCFAE6; --success-text:#09582F;
  --warning:#B45309; --warning-subtle:#FDF0D5; --warning-text:#7C4210;
  --error:#C02626;   --error-subtle:#FCE4E4;   --error-text:#8F1D1D;
  --info:#1C5FB8;    --info-subtle:#DCEAFB;    --info-text:#17457F;
  /* type / space / radius / shadow */
  --font:'Noto Sans Thai','Inter','Segoe UI',system-ui,sans-serif;
  --mono:'JetBrains Mono','SFMono-Regular',Menlo,monospace;
  --radius-sm:6px; --radius-md:8px; --radius-lg:12px; --radius-xl:16px; --radius-full:9999px;
  --shadow-sm:0 2px 6px rgba(0,0,0,.06); --shadow-md:0 6px 16px rgba(0,0,0,.08); --shadow-lg:0 12px 28px rgba(0,0,0,.10);
  --focus-ring:0 0 0 3px rgba(9,88,47,.45);
  --focus-ring-contrast:0 0 0 2px #fff,0 0 0 4px #09582F;
  /* chart categorical (light) */
  --chart-1:#157F43; --chart-2:#2A6FB8; --chart-3:#C68400; --chart-4:#C8433B;
  --chart-5:#8A3DA0; --chart-6:#0E9AA8; --chart-7:#E0692A; --chart-8:#D14FA0;
}
:root[data-theme="dark"], .dark{
  --surface-base:#011507; --surface-alt:#043F20; --surface-card:#022310; --surface-muted:#09582F;
  --surface-brand-soft:#043F20;
  --text-primary:#F9F8F5; --text-secondary:#C9C5BD; --text-muted:#8E8B84; --text-brand:#25D87C;
  --border-subtle:rgba(255,255,255,.12); --border-default:rgba(255,255,255,.20); --border-brand:#25D87C;
  --action-primary:#189E59; --action-primary-hover:#1EBA6A; --action-primary-active:#22A45C;
  --chart-1:#22A45C; --chart-2:#4E8FD8; --chart-3:#BC8810; --chart-4:#E26B62;
  --chart-5:#B072D6; --chart-6:#159FAD; --chart-7:#D26C34; --chart-8:#D663A6;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){ /* ทำซ้ำค่าชุด dark ด้านบน */ }
}
```
> spacing = 4px base: `4 8 12 16 20 24 32 40 48 64 80 96 128` px

## 4. Type scale

| token | px | ใช้ |
|---|---|---|
| 5xl / 4xl | 48 / 36 | hero, page title (public) |
| 3xl / 2xl | 30 / 24 | section heading |
| xl / lg | 20 / 18 | subhead / key stats |
| **md** | **16** | body default |
| sm | 14 | metadata, labels, admin dense |
| xs | 12 | caption, IDs, badge |

weights: 400 / 500 / 600 / 700 · line-height body 1.5 · ฟอนต์ไทย = Noto Sans Thai

## 5. คู่สีที่อนุมัติ (ผ่าน WCAG AA)

| fg | bg | ratio |
|---|---|---|
| white | `--action-primary` #0D6C3B | 6.51 ✅ |
| white | `--action-secondary` #128449 | 4.75 ✅ |
| `--text-brand` | white | 6.51 ✅ |
| `--success/warning/error/info-text` | คู่ `-subtle` | 7.0–7.8 ✅ |
| white | status solid (success/warning/error/info) | 5.0–6.5 ✅ |
| ❌ white | green-100 #2DFB91 | 1.37 (ห้าม) |

## 6. Component quick-spec

- **Button** — h40, radius 8, weight 600. primary = `--action-primary` (hover `-hover`, active `-active`, text #fff); secondary = `--action-secondary`; outline = transparent + `--border-brand` + text brand; ghost = transparent; danger = `--error`; disabled = `--action-disabled-*`. focus = `--focus-ring-contrast`
- **Input** — h40, radius 8, bg card, border `--border-default`; focus → border brand + `--focus-ring`; error → border `--error` + text `--error-text`; label บนเสมอ (ไม่ใช้ placeholder แทน label)
- **Card** — bg `--surface-card`, border `--border-subtle`, radius 12, shadow-sm (hover shadow-md)
- **Badge** — h22, radius 6, xs. brand = `--surface-brand-subtle` + `--success-text`; status = ใช้คู่ `-subtle`/`-text`
- **StatusChip** — badge + dot สีนำหน้า (ไม่พึ่งสีอย่างเดียว)
- **Chip/filter** — h28, radius full; selected = `--action-primary` + #fff; outline = border brand + text brand
- **ListingCard** ⭐ — image(cover) → badgeRow + photoCount → publicCode(mono/xs) → title(16/600, 2 บรรทัด) → location(pin + text.secondary) → specHints → price(19/700). ราคา null → "ติดต่อสอบถาม"; เช่าแสดง "/เดือน"
- **Alert / Toast** — ใช้คู่ status `-subtle`+`-text`+border + icon + ข้อความ
- **Tabs** — active = text brand + underline 2px brand
- **Modal** radius 16 / scrim `rgba(2,35,16,.48)` · **z-index:** sticky 100 / header 200 / dropdown 300 / drawer 400 / modal 500 / toast 700 / tooltip 800

## 7. Chart / data-viz

- **Categorical** (เรียงตายตัว ห้าม cycle): ใช้ `--chart-1..8` — validated CVD-safe ทั้ง light/dark
- **Sequential** (green light→dark): `#E6F6EC #C4E9D0 #97D6AE #5FBB84 #2E9C61 #157F43 #0D6C3B #09582F`
- **Diverging** (red↔green, gray กลาง): neg `#A32C28 #C8433B #E39A93` · mid `#ECEBE7`(light)/`#333F37`(dark) · pos `#93CFAB #45A56E #0D6C3B`
- **Status (chart):** good #0D6C3B · warning #B45309 · serious #C2410C · critical #C02626
- กฎ: หนึ่งแกน (ห้าม dual-axis), text ใช้หมึก text-token ไม่ใช่สี series, legend เมื่อ ≥2 series, status มาคู่ icon+label

## 8. Checklist ก่อนส่งงาน

- [ ] ใช้ green-600 เป็น primary action (ไม่มี gold)
- [ ] ทุกสีมาจาก token, ไม่มี hex ลอย
- [ ] contrast text ผ่าน AA, focus ring มองเห็น
- [ ] ไม่มี gradient/glassmorphism/neon-as-text
- [ ] light + dark ใช้ได้ทั้งคู่
- [ ] สถานะมี icon+ข้อความ ไม่พึ่งสีอย่างเดียว
- [ ] mobile: search/requirement ใช้ได้จริง, tap target ≥44px

---
*Green Revision v1.1 · สรุปจาก 08_full + 16_component_specs — ใช้เป็น handoff สั้นสำหรับสั่ง Claude ออกแบบต่อ*
