# Home — Handoff Completeness Checklist (เพื่อทำให้ได้ 100%)

เป้าหมาย: เติมสิ่งที่ `JKP_Property_Handoff.md` ยัง **ขาด/ระบุกว้างไป** ให้ครบ จนพัฒนาหน้า **Home** ได้ตรงดีไซน์แบบ pixel-perfect

**สัญลักษณ์:** ✅ handoff มีแล้ว · ⚠️ มีแต่กว้าง (เป็น scale/ช่วง/เชิงคุณภาพ) · ❌ ไม่มี

> **ทางลัด:** ถ้าได้ **`Home.dc.html`** หรือ **ลิงก์ Figma/Claude Design** ของ Home มา จะปิด gap หมวด A–K ได้เกือบทั้งหมดทันที (เพราะ inspect ค่าจริง + export asset ได้) — เหลือแค่ยืนยัน **assets (L)** และ **copy 3 ภาษา (M)**

---

## 0. เลือกแหล่งต้นทาง 1 อย่าง (ปิด gap ได้มากสุด)
- [ ] `Home.dc.html` (prototype จริง: markup + CSS + logic) — ดีที่สุด
- [ ] ลิงก์ Figma / Claude Design (inspect px/สี + export asset)
- [ ] หรือ: screenshot ความละเอียดสูง (desktop/tablet/mobile) + ไฟล์ asset + copy deck (ด้านล่าง)

---

## A. Global / Foundation (ใช้ทั้งหน้า)

### A1. Color mapping ต่อ element (มี palette ⚠️ ขาดการ map)
- [ ] Hero overlay: gradient stops + ทิศทาง + opacity ที่ทับรูป
- [ ] สีพื้น section อ่อน (เขียว/เทา) — ใช่ `--tint #EEF4F3` หรือค่าอื่น
- [ ] ยืนยันว่าปุ่มไหนใช้ **neon `#2DFB91`** vs **green-600 `#0D6C3B`** (ปุ่ม "ค้นหา", "แจ้งความต้องการ", pill active, badge การ์ด, หัวใจ)
- [ ] สีราคา / badge ให้เช่า-ขาย / ไอคอน chip
- [ ] พื้น footer: `#04140C` หรือ `#0A0E0C` + ค่าโค้งมุมบน (px)

### A2. Radius ที่แน่นอน (มีเป็นช่วง ⚠️)
- [ ] ค่าจริงต่อ component: ปุ่ม/pill, การ์ด, กล่องค้นหา, badge, รูป, การ์ด section, modal

### A3. Shadow (⚠️ เชิงคุณภาพ)
- [ ] ค่าจริง x/y/blur/spread/rgba: การ์ด (resting + hover), กล่องค้นหา, ป้ายลอย, dropdown

### A4. Typography ต่อ element (มี scale ⚠️)
- [ ] size/weight/line-height/letter-spacing/สี ที่แน่นอนของ: hero H1, hero subtitle, eyebrow, H2, section subtitle, card title, card price, card meta, ปุ่ม, ตัวเลขสถิติ (627+), footer
- [ ] น้ำหนัก Noto Sans Thai ที่ใช้จริงต่อ element (400/500/600/700/800)

### A5. Layout system
- [ ] container max-width + gutter (desktop/tablet/mobile)
- [ ] padding บน-ล่างต่อ section (spacing rhythm จริง)
- [ ] grid gap ต่อ grid

### A6. Icons
- [ ] ไอคอนที่แน่นอน (map เป็นชื่อ lucide): 6 เหตุผล, 4 ขั้นตอน, ช่องทางติดต่อ, legend แผนที่, nav, social

### A7. Responsive
- [ ] breakpoints + การจัด layout ใหม่ต่อ section ที่ tablet/mobile (จำนวนคอลัมน์/ลำดับ/ซ่อนอะไร)

