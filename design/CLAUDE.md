# Design System — บังคับใช้เสมอ

ยึด `Design System.dc.html` เป็น design system หลักของโปรเจกต์นี้จนกว่าจะมีการแจ้งเปลี่ยน ทุกหน้า/คอมโพเนนต์ใหม่ต้องใช้ token เดียวกันนี้ — ห้ามคิดสีใหม่ ฟอนต์ใหม่ หรือ radius/spacing ใหม่ที่ไม่อยู่ในลิสต์นี้

## Brand colors
- Neon green: `#2DFB91` — CTA หลักบนพื้นเข้ม
- Green 600 (action): `#0D6C3B` — ปุ่มหลักบนพื้นสว่าง
- Deep teal (accent): `#034956` — eyebrow / ลิงก์ / ไอคอนเน้น
- Deep pine: `#273c33` — active state ไอคอน/border, ปุ่มโมดัล
- Near black: `#04140C` / `#0A0E0C` — พื้น footer, panel เข้ม
- Emerald gradient: `#0B7A45 → #0A5C39 → #043F20` — การ์ด CTA
- Gold: `#D9A62B` — โทรศัพท์/เรียงตาม/คำแนะนำ

## Neutrals / surfaces (CSS vars)
`--bg:#F9F8F5` `--bg2:#F3F0EC` `--surface:#FFFFFF` `--tint:#EEF4F3` `--text:#28251D` `--muted:#5F5A52` `--muted2:#7A7974` `--muted3:#9B968D` `--border:#E7E3DC` `--accent:#034956`

## Typography
Noto Sans Thai (400–800) + Inter fallback. Mono (JetBrains Mono) สำหรับราคา/โค้ด. Scale: H1 44px/700, H2 34px/700, H3 22px/800, body 15–16px/400, eyebrow 13px/700 uppercase, price 21px/800 mono.

## Spacing & radius
Spacing: 4 / 8 / 16 / 24 / 44 / 88px. Radius: sm 10px, md 18px, lg 24px, full 9999px (pill).

## Icons
เส้น iOS/SF Symbols style — stroke-width 1.7px, stroke-linecap/linejoin round ทุกอัน.

## Components
ปุ่มเป็นพิลล์เสมอ + hover lift/glow. การ์ด border 1.5px + hover ยกลอย. Chips/badges แบบพิลล์เล็ก. Motion: hover-lift (translateY -2px .2s), card-hover (.3s cubic-bezier(.2,.7,.3,1)), reveal-up (scroll), drawer-slide (.35s).

อ้างอิงตัวอย่าง live ทั้งหมดได้ที่ `Design System.dc.html`.
