#!/bin/sh
set -eu

CONFIG_FILE="${XINGHE_RUNTIME_CONFIG_FILE:-/usr/share/nginx/html/runtime-config.js}"
LEAD_WEBHOOK_URL="${XINGHE_LEAD_WEBHOOK_URL:-}"

if [ -n "$LEAD_WEBHOOK_URL" ]; then
    case "$LEAD_WEBHOOK_URL" in
        https://*) ;;
        *)
            echo "XINGHE_LEAD_WEBHOOK_URL must be empty or start with https://" >&2
            exit 1
            ;;
    esac
fi

escape_js_string() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

mkdir -p "$(dirname "$CONFIG_FILE")"
cat > "$CONFIG_FILE" <<EOF
window.XINGHE_SITE_CONFIG = {
  leadWebhookUrl: "$(escape_js_string "$LEAD_WEBHOOK_URL")"
};
EOF
