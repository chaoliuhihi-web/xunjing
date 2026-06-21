#!/bin/sh
set -eu

MYSQL_DATABASE="${MYSQL_DATABASE:-yudao_xinghe_xunjing}"

mysql_base() {
  mysql \
    --protocol=socket \
    --default-character-set=utf8mb4 \
    --user=root \
    --password="${MYSQL_ROOT_PASSWORD}" \
    "${MYSQL_DATABASE}" \
    "$@"
}

echo "Importing upstream Yudao baseline SQL with error-tolerant mode..."
if ! mysql --force \
  --protocol=socket \
  --default-character-set=utf8mb4 \
  --user=root \
  --password="${MYSQL_ROOT_PASSWORD}" \
  "${MYSQL_DATABASE}" \
  < /opt/xunjing-sql/01-ruoyi-vue-pro.sql; then
  echo "Yudao baseline import reported non-fatal statement errors; continuing with Xunjing schema."
fi

echo "Importing Yudao AI management schema..."
mysql_base < /opt/xunjing-sql/02-yudao-ai-module.sql

echo "Importing Xunjing module schema..."
mysql_base < /opt/xunjing-sql/03-xunjing-module.sql

echo "Importing Xunjing Kashgar seed data..."
mysql_base < /opt/xunjing-sql/04-xunjing-seed-kashgar-p0.sql

xunjing_table_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from information_schema.tables where table_schema = database() and table_name like 'xunjing_%';")"
if [ "${xunjing_table_count}" -le 0 ]; then
  echo "Xunjing MySQL initialization failed: no xunjing_% tables were created." >&2
  exit 1
fi

package_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from xunjing_resource_package where package_code = 'KASHGAR-MAP-001';")"
if [ "${package_count}" -le 0 ]; then
  echo "Xunjing MySQL initialization failed: Kashgar seed package KASHGAR-MAP-001 is missing." >&2
  exit 1
fi

yudao_ai_table_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from information_schema.tables where table_schema = database() and table_name in ('ai_api_key', 'ai_model', 'ai_knowledge');")"
if [ "${yudao_ai_table_count}" -ne 3 ]; then
  echo "Xunjing MySQL initialization failed: Yudao AI management tables are missing." >&2
  exit 1
fi

echo "Xunjing MySQL initialization completed with ${xunjing_table_count} xunjing tables and Yudao AI management tables."
