#!/usr/bin/env bash
# Nightly database dump. Add to the VPS crontab:
#
#   0 3 * * * /srv/jkpprop/scripts/backup-db.sh >> /var/log/jkp-backup.log 2>&1
#
# Dumps land in ./backups, which is mounted into the db container — put that
# directory on a volume that is itself backed up, or sync it off the box; a
# dump sitting on the same disk as the database protects against mistakes, not
# against losing the disk.
#
# ทำไมสองอย่างนี้เก็บไม่เท่ากัน · 26 ส.ค. 2569 ดิสก์เต็ม 100% เหลือ 38MB
# ทั้งเครื่อง ซึ่งมีเว็บ production อีก 17 ตัวใช้ร่วมกัน
#   ตอนตั้งค่าไว้ทีแรก ไฟล์รูปทั้งก้อนมีขนาด 13MB ต่อคืน เก็บ 14 คืนก็ 180MB
#   วันนี้คลังรูปโตจนก้อนเดียว 2.3GB · 14 คืน = 20GB เกินดิสก์ทั้งลูก
#   ตัวเลข 14 ไม่ได้ผิดตอนเขียน แต่มันผูกกับของที่โตขึ้นเรื่อย ๆ
#
# ไฟล์ฐานข้อมูลก้อนละ ~350KB เก็บยาวได้ไม่มีปัญหา · ไฟล์รูปเป็นสำเนาเต็มทุกคืน
# ของข้อมูลที่ยังอยู่ครบใน volume จริง จึงเก็บไว้แค่พอถอยกลับได้
#
# +1 เก็บไว้ราวสองคืน = ~4.6GB ที่ขนาดวันนี้ · ถ้าเปลี่ยนเป็น +3 จะกลายเป็น
# สี่คืน ~9.2GB ซึ่งเกือบเท่าที่ว่างทั้งหมดที่เหลืออยู่ตอนนี้ ตัวเลขนี้จึงต้อง
# ทบทวนใหม่ทุกครั้งที่คลังรูปโตขึ้นเป็นเท่าตัว
set -euo pipefail
cd "$(dirname "$0")/.."

STAMP=$(date +%Y%m%d-%H%M%S)
KEEP_DB_DAYS=14
KEEP_UPLOAD_DAYS=1
mkdir -p backups

# --clean makes the dump restorable over an existing database
docker compose exec -T db pg_dump \
  --username "${POSTGRES_USER:-jkp}" \
  --dbname "${POSTGRES_DB:-jkpprop}" \
  --clean --if-exists --no-owner \
  | gzip > "backups/jkpprop-${STAMP}.sql.gz"

echo "wrote backups/jkpprop-${STAMP}.sql.gz ($(du -h "backups/jkpprop-${STAMP}.sql.gz" | cut -f1))"

find backups -name 'jkpprop-*.sql.gz' -mtime "+${KEEP_DB_DAYS}" -print -delete

# Uploaded media is NOT in the dump — it lives in the `uploads` volume.
# Copy it too, otherwise a restore comes back with every photo missing.
#
# ลบของเก่า *ก่อน* เขียนของใหม่ — เดิมเขียนก่อนแล้วค่อยลบ คืนที่ดิสก์ใกล้เต็ม
# จึงเต็มระหว่างเขียน แล้วได้ไฟล์ tar ที่ไม่สมบูรณ์ทิ้งไว้ พร้อมกับดิสก์ที่เต็ม
find backups -name 'uploads-*.tar.gz' -mtime "+${KEEP_UPLOAD_DAYS}" -print -delete

# กันไม่ให้คืนที่เนื้อที่ไม่พอลาก production ทั้งเครื่องลงไปด้วย
# ต้องมีที่ว่างอย่างน้อยเท่าขนาด volume จริง บวกเผื่อ 1GB
NEED_KB=$(( $(docker run --rm -v jkpprop_uploads:/uploads:ro alpine du -sk /uploads | cut -f1) + 1048576 ))
FREE_KB=$(df -Pk . | awk 'NR==2 {print $4}')
if [ "$FREE_KB" -lt "$NEED_KB" ]; then
  echo "ข้ามการสำรองรูป — เหลือที่ $((FREE_KB/1024))MB ต้องการ $((NEED_KB/1024))MB" >&2
  echo "  (ไฟล์ฐานข้อมูลของคืนนี้เขียนเรียบร้อยแล้ว)" >&2
  exit 0
fi

docker run --rm \
  -v jkpprop_uploads:/uploads:ro \
  -v "$(pwd)/backups:/out" \
  alpine tar czf "/out/uploads-${STAMP}.tar.gz" -C /uploads .
echo "wrote backups/uploads-${STAMP}.tar.gz"
