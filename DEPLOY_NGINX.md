# Deploy — VPS ที่มี nginx และเว็บอื่นรันอยู่แล้ว

ใช้เมื่อเครื่องปลายทาง **ไม่ว่าง** — มี nginx + certbot ดูแลเว็บอื่นอยู่ก่อนแล้ว
ถ้าเป็น VPS เปล่าให้ใช้ [DEPLOY.md](DEPLOY.md) แทน (ชุดนั้นมี Caddy จัดการ TLS ให้เอง)

ต่างกันสามข้อ:

| | VPS เปล่า ([DEPLOY.md](DEPLOY.md)) | เครื่องที่มี nginx อยู่แล้ว (ไฟล์นี้) |
|---|---|---|
| TLS | Caddy ขอใบรับรองเอง | ใช้ certbot + nginx เดิมของเครื่อง |
| พอร์ต | Caddy จับ 80/443 | แอปเปิดที่ `127.0.0.1:3100` เท่านั้น |
| build | build บนเครื่องปลายทาง | **build ที่เครื่องอื่นแล้วส่ง image ไป** |

> ⚠️ **ห้ามใช้ `docker-compose.yml` ตัวหลักบนเครื่องแบบนี้** — มันมี Caddy ที่จะไปแย่ง
> พอร์ต 80/443 ผลคือ start ไม่ขึ้น หรือถ้าไปหยุด nginx ก่อน **เว็บอื่นทุกตัวบนเครื่องจะล่ม**
> ให้ใช้ `docker-compose.behind-nginx.yml` เท่านั้น

---

## 1. สำรวจเครื่องก่อน

```bash
ss -lntp                         # ดูพอร์ตทั้งหมด
free -h                          # RAM เหลือเท่าไร
df -h /                          # ดิสก์เหลือเท่าไร
ls /etc/nginx/sites-enabled/     # มีเว็บอะไรอยู่บ้าง
```

เลือกพอร์ตที่ยังไม่มีใครใช้ไปใส่ `APP_PORT`

> อย่ากรอง `ss` ด้วย `grep 127.0.0.1` — process ที่ bind `*:PORT` (ทุก interface)
> จะไม่โผล่ในผลลัพธ์ แล้วพอร์ตที่ดู "ว่าง" จะชนตอน `docker compose up` เช็คทีละพอร์ตแบบนี้แทน:
>
> ```bash
> ss -lnt "sport = :3110" | grep -q LISTEN && echo ใช้อยู่ || echo ว่าง
> ```

## 2. build ที่เครื่องตัวเอง แล้วส่ง image ขึ้นไป

Next.js กิน RAM ตอน build พอสมควร บนเครื่องที่ RAM เหลือน้อย OOM killer
อาจไปฆ่า container ของเว็บอื่นด้วย — build ที่อื่นปลอดภัยกว่า

`--platform linux/amd64` สำคัญถ้า build จาก Mac (Apple Silicon เป็น arm64)

```bash
docker build --platform linux/amd64 -t jkpprop-app:latest     -f web/Dockerfile         web/
docker build --platform linux/amd64 -t jkpprop-migrate:latest -f web/Dockerfile.migrate web/

docker save jkpprop-app:latest jkpprop-migrate:latest | gzip | \
  ssh root@VPS 'gunzip | docker load'
```

## 3. ตั้งค่าบน VPS

```bash
mkdir -p /srv/jkpprop/backups && cd /srv/jkpprop
# วาง docker-compose.behind-nginx.yml ไว้เป็น docker-compose.yml

cat > .env <<EOF
DOMAIN=example.com
APP_PORT=3100
POSTGRES_USER=jkp
POSTGRES_DB=jkpprop
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
EOF
chmod 600 .env

docker compose up -d
docker compose logs -f app
```

## 4. ใส่ข้อมูลตั้งต้น

```bash
docker compose run --rm --entrypoint sh migrate -c 'npx prisma db seed'
```

> 🔴 **เปลี่ยนรหัสผ่านทันที** — `owner@jkp.local / jkp12345` เขียนไว้ในโค้ดสาธารณะ
> เข้า `/admin/change-password` ระบบจะเตะ session อื่นทิ้งให้เอง

## 5. ชี้ nginx มาที่แอป

**สำรอง vhost เดิมก่อนเสมอ** — ถ้าพลาดจะได้ย้อนกลับได้ใน 5 วินาที

```bash
cp /etc/nginx/sites-available/example.com{,.bak-$(date +%F)}
# แก้ตาม deploy/nginx-jkppropertyagency.com.conf (เปลี่ยนชื่อโดเมนกับพอร์ต)
nginx -t && systemctl reload nginx
```

จุดที่พลาดกันบ่อยในไฟล์นั้น:

- `client_max_body_size 25m` — ค่า default ของ nginx คือ 1m รูปจากมือถือส่วนใหญ่จะโดน **413** ตั้งแต่ยังไม่ถึงแอป
- `proxy_set_header X-Forwarded-Proto $scheme` — ไม่มีบรรทัดนี้แอปจะเห็นเป็น http ธรรมดา
  session cookie เป็น `secure` ผลคือ **ล็อกอินแล้ววนกลับหน้า login** โดยไม่มี error อะไรเลย
- ไม่ใส่บล็อก WebSocket upgrade — `$connection_upgrade` ต้องประกาศ `map` ใน http context
  ซึ่งเป็น config ที่**เว็บอื่นทุกตัวบนเครื่องโหลดด้วย** และ production build ไม่ได้ใช้ socket อยู่แล้ว

`nginx -t` ต้องผ่านก่อน reload ทุกครั้ง — `reload` ด้วย config เสียจะทำให้เว็บอื่นล่มไปด้วย

## 6. ตรวจว่าไม่ไปกระทบเว็บอื่น

```bash
for d in $(ls /etc/nginx/sites-enabled/); do
  printf '%-40s %s\n' "$d" "$(curl -s -o /dev/null -w '%{http_code}' -m 10 "https://$d")"
done
```

---

## deploy รอบถัดไป

build ใหม่ที่เครื่องตัวเอง → `docker save | ssh docker load` → แล้วบน VPS:

```bash
cd /srv/jkpprop
docker compose up -d --force-recreate app
docker image prune -f
```

migration รันเองตอน container `migrate` ขึ้น ถ้า migration ล้ม `app` จะไม่สตาร์ต

## สำรองข้อมูล

```bash
crontab -e
0 3 * * * cd /srv/jkpprop && /srv/jkpprop/scripts/backup-db.sh >> /var/log/jkp-backup.log 2>&1
```

สำรอง**ทั้ง DB และ uploads** — รูปไม่ได้อยู่ในฐานข้อมูล
