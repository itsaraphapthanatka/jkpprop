#!/usr/bin/env bash
# Nightly database dump. Add to the VPS crontab:
#
#   0 3 * * * /srv/jkpprop/scripts/backup-db.sh >> /var/log/jkp-backup.log 2>&1
#
# Keeps 14 days. Dumps land in ./backups, which is mounted into the db
# container — put that directory on a volume that is itself backed up, or sync
# it off the box; a dump sitting on the same disk as the database protects
# against mistakes, not against losing the disk.
set -euo pipefail
cd "$(dirname "$0")/.."

STAMP=$(date +%Y%m%d-%H%M%S)
KEEP_DAYS=14
mkdir -p backups

# --clean makes the dump restorable over an existing database
docker compose exec -T db pg_dump \
  --username "${POSTGRES_USER:-jkp}" \
  --dbname "${POSTGRES_DB:-jkpprop}" \
  --clean --if-exists --no-owner \
  | gzip > "backups/jkpprop-${STAMP}.sql.gz"

echo "wrote backups/jkpprop-${STAMP}.sql.gz ($(du -h "backups/jkpprop-${STAMP}.sql.gz" | cut -f1))"

find backups -name 'jkpprop-*.sql.gz' -mtime "+${KEEP_DAYS}" -print -delete

# Uploaded media is NOT in the dump — it lives in the `uploads` volume.
# Copy it too, otherwise a restore comes back with every photo missing.
docker run --rm \
  -v jkpprop_uploads:/uploads:ro \
  -v "$(pwd)/backups:/out" \
  alpine tar czf "/out/uploads-${STAMP}.tar.gz" -C /uploads .
echo "wrote backups/uploads-${STAMP}.tar.gz"
find backups -name 'uploads-*.tar.gz' -mtime "+${KEEP_DAYS}" -print -delete
