import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const composePath = path.join(root, 'ops', 'xunjing-platform.compose.yml');
const envExamplePath = path.join(root, 'ops', 'xunjing-platform.env.example');

describe('xunjing platform dependency compose configuration', () => {
  test('defines independent MySQL, Redis, Qdrant and MinIO services', () => {
    const compose = fs.readFileSync(composePath, 'utf8');

    expect(compose).toContain('name: xinghe-xunjing-platform');
    for (const service of ['xunjing-mysql:', 'xunjing-redis:', 'xunjing-qdrant:', 'xunjing-minio:']) {
      expect(compose).toContain(service);
    }
    for (const volume of ['xunjing-mysql-data:', 'xunjing-redis-data:', 'xunjing-qdrant-data:', 'xunjing-minio-data:']) {
      expect(compose).toContain(volume);
    }
  });

  test('initializes Yudao and Xunjing SQL in a dedicated database', () => {
    const compose = fs.readFileSync(composePath, 'utf8');

    expect(compose).toContain('MYSQL_DATABASE: ${MYSQL_DATABASE:-yudao_xinghe_xunjing}');
    expect(compose).toContain('../ops/mysql-init/xunjing-init.sh:/docker-entrypoint-initdb.d/01-xunjing-init.sh:ro');
    expect(compose).toContain('../backend/yudao/sql/mysql/ruoyi-vue-pro.sql:/opt/xunjing-sql/01-ruoyi-vue-pro.sql:ro');
    expect(compose).toContain('../backend/yudao/sql/mysql/xunjing-yudao-runtime-minimal.sql:/opt/xunjing-sql/02-xunjing-yudao-runtime-minimal.sql:ro');
    expect(compose).toContain('../backend/yudao/sql/mysql/yudao-ai-module.sql:/opt/xunjing-sql/03-yudao-ai-module.sql:ro');
    expect(compose).toContain('../backend/yudao/sql/mysql/xunjing-module.sql:/opt/xunjing-sql/04-xunjing-module.sql:ro');
    expect(compose).toContain('../backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql:/opt/xunjing-sql/05-xunjing-seed-kashgar-p0.sql:ro');
    expect(compose).toContain('../backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql:/opt/xunjing-sql/06-xunjing-seed-xicheng-p0.sql:ro');
    expect(compose).not.toContain('MYSQL_DATABASE: ruoyi-vue-pro');
  });

  test('runs Redis with an explicit project-local password', () => {
    const compose = fs.readFileSync(composePath, 'utf8');

    expect(compose).toContain('--requirepass');
    expect(compose).toContain('${REDIS_PASSWORD:-xunjing_local_redis_password}');
    expect(compose).toContain('redis-cli -a $${REDIS_PASSWORD:-xunjing_local_redis_password} ping | grep PONG');
  });

  test('uses a guarded MySQL init script because the upstream Yudao snapshot is not dependency ordered', () => {
    const initScriptPath = path.join(root, 'ops', 'mysql-init', 'xunjing-init.sh');
    const initScript = fs.readFileSync(initScriptPath, 'utf8');

    expect(initScript).toContain('import_optional_sql');
    expect(initScript).toContain('import_required_sql');
    expect(initScript).toContain('is not a regular SQL file');
    expect(initScript).toContain('mysql_base --force');
    expect(initScript).toContain('/opt/xunjing-sql/01-ruoyi-vue-pro.sql');
    expect(initScript).toContain('/opt/xunjing-sql/02-xunjing-yudao-runtime-minimal.sql');
    expect(initScript).toContain('/opt/xunjing-sql/03-yudao-ai-module.sql');
    expect(initScript).toContain('/opt/xunjing-sql/04-xunjing-module.sql');
    expect(initScript).toContain('/opt/xunjing-sql/05-xunjing-seed-kashgar-p0.sql');
    expect(initScript).toContain('/opt/xunjing-sql/06-xunjing-seed-xicheng-p0.sql');
    expect(initScript).toContain('--default-character-set=utf8mb4');
    expect(initScript).toContain('information_schema.tables');
    expect(initScript).toContain('system_tenant');
    expect(initScript).toContain('infra_api_access_log');
    expect(initScript).toContain('infra_api_error_log');
    expect(initScript).toContain('id = 1 and status = 0');
    expect(initScript).toContain('xunjing_%');
    expect(initScript).toContain("package_code = 'XICHENG-MAP-001'");
    expect(initScript).toContain("region_code = 'beijing-xicheng'");
    expect(initScript).toContain('xicheng_poi_source_doc_count');
    expect(initScript).toContain('POI 级已审核来源');
    expect(initScript).toContain("source_url in ('https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html', 'https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html')");
    expect(initScript).toContain('Xicheng approved POI seed count is below 80');
    expect(initScript).toContain('Xicheng POI-level reviewed source documents are below 80');
    expect(initScript).toContain('ai_api_key');
    expect(initScript).toContain('ai_model');
    expect(initScript).toContain('ai_knowledge');
    expect(initScript).toContain('xunjing_resource_package');
    expect(initScript).not.toContain('xunjing_product_package');
    expect(fs.statSync(initScriptPath).mode & 0o111).not.toBe(0);
  });

  test('provides the minimal Yudao runtime baseline required by local app-api readiness', () => {
    const runtimeSqlPath = path.join(root, 'backend', 'yudao', 'sql', 'mysql', 'xunjing-yudao-runtime-minimal.sql');
    const runtimeSql = fs.readFileSync(runtimeSqlPath, 'utf8');

    expect(runtimeSql).toContain('Minimal Yudao runtime baseline for Xinghe Xunjing local-candidate App API checks');
    expect(runtimeSql).toContain('This file is not a replacement for the complete upstream Yudao baseline');
    expect(runtimeSql).toContain('CREATE TABLE IF NOT EXISTS `system_tenant`');
    expect(runtimeSql).toContain('CREATE TABLE IF NOT EXISTS `infra_api_access_log`');
    expect(runtimeSql).toContain('CREATE TABLE IF NOT EXISTS `infra_api_error_log`');
    expect(runtimeSql).toContain('`tenant_id` bigint');
    expect(runtimeSql).toContain('`websites` varchar(512)');
    expect(runtimeSql).toContain('INSERT INTO `system_tenant`');
    expect(runtimeSql).toContain("'星河寻境本地联调租户'");
    expect(runtimeSql).toContain("'2099-12-31 23:59:59'");
    expect(runtimeSql).toContain('ON DUPLICATE KEY UPDATE');
  });

  test('allows app-api local seed import when Yudao admin menu table is absent', () => {
    const moduleSql = fs.readFileSync(path.join(root, 'backend', 'yudao', 'sql', 'mysql', 'xunjing-module.sql'), 'utf8');

    expect(moduleSql).toContain('CREATE PROCEDURE `xunjing_install_system_menu`');
    expect(moduleSql).toContain("table_name = 'system_menu'");
    expect(moduleSql).toContain('Skipping Xunjing admin menu install because system_menu table is missing');
    expect(moduleSql).toContain('CALL `xunjing_install_system_menu`();');
    expect(moduleSql).toContain('DROP PROCEDURE IF EXISTS `xunjing_install_system_menu`;');
  });

  test('documents local ports and isolated vector/object storage names without secrets', () => {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');

    expect(envExample).toContain('MYSQL_DATABASE=yudao_xinghe_xunjing');
    expect(envExample).toContain('REDIS_PASSWORD=xunjing_local_redis_password');
    expect(envExample).toContain('QDRANT_TEXT_COLLECTION=xinghe_xunjing_text_local');
    expect(envExample).toContain('QDRANT_IMAGE_COLLECTION=xinghe_xunjing_image_local');
    expect(envExample).toContain('MINIO_BUCKET=xinghe-xunjing');
    expect(envExample).not.toMatch(/sk-[A-Za-z0-9_-]{20,}/);
  });
});
