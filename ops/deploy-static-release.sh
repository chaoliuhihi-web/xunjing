#!/usr/bin/env sh
set -eu

usage() {
  cat <<'EOF'
Usage:
  SITE_ROOT=/www/wwwroot/xinghexunjing \
  XINGHE_LEAD_WEBHOOK_URL=https://your-crm.example.com/api/xinghe/leads \
  ./ops/deploy-static-release.sh /path/to/xinghexunjing-web-YYYYMMDD-HHMMSS-commit.tar.gz

Environment:
  SITE_ROOT                 Required. Versioned deployment root.
  XINGHE_LEAD_WEBHOOK_URL   Optional. Must be empty or https://.
  RELEASE_ID                Optional. Defaults to current YYYYMMDD-HHMMSS.
  NGINX_BIN                 Optional. Defaults to nginx.
  SKIP_NGINX_RELOAD         Optional. Set to 1 when nginx reload is handled elsewhere.
EOF
}

fail() {
  printf '%s\n' "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

json_string_value() {
  value=$1
  case "$value" in
    *"'"*|*\\*) fail "XINGHE_LEAD_WEBHOOK_URL contains unsupported characters" ;;
  esac
  printf "%s" "$value"
}

archive=${1:-}
if [ -z "$archive" ]; then
  usage
  exit 2
fi

[ -f "$archive" ] || fail "release archive not found: $archive"
[ -n "${SITE_ROOT:-}" ] || fail "SITE_ROOT is required"

lead_webhook=${XINGHE_LEAD_WEBHOOK_URL:-}
if [ -n "$lead_webhook" ]; then
  case "$lead_webhook" in
    https://*) ;;
    *) fail "XINGHE_LEAD_WEBHOOK_URL must be empty or start with https://" ;;
  esac
fi

require_command tar
require_command date
require_command mkdir
require_command ln
require_command mktemp
require_command cp

nginx_bin=${NGINX_BIN:-nginx}
release_id=${RELEASE_ID:-$(date +%Y%m%d-%H%M%S)}
releases_dir=$SITE_ROOT/releases
release_dir=$releases_dir/$release_id
current_link=$SITE_ROOT/current
tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/xinghexunjing-release.XXXXXX")

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT INT TERM

[ ! -e "$release_dir" ] || fail "release already exists: $release_dir"
if [ -e "$current_link" ] && [ ! -L "$current_link" ]; then
  fail "$current_link exists and is not a symlink"
fi

mkdir -p "$releases_dir"
tar -xzf "$archive" -C "$tmp_dir"

[ -f "$tmp_dir/site/index.html" ] || fail "archive missing site/index.html"
[ -f "$tmp_dir/site/runtime-config.js" ] || fail "archive missing site/runtime-config.js"
[ -f "$tmp_dir/site/healthz.json" ] || fail "archive missing site/healthz.json"

mkdir -p "$release_dir"
cp -R "$tmp_dir/site/." "$release_dir/"

escaped_webhook=$(json_string_value "$lead_webhook")
cat > "$release_dir/runtime-config.js" <<EOF
window.XINGHE_SITE_CONFIG = {
  leadWebhookUrl: '$escaped_webhook'
};
EOF

ln -sfn "$release_dir" "$current_link"

if [ "${SKIP_NGINX_RELOAD:-0}" != "1" ]; then
  require_command "$nginx_bin"
  "$nginx_bin" -t
  "$nginx_bin" -s reload
fi

printf 'Deployed %s to %s\n' "$archive" "$release_dir"
printf 'Current symlink: %s -> %s\n' "$current_link" "$release_dir"