### A8. Motion timings ที่แน่นอน
- [ ] คำหมุน (kinetic): interval + transition
- [ ] carousel: autoplay/ความเร็ว/จำนวนใบต่อ view
- [ ] trust marquee: ทิศทาง + ความเร็ว
- [ ] scroll-reveal: trigger + offset (มี 28px ✅ แต่ยืนยัน trigger)
- [ ] count-up (627+ ฯลฯ): duration + easing

---

## B. Header / Nav
- [ ] ไฟล์โลโก้ (green + white) — ยืนยันมีจริง (`assets/jkp-logo-*.png`)
- [ ] รายการ nav + เนื้อหา dropdown ที่แน่นอน (โซนธุรกิจ, โกดัง▾, โรงงาน▾, แจ้งความต้องการ, เกี่ยวกับเรา, ภาษา) + route ปลายทางแต่ละอัน
- [ ] ความสูง header + พฤติกรรม sticky/หด-ขยายตอน scroll + ค่าเบลอ glass
- [ ] สไตล์ปุ่ม "ติดต่อเรา" + ดีไซน์ตัวสลับภาษา

## C. Hero + Search
- [ ] ไฟล์รูปพื้นหลัง hero (รูปโกดัง)
- [ ] copy หัวข้อเต็ม + คำไหนคือคำหมุน + รายการคำครบ + สี highlight
- [ ] copy subtitle
- [ ] กล่องค้นหา: ช่อง/placeholder ("ค้นหาทรัพย์, จังหวัด, รหัสทรัพย์…"), ปุ่ม "ค้นหา", ค่า frosted blur, ขนาด/padding
- [ ] แถว filter pill: label + ลำดับครบ (ทั้งหมด / ที่ตั้งทรัพย์ / โกดัง / … / มากกว่าตัวกรอง) + อันไหน active + พฤติกรรมเมื่อกด
- [ ] ป้ายลอย "ทรัพย์แนะนำจากทีมผู้เชี่ยวชาญ" + ไอคอน + ตำแหน่ง (ทับ hero)

## D. Featured listings (carousel)
- [ ] copy eyebrow + H2 ("อสังหาริมทรัพย์ล่าสุด") + subtitle
- [ ] card anatomy: อัตราส่วนรูป, ข้อความ photo-credit, หัวใจ, badge (ให้เช่า/ขาย) สี, code (TSP-xxxx), title, location, รูปแบบราคา, ปุ่ม "ดูรายละเอียด"
- [ ] ข้อมูล/รูปจริง 3 การ์ด (หรือ placeholder ที่แสดงในดีไซน์)
- [ ] carousel: จำนวนใบต่อ view, สไตล์ปุ่มลูกศร, ปุ่ม "ดูทั้งหมด" + "แสดงทั้งหมด"
- [ ] จำนวนการ์ดทั้งหมด / แหล่งข้อมูล

## E. Zone / Interactive Map  ← **gap ใหญ่สุด**
- [ ] แผงซ้าย: หัวข้อ + 4 ตัวเลือก (ใกล้สนามบิน / ใกล้ท่าเรือ / ใกล้กรุงเทพฯ / EEC) + ไอคอน + พฤติกรรม
- [ ] การ์ดเขียว: "640+ รายการ", tag ทำเล, "8 ตร."(?), copy ปุ่ม + route ปลายทาง
- [ ] **asset แผนที่**: กราฟิกแผนที่ไทย/EEC (SVG?) + พิกัดหมุด + โซน + legend (สนามบิน/ท่าเรือ/โซนอุตสาหกรรม/EEC) + สี + เนื้อหา popup ตอนคลิก + route ต่อโซน

## F. 4 ขั้นตอน
- [ ] eyebrow + H2 ("ค้นหาทรัพย์ใน 4 ขั้นตอน") + subtitle
- [ ] title + คำอธิบาย 4 ขั้นตอน (copy จริง)
- [ ] สเปกการ์ดแรก active (พื้นเขียวเข้ม) + ไอคอน + สไตล์เลข + พฤติกรรม auto

