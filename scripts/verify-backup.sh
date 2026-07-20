#!/usr/bin/env sh
set -eu

BACKUP_DIR="${1:-}"
REQUIRE_ENV="${REQUIRE_ENV:-0}"

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: $0 <backup-directory>" >&2
  exit 2
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Backup directory not found: $BACKUP_DIR" >&2
  exit 1
fi

DATABASE_PATH="$BACKUP_DIR/site.db"
UPLOADS_PATH="$BACKUP_DIR/uploads.tar.gz"
ENV_PATH="$BACKUP_DIR/backend.env"

if [ ! -s "$DATABASE_PATH" ]; then
  echo "Missing or empty database backup: $DATABASE_PATH" >&2
  exit 1
fi

if [ ! -s "$UPLOADS_PATH" ]; then
  echo "Missing or empty uploads backup: $UPLOADS_PATH" >&2
  exit 1
fi

if [ "$REQUIRE_ENV" = "1" ] && [ ! -s "$ENV_PATH" ]; then
  echo "Missing or empty environment backup: $ENV_PATH" >&2
  exit 1
fi

SQLITE_HEADER="$(head -c 15 "$DATABASE_PATH")"
if [ "$SQLITE_HEADER" != "SQLite format 3" ]; then
  echo "Invalid SQLite database header: $DATABASE_PATH" >&2
  exit 1
fi

ARCHIVE_LIST="$(mktemp)"
trap 'rm -f "$ARCHIVE_LIST"' EXIT HUP INT TERM
tar -tzf "$UPLOADS_PATH" > "$ARCHIVE_LIST"

if ! grep -Eq '^uploads/?$|^uploads/' "$ARCHIVE_LIST"; then
  echo "Uploads archive does not contain the uploads directory." >&2
  exit 1
fi

if awk '/^\// || /(^|\/)\.\.($|\/)/ { found = 1 } END { exit found ? 0 : 1 }' "$ARCHIVE_LIST"; then
  echo "Uploads archive contains an unsafe path." >&2
  exit 1
fi

verify_database() {
  interpreter="$1"
  "$interpreter" - "$DATABASE_PATH" <<'PY'
import sqlite3
import sys

database_path = sys.argv[1]
with sqlite3.connect(f"file:{database_path}?mode=ro", uri=True) as connection:
    result = connection.execute("PRAGMA quick_check").fetchone()
if not result or result[0] != "ok":
    raise SystemExit(f"SQLite quick_check failed: {result}")
PY
}

if command -v python3 >/dev/null 2>&1; then
  verify_database python3
elif command -v python >/dev/null 2>&1; then
  verify_database python
elif command -v sqlite3 >/dev/null 2>&1; then
  if [ "$(sqlite3 "$DATABASE_PATH" 'PRAGMA quick_check;')" != "ok" ]; then
    echo "SQLite quick_check failed: $DATABASE_PATH" >&2
    exit 1
  fi
else
  echo "Warning: SQLite quick_check skipped because Python and sqlite3 are unavailable." >&2
fi

if [ -f "$BACKUP_DIR/SHA256SUMS" ]; then
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$BACKUP_DIR" && sha256sum -c SHA256SUMS)
  elif command -v shasum >/dev/null 2>&1; then
    (cd "$BACKUP_DIR" && shasum -a 256 -c SHA256SUMS)
  else
    echo "Warning: checksum verification skipped because no SHA-256 utility is available." >&2
  fi
fi

echo "Backup verified: $BACKUP_DIR"
