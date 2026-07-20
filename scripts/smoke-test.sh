#!/usr/bin/env sh
set -eu

BASE_URL="${1:-${BASE_URL:-http://127.0.0.1}}"
BASE_URL="${BASE_URL%/}"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT HUP INT TERM

request() {
  name="$1"
  path="$2"
  expected_type="$3"
  body_path="$WORK_DIR/$name.body"
  headers_path="$WORK_DIR/$name.headers"

  curl --fail --silent --show-error \
    --connect-timeout 10 \
    --max-time 30 \
    --dump-header "$headers_path" \
    --output "$body_path" \
    "$BASE_URL$path"

  if ! grep -Eiq "^content-type:.*$expected_type" "$headers_path"; then
    echo "Unexpected content type for $path; expected $expected_type." >&2
    exit 1
  fi

  echo "PASS $path"
}

request home / 'text/html'
grep -Eq '<div[^>]+id="root"' "$WORK_DIR/home.body"

request admin /admin 'text/html'
grep -Eq '<div[^>]+id="root"' "$WORK_DIR/admin.body"

request health /api/health 'application/json'
grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"' "$WORK_DIR/health.body"
grep -Eq '"database"[[:space:]]*:[[:space:]]*"ok"' "$WORK_DIR/health.body"

request site_config /api/site-config 'application/json'
grep -Eq '"configs"[[:space:]]*:' "$WORK_DIR/site_config.body"

for endpoint in articles projects shares friend-links; do
  name="$(printf '%s' "$endpoint" | tr '-' '_')"
  request "$name" "/api/$endpoint" 'application/json'
  if ! grep -Eq '^[[:space:]]*\[' "$WORK_DIR/$name.body"; then
    echo "Expected a JSON array from /api/$endpoint." >&2
    exit 1
  fi
done

echo "Production smoke test passed: $BASE_URL"