## G. Why us + Award
- [ ] การ์ด award: รูปทีมงาน + ข้อความ "Real Estate Agent Awards Thailand 2023" + คะแนน 4.9 + จำนวนรีวิว + badge เขียว
- [ ] สถิติ: 627+ / 31+ / 4 ปี — label ที่แน่นอน + count-up
- [ ] 6 การ์ดเหตุผล: title + คำอธิบาย + ไอคอน (จอดรถกว้าง / รองรับหลายภาษา / เปรียบเทียบง่าย / ประกาศทรัพย์ / ราคาโปร่งใส / อัปเดตออนไลน์ — ยืนยัน copy จริง)

## H. Certification
- [ ] eyebrow + H2 ("ใบรับรองและการกำกับดูแล") + subtitle
- [ ] 3 การ์ด: TREBA / DBD / มาตรฐานวิชาชีพ — asset ตรา/โลโก้ + title + คำอธิบาย + เครื่องหมาย verified

## I. Trust wall (logo marquee)
- [ ] H2 ("ธุรกิจทั่วประเทศไทยไว้วางใจเรา") + "ลูกค้าที่ไว้วางใจ 500+ ราย"
- [ ] ไฟล์โลโก้พาร์ทเนอร์ (กี่อัน/อันไหน) + ทิศทาง/ความเร็ว marquee

## J. CTA band
- [ ] copy หัวข้อ ("พร้อมหาโรงงานหรือโกดังที่ใช่ ให้เราช่วยคุณ") + subtitle
- [ ] ปุ่ม "แจ้งความต้องการ" + "โทรหา" + การ์ดเล็ก "คุยกับเราภายใน 12 ชม."
- [ ] ไฟล์รูป handshake
- [ ] gradient ที่แน่นอน (emerald `#0B7A45→#0A5C39→#043F20`?) + radius

## K. Footer
- [ ] โลโก้ (white) + copy บริษัท
- [ ] คอลัมน์ + ลิงก์ (สำรวจทรัพย์สิน / บริการ / ข้อมูลติดต่อ: เบอร์/อีเมล/ที่อยู่จริง)
- [ ] social icons + ลิงก์ + ปุ่ม "ติดตาม"/newsletter
- [ ] ข้อความ copyright + ค่าโค้งมุมบน + สีพื้นเข้มที่แน่นอน

---

## L. Asset bundle ที่ต้องส่ง (รวม)
- [ ] โลโก้ green + white
- [ ] รูป hero (โกดัง)
- [ ] รูปการ์ดทรัพย์ 3 ใบ (หรือข้อมูล listing จริง)
- [ ] รูปทีมงาน/award
- [ ] รูป handshake
- [ ] แผนที่ไทย/EEC (SVG + ข้อมูลหมุด/โซน)
- [ ] ตรา certification: TREBA, DBD, มาตรฐานวิชาชีพ
- [ ] โลโก้พาร์ทเนอร์ (trust wall)
- [ ] favicon
- [ ] ทั้งหมดควรเป็น web-optimized (webp) + @2x + alt text

## M. Copy deck (ข้อความ final)
- [ ] ทุกหัวข้อ/subtitle/ปุ่ม/การ์ด เป็นข้อความจริง
- [ ] ครบ **3 ภาษา (TH / EN / ZH)** — handoff บังคับ i18n 3 ภาษา (บรรทัด 159) แต่ตัว handoff ไม่มี copy จริงเลย

---

## สรุปสั้น
`handoff.md` = **โครง + ระบบดีไซน์ + พฤติกรรม** (ดีมาก) แต่ **ค่าพิกเซล/asset/copy จริง** ต้องมาจากไฟล์ต้นทาง (`.dc.html`/Figma) + bundle asset + copy deck ข้างบน
- ได้ **§0 (ต้นทาง)** → ปิด A–K
- ได้ **§L (assets) + §M (copy)** → ครบ 100%
