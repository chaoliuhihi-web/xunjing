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
    expect(compose).toContain('../backend/yudao/sql/mysql/xunjing-module.sql:/opt/xunjing-sql/02-xunjing-module.sql:ro');
    expect(compose).toContain('../backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql:/opt/xunjing-sql/03-xunjing-seed-kashgar-p0.sql:ro');
    expect(compose).not.toContain('MYSQL_DATABASE: ruoyi-vue-pro');
  });

  test('uses a guarded MySQL init script because the upstream Yudao snapshot is not dependency ordered', () => {
    const initScriptPath = path.join(root, 'ops', 'mysql-init', 'xunjing-init.sh');
    const initScript = fs.readFileSync(initScriptPath, 'utf8');

    expect(initScript).toContain('mysql --force');
    expect(initScript).toContain('/opt/xunjing-sql/01-ruoyi-vue-pro.sql');
    expect(initScript).toContain('/opt/xunjing-sql/02-xunjing-module.sql');
    expect(initScript).toContain('/opt/xunjing-sql/03-xunjing-seed-kashgar-p0.sql');
    expect(initScript).toContain('--default-character-set=utf8mb4');
    expect(initScript).toContain('information_schema.tables');
    expect(initScript).toContain('xunjing_%');
    expect(initScript).toContain('xunjing_resource_package');
    expect(initScript).not.toContain('xunjing_product_package');
    expect(fs.statSync(initScriptPath).mode & 0o111).not.toBe(0);
  });

  test('documents local ports and isolated vector/object storage names without secrets', () => {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');

    expect(envExample).toContain('MYSQL_DATABASE=yudao_xinghe_xunjing');
    expect(envExample).toContain('QDRANT_TEXT_COLLECTION=xinghe_xunjing_text_local');
    expect(envExample).toContain('QDRANT_IMAGE_COLLECTION=xinghe_xunjing_image_local');
    expect(envExample).toContain('MINIO_BUCKET=xinghe-xunjing');
    expect(envExample).not.toMatch(/sk-[A-Za-z0-9_-]{20,}/);
  });
});
