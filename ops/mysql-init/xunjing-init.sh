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

import_optional_sql() {
  label="$1"
  sql_path="$2"
  if [ ! -f "${sql_path}" ]; then
    echo "${label} is not a regular SQL file: ${sql_path}; skipping optional import." >&2
    return 0
  fi
  if [ ! -s "${sql_path}" ]; then
    echo "${label} is empty: ${sql_path}; skipping optional import." >&2
    return 0
  fi

  echo "Importing ${label} with error-tolerant mode..."
  if ! mysql_base --force < "${sql_path}"; then
    echo "${label} reported non-fatal statement errors; continuing with required Xunjing schema." >&2
  fi
}

import_required_sql() {
  label="$1"
  sql_path="$2"
  if [ ! -f "${sql_path}" ]; then
    echo "${label} is not a regular SQL file: ${sql_path}" >&2
    exit 1
  fi
  if [ ! -s "${sql_path}" ]; then
    echo "${label} is empty: ${sql_path}" >&2
    exit 1
  fi

  echo "Importing ${label}..."
  mysql_base < "${sql_path}"
}

import_optional_sql "upstream Yudao baseline SQL" /opt/xunjing-sql/01-ruoyi-vue-pro.sql
import_required_sql "minimal Yudao runtime baseline for local App API readiness" /opt/xunjing-sql/02-xunjing-yudao-runtime-minimal.sql
import_required_sql "Yudao AI management schema" /opt/xunjing-sql/03-yudao-ai-module.sql
import_required_sql "Xunjing module schema" /opt/xunjing-sql/04-xunjing-module.sql
import_required_sql "Xunjing Kashgar seed data" /opt/xunjing-sql/05-xunjing-seed-kashgar-p0.sql
import_required_sql "Xunjing Xicheng seed data" /opt/xunjing-sql/06-xunjing-seed-xicheng-p0.sql

yudao_runtime_table_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from information_schema.tables where table_schema = database() and table_name in ('system_tenant', 'infra_api_access_log', 'infra_api_error_log');")"
if [ "${yudao_runtime_table_count}" -ne 3 ]; then
  echo "Xunjing MySQL initialization failed: minimal Yudao runtime tables are missing." >&2
  exit 1
fi

xunjing_tenant_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from system_tenant where id = 1 and status = 0 and deleted = b'0';")"
if [ "${xunjing_tenant_count}" -le 0 ]; then
  echo "Xunjing MySQL initialization failed: tenant id=1 is missing or disabled." >&2
  exit 1
fi

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

xicheng_package_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from xunjing_resource_package where package_code = 'XICHENG-MAP-001';")"
if [ "${xicheng_package_count}" -le 0 ]; then
  echo "Xunjing MySQL initialization failed: Xicheng seed package XICHENG-MAP-001 is missing." >&2
  exit 1
fi

xicheng_poi_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from xunjing_poi where region_code = 'beijing-xicheng' and review_status = 'APPROVED';")"
if [ "${xicheng_poi_count}" -lt 80 ]; then
  echo "Xunjing MySQL initialization failed: Xicheng approved POI seed count is below 80." >&2
  exit 1
fi

xicheng_poi_source_doc_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from xunjing_knowledge_document where title like '% POI 级已审核来源' and source_url in ('https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html', 'https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html') and review_status = 'APPROVED' and vector_status = 'INDEXED';")"
if [ "${xicheng_poi_source_doc_count}" -lt 80 ]; then
  echo "Xunjing MySQL initialization failed: Xicheng POI-level reviewed source documents are below 80." >&2
  exit 1
fi

yudao_ai_table_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from information_schema.tables where table_schema = database() and table_name in ('ai_api_key', 'ai_model', 'ai_knowledge');")"
if [ "${yudao_ai_table_count}" -ne 3 ]; then
  echo "Xunjing MySQL initialization failed: Yudao AI management tables are missing." >&2
  exit 1
fi

system_menu_table_count="$(mysql_base --batch --skip-column-names --execute "select count(*) from information_schema.tables where table_schema = database() and table_name = 'system_menu';")"
if [ "${system_menu_table_count}" -le 0 ]; then
  echo "Xunjing MySQL initialization warning: system_menu is missing because upstream Yudao baseline SQL was not imported; App API seed is available, Admin menu is not installed." >&2
fi

echo "Xunjing MySQL initialization completed with ${xunjing_table_count} xunjing tables, Kashgar package and ${xicheng_poi_count} Xicheng POIs."
