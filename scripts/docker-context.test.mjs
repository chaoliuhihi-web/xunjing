import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('docker build context', () => {
  test('keeps the operation guide required by release packaging tests', () => {
    const dockerignore = fs.readFileSync(path.join(root, '.dockerignore'), 'utf8');

    expect(dockerignore).toContain('!docs/02_开发规划/官网运营配置说明.md');
  });

  test('keeps tracked Yudao console contract files required by release checks', () => {
    const dockerignore = fs.readFileSync(path.join(root, '.dockerignore'), 'utf8');

    expect(dockerignore).toContain('!backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts');
    expect(dockerignore).toContain('!backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue');
  });

  test('keeps Yudao SQL contract fixtures required by release checks', () => {
    const dockerignore = fs.readFileSync(path.join(root, '.dockerignore'), 'utf8');

    expect(dockerignore).toContain('!backend/yudao/sql/mysql/xunjing-module.sql');
    expect(dockerignore).toContain('!backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql');
    expect(dockerignore).toContain('!backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql');
  });
});
