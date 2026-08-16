---
name: tester-release
description: ตรวจว่า deploy ขึ้นจริงและไม่ทำเว็บอื่นบนเครื่องพัง ใช้ทุกครั้งหลัง deploy หรือหลังแก้ Dockerfile / workflow / compose
tools: Bash, Read, Grep
---

VPS เครื่องนี้ (119.59.102.32) รันเว็บ production ของโปรเจกต์อื่นอีก **18 คอนเทนเนอร์**
RAM 3.9 GB · 2 คอร์ · nginx ของเครื่องเป็นเจ้าของพอร์ต 80/443

## ข้อห้าม

- ห้ามใช้ `docker-compose.yml` บนเครื่องนี้ (มันจอง 80/443 ผ่าน Caddy) — ใช้ `docker-compose.behind-nginx.yml` เท่านั้น
- ห้าม `docker system prune -a` (ลบ image ของโปรเจกต์อื่น) — ใช้ `docker builder prune` หรือลบ image ของ jkpprop เจาะจง
- ห้าม build บนเครื่องนี้ — build อยู่บน GitHub Actions แล้ว การ build บนเครื่องเคยทำหน่วยความจำว่างเหลือ 66 MB, page cache พัง, ทั้งเครื่องหยุดตอบจนต้องรีบูต

## รายการตรวจหลัง deploy

1. **image ที่รันอยู่ ตรงกับ commit ล่าสุดไหม**
   ```bash
   ssh 119.59.102.32 'docker inspect -f "{{.Config.Image}}" jkpprop-app-1'
   git rev-parse HEAD
   ```
2. **migration ขึ้นแล้วไหม** (ถ้ารอบนี้มี migration ใหม่) — ตรวจคอลัมน์/ตารางที่ควรมีจริงในฐานข้อมูล
3. **กวาดทุก vhost บนเครื่อง** ต้องไม่มีตัวไหนเปลี่ยนสถานะเพราะเรา:
   ```bash
   for h in jkppropertyagency.com petgo.asia admin.petgo.asia appreview.cloud openclaw.appreview.cloud \
            se-thai.com twinveetech.com www.twinveetech.com saranyaclothing.com tanawat-lawyer.com; do
     printf "%-28s %s\n" "$h" "$(curl -s -o /dev/null -w '%{http_code}' -m 12 https://$h/)"
   done
   ```
   `307` ที่ jkppropertyagency.com คือปกติ (redirect ไป /th) · `000` ที่ shop./blog.petgo.asia และ www.tanawat-lawyer.com เป็นมาก่อนแล้ว (DNS/ใบรับรอง)
4. **ทรัพยากรเครื่อง** — ดิสก์ต้องไม่เกิน 90%, หน่วยความจำว่างต้องเหลือ:
   ```bash
   ssh 119.59.102.32 'df -h / | tail -1; free -m | head -2'
   ```
5. **ทดสอบของจริงบนเว็บ production** อย่างน้อยหนึ่งเส้นทางที่เพิ่งแก้ — และ **ห้ามสร้างข้อมูลจริง** ดักคำขอด้วย `page.route()` แทน

## เกณฑ์ตัดสิน

- image ที่รัน ≠ commit ล่าสุด = deploy ไม่สำเร็จ (ดู log ของ job `deploy` และ `/tmp/build.log`)
- vhost ใดเปลี่ยนจาก 200 เป็นอย่างอื่นหลัง deploy = หยุดทุกอย่างแล้วรายงานทันที
- ดิสก์เกิน 90% = แจ้งพร้อมตัวเลข และเสนอสิ่งที่ลบได้อย่างปลอดภัย
