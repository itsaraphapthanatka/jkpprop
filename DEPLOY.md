# Deploy — VPS เดี่ยวด้วย Docker Compose

รันทั้งระบบด้วย 4 container: **app** (Next.js), **db** (PostgreSQL 16),
**migrate** (รันครั้งเดียวก่อน app ขึ้น), **caddy** (reverse proxy + TLS อัตโนมัติ)

> ⚠️ ใช้ได้กับ **VPS เปล่า** เท่านั้น ถ้าเครื่องปลายทางมี nginx/Apache หรือเว็บอื่นรันอยู่แล้ว
> Caddy ในชุดนี้จะไปแย่งพอร์ต 80/443 และ**ทำให้เว็บเดิมล่ม** — ให้ใช้
> [DEPLOY_NGINX.md](DEPLOY_NGINX.md) กับ `docker-compose.behind-nginx.yml` แทน

---

## ⚠️ อ่านก่อน: ต้องมี HTTPS ไม่ใช่ทางเลือก

session cookie ถูกออกด้วยแฟล็ก `secure` เมื่อ `NODE_ENV=production`
([auth.ts](web/src/lib/server/auth.ts)) — บน `http://` ธรรมดา เบราว์เซอร์
**จะไม่ส่ง cookie กลับมา** ผลคือล็อกอินสำเร็จแล้วเด้งกลับหน้า login วนไม่จบ
และดูเหมือน "ระบบพัง" ทั้งที่ไม่ใช่

Caddy ในชุดนี้ขอใบรับรองให้เองอัตโนมัติ — แค่ชี้โดเมนมาที่ VPS ก่อน

---

## 1. เตรียม VPS

ต้องการอย่างน้อย **2 GB RAM** (ตอน build กินหน่วยความจำพอสมควร) และดิสก์ ~10 GB

```bash
# Ubuntu 22.04 / 24.04
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER" && newgrp docker

sudo mkdir -p /srv && cd /srv
sudo git clone https://github.com/itsaraphapthanatka/jkpprop.git
sudo chown -R "$USER":"$USER" jkpprop && cd jkpprop
```

ชี้ DNS `A` record ของโดเมนมาที่ IP ของ VPS **ก่อน** ขั้นถัดไป
(Caddy ต้องเข้าถึงพอร์ต 80/443 ได้เพื่อขอใบรับรอง)

## 2. ตั้งค่า

```bash
cp .env.deploy.example .env
openssl rand -base64 24        # เอาไปใส่ POSTGRES_PASSWORD
nano .env                      # กรอก DOMAIN, TLS_EMAIL, POSTGRES_PASSWORD
```

## 3. ขึ้นระบบ

```bash
docker compose up -d --build
docker compose logs -f app     # ดูจนขึ้น "Ready"
```

`migrate` จะรัน `prisma migrate deploy` ให้ก่อน แล้ว `app` ถึงจะสตาร์ต
ถ้า migration ล้ม app จะไม่ขึ้น — ตั้งใจให้เป็นแบบนั้น

## 4. ใส่ข้อมูลตั้งต้น (ครั้งเดียว)

```bash
./scripts/seed-once.sh
```

จะได้ org, จังหวัด, ช่องทาง social, เนื้อหาตัวอย่าง และ **บัญชี owner**

> 🔴 **เปลี่ยนรหัสผ่านทันที** — `owner@jkp.local / jkp12345` เป็นรหัสที่เขียนไว้ในโค้ดสาธารณะ
> เข้า `/admin/change-password` แล้วตั้งใหม่ ระบบจะเตะ session อื่นทั้งหมดให้เอง
> จากนั้นเชิญผู้ใช้จริงที่ `/admin/users` (ระบบจะออกรหัสชั่วคราวที่**บังคับให้เจ้าตัวเปลี่ยนก่อนใช้งาน**)

เสร็จแล้วเปิด `https://<โดเมน>` ได้เลย

---

## deploy รอบถัดไป

```bash
./scripts/deploy.sh
```

pull → build → migrate → restart → รอจน healthy ถ้า migration ล้มจะหยุดก่อนสลับ container

## สำรองข้อมูล

```bash
crontab -e
0 3 * * * /srv/jkpprop/scripts/backup-db.sh >> /var/log/jkp-backup.log 2>&1
```

สำรอง **ทั้งฐานข้อมูลและไฟล์ที่อัปโหลด** — รูปไม่ได้อยู่ในฐานข้อมูล ถ้าสำรองแต่ DB
กู้กลับมาจะได้ระบบที่รูปหายหมด เก็บไว้ 14 วัน

> ไฟล์ dump อยู่บนดิสก์เดียวกับฐานข้อมูล — กันความผิดพลาดของคนได้ แต่**กันดิสก์เสียไม่ได้**
> ควร rsync ออกไปนอกเครื่องด้วย

กู้คืน:

```bash
gunzip -c backups/jkpprop-<stamp>.sql.gz | docker compose exec -T db psql -U jkp -d jkpprop
docker run --rm -v jkpprop_uploads:/uploads -v "$PWD/backups:/in" alpine \
  sh -c 'tar xzf /in/uploads-<stamp>.tar.gz -C /uploads'
```

---

## คำสั่งที่ใช้บ่อย

| ทำอะไร | คำสั่ง |
|---|---|
| ดู log | `docker compose logs -f app` |
| สถานะ | `docker compose ps` |
| เข้า psql | `docker compose exec db psql -U jkp -d jkpprop` |
| รีสตาร์ตเฉพาะ app | `docker compose restart app` |
| หยุดทั้งหมด | `docker compose down` (ข้อมูลอยู่ใน volume ไม่หาย) |
| ลบทุกอย่างรวมข้อมูล | `docker compose down -v` ⚠️ |

## เมื่อมีปัญหา

| อาการ | สาเหตุที่พบบ่อย |
|---|---|
| ล็อกอินแล้วเด้งกลับหน้า login | ยังเป็น http — cookie `secure` ไม่ถูกส่ง ตรวจว่า Caddy ได้ใบรับรองแล้ว (`docker compose logs caddy`) |
| Caddy ขอใบรับรองไม่ได้ | DNS ยังไม่ชี้มา หรือพอร์ต 80/443 ถูก firewall บล็อก |
| อัปโหลดรูปแล้วหายหลัง deploy | volume `uploads` ไม่ได้ถูก mount — ตรวจ `docker volume ls` |
| app ไม่ขึ้น | ดู `docker compose logs migrate` ก่อน — มักเป็น migration ล้ม |
| build ถูกฆ่ากลางคัน | RAM ไม่พอ เพิ่ม swap: `fallocate -l 2G /swapfile && mkswap /swapfile && swapon /swapfile` |

## ย้ายไฟล์ขึ้น object storage (ทำภายหลังได้)

ตอนนี้ไฟล์อยู่บนดิสก์ VPS ซึ่ง**ถูกต้องแล้วสำหรับเครื่องเดียว** ถ้าวันหนึ่งมีหลาย
app node ให้ใส่ `S3_*` ทั้งสี่ตัวใน `.env` แล้ว restart — โค้ดไม่ต้องแก้
(ดู [`web/BACKEND.md`](web/BACKEND.md)) ไฟล์เดิมบนดิสก์ต้องคัดลอกขึ้น bucket เอง
