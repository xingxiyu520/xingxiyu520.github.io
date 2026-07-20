#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="${SOURCE_ROOT:-$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/$STAMP}"
VERIFY_BACKUP="${VERIFY_BACKUP:-1}"
REQUIRE_ENV="${REQUIRE_ENV:-0}"

umask 077

DATABASE_SOURCE="$ROOT_DIR/backend/data/site.db"
UPLOADS_SOURCE="$ROOT_DIR/backend/uploads"
ENV_SOURCE="$ROOT_DIR/backend/.env"

if [ ! -f "$DATABASE_SOURCE" ]; then
  echo "Database not found: $DATABASE_SOURCE" >&2
  exit 1
fi

if [ ! -d "$UPLOADS_SOURCE" ]; then
  echo "Uploads directory not found: $UPLOADS_SOURCE" >&2
  exit 1
fi

if [ "$REQUIRE_ENV" = "1" ] && [ ! -f "$ENV_SOURCE" ]; then
  echo "Environment file not found: $ENV_SOURCE" >&2
  exit 1
fi

if [ -d "$BACKUP_DIR" ] && [ -n "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
  echo "Backup directory is not empty: $BACKUP_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

backup_database() {
  source_path="$1"
  destination_path="$2"

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$source_path" "$destination_path" <<'PY'
import sqlite3
import sys

source_path, destination_path = sys.argv[1:3]
with sqlite3.connect(f"file:{source_path}?mode=ro", uri=True) as source:
    with sqlite3.connect(destination_path) as destination:
        source.backup(destination)
PY
    return
  fi

  if command -v python >/dev/null 2>&1; then
    python - "$source_path" "$destination_path" <<'PY'
import sqlite3
import sys

source_path, destination_path = sys.argv[1:3]
with sqlite3.connect(f"file:{source_path}?mode=ro", uri=True) as source:
    with sqlite3.connect(destination_path) as destination:
        source.backup(destination)
PY
    return
  fi

  echo "Warning: Python is unavailable; falling back to a direct SQLite file copy." >&2
  cp "$source_path" "$destination_path"
}

write_checksums() {
  if command -v sha256sum >/dev/null 2>&1; then
    (
      cd "$BACKUP_DIR"
      sha256sum site.db uploads.tar.gz MANIFEST.txt > SHA256SUMS
      if [ -f backend.env ]; then
        sha256sum backend.env >> SHA256SUMS
      fi
    )
    return
  fi

  if command -v shasum >/dev/null 2>&1; then
    (
      cd "$BACKUP_DIR"
      shasum -a 256 site.db uploads.tar.gz MANIFEST.txt > SHA256SUMS
      if [ -f backend.env ]; then
        shasum -a 256 backend.env >> SHA256SUMS
      fi
    )
    return
  fi

  echo "Warning: no SHA-256 utility found; checksum file was not created." >&2
}

backup_database "$DATABASE_SOURCE" "$BACKUP_DIR/site.db"
tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$ROOT_DIR/backend" uploads

if [ -f "$ENV_SOURCE" ]; then
  cp "$ENV_SOURCE" "$BACKUP_DIR/backend.env"
else
  echo "Warning: $ENV_SOURCE does not exist, so environment settings were not backed up." >&2
fi

cat > "$BACKUP_DIR/MANIFEST.txt" <<EOF
created_at=$STAMP
database=site.db
uploads=uploads.tar.gz
environment=$(if [ -f "$BACKUP_DIR/backend.env" ]; then printf '%s' 'backend.env'; else printf '%s' 'missing'; fi)
EOF

write_checksums

if [ "$VERIFY_BACKUP" = "1" ]; then
  REQUIRE_ENV="$REQUIRE_ENV" sh "$SCRIPT_DIR/verify-backup.sh" "$BACKUP_DIR"
fi

echo "Backup saved to $BACKUP_DIR"
