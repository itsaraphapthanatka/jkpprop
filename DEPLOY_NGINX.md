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

## 2. image สร้างที่ GitHub Actions — ไม่ build บน VPS

เครื่องนี้มี RAM 3.9 GB กับ 2 คอร์ และรันคอนเทนเนอร์ของเว็บอื่นอีก 18 ตัว
วันที่ 16 ส.ค. 2569 การ build บนเครื่องทำให้หน่วยความจำว่างเหลือ 66 MB และ
page cache พังจาก 1.4 GB เหลือ 137 MB ทุกเซอร์วิสต้องอ่านตัวเองกลับจากดิสก์
(อ่านดิสก์พุ่งจาก 110 เป็น 40,000 บล็อก/วินาที) เครื่องหยุดตอบจนต้องรีบูตมือ

ตอนนี้ push ขึ้น `main` หรือ `deploy/behind-nginx` แล้ว `.github/workflows/images.yml`
จะ build ทั้งสอง image บน runner ของ GitHub แล้วส่งขึ้น GHCR ให้เอง:

* `ghcr.io/<owner>/jkpprop-app:latest` และ `:<git-sha>`
* `ghcr.io/<owner>/jkpprop-migrate:latest` และ `:<git-sha>`

ติด tag ด้วย sha ไว้ด้วย เพื่อให้ย้อนกลับไป build ที่รู้ว่าใช้ได้ ไม่ใช่ต้อง build ใหม่

### ตั้งค่าครั้งเดียวบน VPS

image เป็น package ส่วนตัว เครื่องจึงต้องมี token อ่านอย่างเดียว
(สร้างที่ github.com/settings/tokens ให้สิทธิ์ `read:packages` อย่างเดียวพอ)

```bash
cd /srv/jkpprop
printf '%s' 'ghp_xxx' > .ghcr-token && chmod 600 .ghcr-token
cp /path/to/deploy/pull-and-restart.sh . && chmod +x pull-and-restart.sh
```

### ทุกครั้งที่ deploy

```bash
/srv/jkpprop/pull-and-restart.sh              # ตัวล่าสุด
/srv/jkpprop/pull-and-restart.sh <git-sha>    # ย้อนกลับไปตัวที่รู้ว่าใช้ได้
```

สคริปต์จะ pull → รัน migrate → เปลี่ยน container ของ app → แล้ว **ยิง HTTP จริง
เข้าไปเช็คว่าตอบ 200** ก่อนบอกว่าเสร็จ ถ้าไม่ตอบใน 60 วินาที มันจะฟ้องและคืน
exit code ไม่ใช่ 0

> วิธีเดิม (build บนแมคแล้ว `docker save | ssh 'docker load'`) ยังใช้ได้อยู่
> ถ้า GitHub Actions ล่ม — compose อ่านชื่อ image จาก `APP_IMAGE`/`MIGRATE_IMAGE`
> ใน `.env` ถ้าไม่ได้ตั้งไว้ ก็จะกลับไปใช้ `jkpprop-app:latest` ในเครื่องเหมือนเดิม
>
> ```bash
> docker build --platform linux/amd64 -t jkpprop-app:latest     -f web/Dockerfile         web/
> docker build --platform linux/amd64 -t jkpprop-migrate:latest -f web/Dockerfile.migrate web/
> docker save jkpprop-app:latest jkpprop-migrate:latest | gzip | ssh root@VPS 'gunzip | docker load'
> ```

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
