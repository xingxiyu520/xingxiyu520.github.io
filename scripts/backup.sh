#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/$STAMP}"

mkdir -p "$BACKUP_DIR"

if [ -f "$ROOT_DIR/backend/data/site.db" ]; then
  cp "$ROOT_DIR/backend/data/site.db" "$BACKUP_DIR/site.db"
fi

if [ -d "$ROOT_DIR/backend/uploads" ]; then
  tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$ROOT_DIR/backend" uploads
fi

if [ -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env" "$BACKUP_DIR/backend.env"
fi

echo "Backup saved to $BACKUP_DIR"
